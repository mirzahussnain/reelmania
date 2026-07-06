import { useState } from "react";
import { toast } from "react-toastify";
import {
  useGenerateUploadUrlMutation,
  useUploadVideoMutation,
  useUpdateVideoMetadataMutation,
  usePublishVideoMutation,
  useFetchVideoByIdQuery,
} from "../../utils/store/features/video/videoApi";
import { useCurrentUser } from "./useCurrentUser";
import { probeMediaMeta } from "../utils/probeMedia";
import { sanitizeCategory } from "../constants/categoryVocab";
import { sanitizeSoftware } from "../constants/softwareVocab";
import { sanitizeHashtags } from "../utils/hashtags";
import type { VideoType } from "../../types";

// NATIVE upload wizard — the SAME lifecycle as the embed import flow
// (useEmbedPublishFlow), just with a different Step 1:
//   Step 1 UPLOAD    presign -> PUT to storage -> createVideo => READY-pending DRAFT
//   Step 2 DETAILS   edit metadata; category REQUIRED to continue (PATCH)
//   Step 3 REVIEW    wait for the media worker to reach READY, then publish
// The adjustment vs. embed: a native file must finish processing before it can
// go public, so Step 3 polls the row and gates Publish on processing_status.
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const useNativeUploadFlow = (onDone?: () => void) => {
  const { user, token } = useCurrentUser();
  const [generateUploadUrl] = useGenerateUploadUrlMutation();
  const [createVideo, { isLoading: isUploading }] = useUploadVideoMutation();
  const [updateMeta, { isLoading: isSaving }] = useUpdateVideoMetadataMutation();
  const [publishVideo, { isLoading: isPublishing }] = usePublishVideoMutation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [draft, setDraft] = useState<VideoType | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [softwareUsed, setSoftwareUsed] = useState<string[]>([]);

  // Poll the draft's processing status only while on the Review step and not yet
  // READY — the media worker flips UPLOADED -> READY out of band.
  const { data: polled } = useFetchVideoByIdQuery(draft?.id as string, {
    skip: !draft?.id || step !== 3,
    pollingInterval: step === 3 ? 2500 : 0,
  });
  const status = polled?.data?.processing_status ?? draft?.processing_status;
  const isReady = status === "READY";
  const isFailed = status === "FAILED";

  const reset = () => {
    setStep(1);
    setFile(null);
    if (fileURL) URL.revokeObjectURL(fileURL);
    setFileURL(null);
    setDraft(null);
    setTitle(""); setDescription(""); setHashtags([]); setCategory(""); setSoftwareUsed([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_BYTES) {
      toast.error("File exceeds the 50MB limit.");
      return;
    }
    setFile(selected);
    if (fileURL) URL.revokeObjectURL(fileURL);
    setFileURL(URL.createObjectURL(selected));
  };

  // Step 1 -> 2: upload the bytes, then create a DRAFT with a filename title the
  // creator refines in Step 2. Media metadata is provisional (server re-probes).
  const handleUpload = async () => {
    try {
      if (!token || !user?.id || !user?.username) throw new Error("You must be signed in.");
      if (!file) throw new Error("Select a video first.");

      toast.info("Uploading…");
      const { data: signed } = await generateUploadUrl({
        fileName: file.name, contentType: file.type, token,
      }).unwrap();

      const put = await fetch(signed.signedUrl, {
        method: "PUT", body: file, headers: { "Content-Type": file.type },
      });
      if (!put.ok) throw new Error("Storage upload failed.");

      const probe = await probeMediaMeta(file);
      const defaultTitle = file.name.replace(/\.[^.]+$/, "");
      const { data: created } = await createVideo({
        metadata: {
          title: defaultTitle,
          hashtags: [],
          uploaded_by: { id: user.id, username: user.username, avatar_url: user.avatar_url },
          uploaded_at: new Date(),
          ...probe,
        },
        fileName: signed.fileName,
        token,
      }).unwrap();

      setDraft(created);
      setTitle(created.title ?? defaultTitle);
      setStep(2);
    } catch (err) {
      toast.error(messageFrom(err, "Upload failed."));
    }
  };

  const handleSaveMetadata = async () => {
    try {
      if (!draft || !token) throw new Error("Nothing to save.");
      if (!title.trim()) throw new Error("Title is required.");
      if (!sanitizeCategory(category)) throw new Error("Pick a category to continue.");

      const { data: updated } = await updateMeta({
        videoId: draft.id,
        patch: {
          title: title.trim(),
          description: description.trim() || undefined,
          hashtags: sanitizeHashtags(hashtags),
          category: sanitizeCategory(category),
          software_used: sanitizeSoftware(softwareUsed),
        },
        token,
      }).unwrap();

      setDraft(updated);
      setStep(3);
    } catch (err) {
      toast.error(messageFrom(err, "Could not save."));
    }
  };

  const handlePublish = async () => {
    try {
      if (!draft || !token) throw new Error("Nothing to publish.");
      if (!isReady) throw new Error("Still processing — hang on a moment.");
      await publishVideo({ videoId: draft.id, token }).unwrap();
      toast.success("Published!");
      reset();
      onDone?.();
    } catch (err) {
      toast.error(messageFrom(err, "Publish failed."));
    }
  };

  return {
    step, setStep,
    file, fileURL, handleFileChange,
    draft, status, isReady, isFailed,
    title, setTitle,
    description, setDescription,
    hashtags, setHashtags,
    category, setCategory,
    softwareUsed, setSoftwareUsed,
    isUploading, isSaving, isPublishing,
    handleUpload, handleSaveMetadata, handlePublish, reset,
  };
};

const messageFrom = (err: unknown, fallback: string): string => {
  const data = (err as { data?: { message?: string } })?.data;
  if (data?.message) return data.message;
  if (err instanceof Error) return err.message;
  return fallback;
};

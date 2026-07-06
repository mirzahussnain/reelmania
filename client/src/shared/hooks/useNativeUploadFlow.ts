import { useState } from "react";
import { toast } from "react-toastify";
import {
  useGenerateUploadUrlMutation,
  useUploadVideoMutation,
} from "../../utils/store/features/video/videoApi";
import { useCurrentUser } from "./useCurrentUser";
import { sanitizeCategory } from "../constants/categoryVocab";
import { sanitizeSoftware } from "../constants/softwareVocab";
import { sanitizeHashtags } from "../utils/hashtags";

// NATIVE upload wizard — nothing is persisted until the FINAL step:
//   Step 1 SELECT    pick a file from disk (local blob preview only, no upload)
//   Step 2 DETAILS   fill metadata (title + category required to continue)
//   Step 3 REVIEW    feed-style preview of the clip + entered metadata; the
//                    "Upload" button is the ONLY thing that touches the network:
//                    presign -> PUT to storage -> createVideo (persists metadata,
//                    visibility PUBLIC). The media worker then fills the derived
//                    fields and flips UPLOADED -> READY; feeds require READY, so
//                    it goes live once processed.
// Because upload is deferred, Back is free and abandoning the wizard leaves
// nothing behind (no storage object, no row).
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const useNativeUploadFlow = (onDone?: () => void) => {
  const { user, token } = useCurrentUser();
  const [generateUploadUrl] = useGenerateUploadUrlMutation();
  const [createVideo, { isLoading: isUploading }] = useUploadVideoMutation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [softwareUsed, setSoftwareUsed] = useState<string[]>([]);

  const reset = () => {
    setStep(1);
    setFile(null);
    if (fileURL) URL.revokeObjectURL(fileURL);
    setFileURL(null);
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
    if (!title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, ""));
  };

  // Step 1 -> 2: purely local, no network.
  const goToDetails = () => {
    if (!file) { toast.error("Select a video first."); return; }
    setStep(2);
  };

  // Step 2 -> 3: purely local, no network. Enforce publish requirements early so
  // the Review step only ever shows a publishable clip.
  const goToReview = () => {
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!sanitizeCategory(category)) { toast.error("Pick a category to continue."); return; }
    setStep(3);
  };

  // Step 3 — the ONLY network action: upload the bytes, then persist the row with
  // the creator's metadata, public. The worker fills the derived fields after.
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

      await createVideo({
        metadata: {
          title: title.trim(),
          description: description.trim() || undefined,
          hashtags: sanitizeHashtags(hashtags),
          category: sanitizeCategory(category),
          software_used: sanitizeSoftware(softwareUsed),
          visibility: "PUBLIC",
          uploaded_by: { id: user.id, username: user.username, avatar_url: user.avatar_url },
          uploaded_at: new Date(),
        },
        fileName: signed.fileName,
        token,
      }).unwrap();

      toast.success("Uploaded! It'll go live once processing finishes.");
      reset();
      onDone?.();
    } catch (err) {
      toast.error(messageFrom(err, "Upload failed."));
    }
  };

  return {
    step, setStep,
    file, fileURL, handleFileChange,
    title, setTitle,
    description, setDescription,
    hashtags, setHashtags,
    category, setCategory,
    softwareUsed, setSoftwareUsed,
    isUploading,
    goToDetails, goToReview, handleUpload, reset,
  };
};

const messageFrom = (err: unknown, fallback: string): string => {
  const data = (err as { data?: { message?: string } })?.data;
  if (data?.message) return data.message;
  if (err instanceof Error) return err.message;
  return fallback;
};

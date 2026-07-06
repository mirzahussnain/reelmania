import { useState } from "react";
import { toast } from "react-toastify";
import {
  useUpdateVideoMetadataMutation,
  usePublishVideoMutation,
  useFetchVideoByIdQuery,
} from "../../utils/store/features/video/videoApi";
import { useCurrentUser } from "./useCurrentUser";
import { sanitizeCategory } from "../constants/categoryVocab";
import { sanitizeSoftware } from "../constants/softwareVocab";
import { sanitizeHashtags } from "../utils/hashtags";
import type { VideoType } from "../../types";

// Resume-publish flow for an EXISTING draft (from the Drafts tab). It's the tail
// of the upload/import wizards — Details -> Review -> Publish — preloaded from the
// draft. A NATIVE draft that hasn't finished processing is gated on READY (polled);
// an embed is always ready.
export const useDraftPublishFlow = (draft: VideoType | null, onDone?: () => void) => {
  const { token } = useCurrentUser();
  const [updateMeta, { isLoading: isSaving }] = useUpdateVideoMetadataMutation();
  const [publishVideo, { isLoading: isPublishing }] = usePublishVideoMutation();

  const [step, setStep] = useState<2 | 3>(2);
  const [title, setTitle] = useState(draft?.title ?? "");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [hashtags, setHashtags] = useState<string[]>(draft?.hashtags ?? []);
  const [category, setCategory] = useState(draft?.category ?? "");
  const [softwareUsed, setSoftwareUsed] = useState<string[]>(draft?.software_used ?? []);

  const isNative = draft?.source_type === "NATIVE";
  const { data: polled } = useFetchVideoByIdQuery(draft?.id as string, {
    skip: !draft?.id || step !== 3 || !isNative,
    pollingInterval: step === 3 && isNative ? 2500 : 0,
  });
  const status = polled?.data?.processing_status ?? draft?.processing_status;
  const isReady = !isNative || status === "READY";
  const isFailed = status === "FAILED";

  const handleSaveMetadata = async () => {
    try {
      if (!draft || !token) throw new Error("Nothing to save.");
      if (!title.trim()) throw new Error("Title is required.");
      if (!sanitizeCategory(category)) throw new Error("Pick a category to continue.");
      await updateMeta({
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
      onDone?.();
    } catch (err) {
      toast.error(messageFrom(err, "Publish failed."));
    }
  };

  return {
    step, setStep,
    title, setTitle,
    description, setDescription,
    hashtags, setHashtags,
    category, setCategory,
    softwareUsed, setSoftwareUsed,
    isReady, isFailed, isNative,
    isSaving, isPublishing,
    handleSaveMetadata, handlePublish,
  };
};

const messageFrom = (err: unknown, fallback: string): string => {
  const data = (err as { data?: { message?: string } })?.data;
  if (data?.message) return data.message;
  if (err instanceof Error) return err.message;
  return fallback;
};

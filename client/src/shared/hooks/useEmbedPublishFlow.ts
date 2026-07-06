import { useState } from "react";
import { toast } from "react-toastify";
import {
  useImportVideoMutation,
  useUpdateVideoMetadataMutation,
  usePublishVideoMutation,
} from "../../utils/store/features/video/videoApi";
import { useCurrentUser } from "./useCurrentUser";
import { sanitizeCategory } from "../constants/categoryVocab";
import { sanitizeSoftware } from "../constants/softwareVocab";
import { sanitizeHashtags } from "../utils/hashtags";
import type { VideoType } from "../../types";

// Orchestrates the embed DRAFT -> enrich -> publish wizard:
//   Step 1 IMPORT   paste a provider URL -> server creates a READY DRAFT
//   Step 2 METADATA edit fields; a category is REQUIRED to continue
//   Step 3 REVIEW   confirm -> publish (DRAFT -> PUBLIC)
// Each step maps to one server call (import / patch / publish). The server is the
// source of truth for the rules (dedupe, category-required, READY) — this just
// drives the UI and surfaces errors.
export type WizardStep = 1 | 2 | 3;

export const useEmbedPublishFlow = (onDone?: () => void) => {
  const { user, token } = useCurrentUser();
  const [importVideo, { isLoading: isImporting }] = useImportVideoMutation();
  const [updateMeta, { isLoading: isSaving }] = useUpdateVideoMetadataMutation();
  const [publishVideo, { isLoading: isPublishing }] = usePublishVideoMutation();

  const [step, setStep] = useState<WizardStep>(1);
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<VideoType | null>(null);

  // Metadata fields, prefilled from the imported draft.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [softwareUsed, setSoftwareUsed] = useState<string[]>([]);

  const reset = () => {
    setStep(1);
    setUrl("");
    setDraft(null);
    setTitle("");
    setDescription("");
    setHashtags([]);
    setCategory("");
    setSoftwareUsed([]);
  };

  const handleImport = async () => {
    try {
      if (!token || !user?.id || !user?.username) throw new Error("You must be signed in.");
      if (!url.trim()) throw new Error("Paste a video URL first.");

      const res = await importVideo({
        body: {
          url: url.trim(),
          uploaded_by: { id: user.id, username: user.username, avatar_url: user.avatar_url },
        },
        token,
      }).unwrap();

      const imported = res.data;
      setDraft(imported);
      // Prefill from provider enrichment; the creator refines from here.
      setTitle(imported.title ?? "");
      setDescription(imported.description ?? "");
      setHashtags(imported.hashtags ?? []);
      setCategory(imported.category ?? "");
      setSoftwareUsed(imported.software_used ?? []);
      setStep(2);
    } catch (err) {
      toast.error(messageFrom(err, "Import failed."));
    }
  };

  const handleSaveMetadata = async () => {
    try {
      if (!draft?.id || !token) throw new Error("Nothing to save.");
      if (!title.trim()) throw new Error("Title is required.");
      if (!sanitizeCategory(category)) throw new Error("Pick a category to continue.");

      const res = await updateMeta({
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

      setDraft(res.data);
      setStep(3);
    } catch (err) {
      toast.error(messageFrom(err, "Could not save."));
    }
  };

  const handlePublish = async () => {
    try {
      if (!draft?.id || !token) throw new Error("Nothing to publish.");
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
    url, setUrl,
    draft,
    title, setTitle,
    description, setDescription,
    hashtags, setHashtags,
    category, setCategory,
    softwareUsed, setSoftwareUsed,
    isImporting, isSaving, isPublishing,
    handleImport, handleSaveMetadata, handlePublish, reset,
  };
};

// RTK Query surfaces the server's { message } envelope under error.data.
const messageFrom = (err: unknown, fallback: string): string => {
  const data = (err as { data?: { message?: string } })?.data;
  if (data?.message) return data.message;
  if (err instanceof Error) return err.message;
  return fallback;
};

import React, { useRef, useState } from "react";
import { FiX, FiTrash2, FiLock, FiGlobe, FiImage } from "react-icons/fi";
import { toast } from "react-toastify";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useGetCoverUploadUrlMutation,
} from "../../../utils/store/features/collections/curationApi";
import type { CollectionListItem } from "../../contracts/api";
import { COLLECTION_NOUN } from "../../constants/curation";

const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5MB

interface EditCollectionModalProps {
  collection: CollectionListItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful delete so the parent can clear selection. */
  onDeleted?: (id: string) => void;
}

/**
 * Owner-only collection management: rename, edit description, toggle privacy,
 * or delete. Mounted from the Vault (which only ever lists the caller's own
 * collections, so every card here is owner-owned). Cover-image editing is
 * deferred until an upload path exists.
 */
export const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  collection,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { token } = useCurrentUser();
  const [updateCollection, { isLoading: isSaving }] = useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] = useDeleteCollectionMutation();
  const [getCoverUploadUrl] = useGetCoverUploadUrlMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Re-seed the form whenever a different collection is opened.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (collection && collection.id !== seededId) {
    setSeededId(collection.id);
    setTitle(collection.title);
    setDescription(collection.description ?? "");
    setIsPrivate(collection.isPrivate);
    setCoverImageUrl(collection.coverImageUrl ?? "");
    setConfirmDelete(false);
  }

  if (!collection) return null;

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      toast.error("Cover image must be under 5MB");
      return;
    }
    try {
      setIsUploadingCover(true);
      // Presign → direct PUT to storage → keep the public URL. Covers live in
      // curation-service's own bucket; old objects are cleaned up server-side.
      const { data } = await getCoverUploadUrl({ fileName: file.name, contentType: file.type, token }).unwrap();
      const put = await fetch(data.signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error("upload failed");
      setCoverImageUrl(data.publicUrl);
      toast.success("Cover uploaded — save to apply");
    } catch {
      toast.error("Could not upload cover image");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Title can't be empty");
      return;
    }
    try {
      await updateCollection({
        id: collection.id,
        title: trimmed,
        description: description.trim(),
        coverImageUrl,
        isPrivate,
        token,
      }).unwrap();
      toast.success(`${COLLECTION_NOUN} updated`);
      onClose();
    } catch {
      toast.error(`Could not update ${COLLECTION_NOUN}`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCollection({ id: collection.id, token }).unwrap();
      toast.success(`${COLLECTION_NOUN} deleted`);
      onDeleted?.(collection.id);
      onClose();
    } catch {
      toast.error(`Could not delete ${COLLECTION_NOUN}`);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      variant="center"
      className="w-full max-w-sm bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne font-bold text-lg text-on-surface">Edit {COLLECTION_NOUN}</h2>
        <Button variant="unstyled" aria-label="Close" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
          <FiX />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Cover image */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-jetbrains uppercase tracking-wide text-on-surface-variant">Cover image</span>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container border border-outline-variant/20 flex items-center justify-center">
            {coverImageUrl ? (
              <img src={coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-on-surface-variant">
                <FiImage className="text-xl" />
                <span className="text-xs">No cover — uses a video mosaic</span>
              </div>
            )}
            {isUploadingCover && (
              <div className="absolute inset-0 bg-scrim/50 flex items-center justify-center text-on-media text-sm">Uploading…</div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
            <div className="absolute bottom-2 right-2 flex gap-2">
              {coverImageUrl && (
                <Button variant="unstyled" onClick={() => setCoverImageUrl("")} className="px-2.5 py-1 rounded-full bg-media-scrim backdrop-blur-md text-on-media text-xs hover:bg-error hover:text-on-error transition-colors">
                  Remove
                </Button>
              )}
              <Button variant="unstyled" onClick={() => fileInputRef.current?.click()} disabled={isUploadingCover} className="px-2.5 py-1 rounded-full bg-media-scrim backdrop-blur-md text-on-media text-xs hover:bg-media-scrim-lg transition-colors">
                {coverImageUrl ? "Change" : "Upload"}
              </Button>
            </div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-jetbrains uppercase tracking-wide text-on-surface-variant">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant/20 outline-none text-sm text-on-surface placeholder:text-on-surface-variant font-inter focus:border-primary/50"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-jetbrains uppercase tracking-wide text-on-surface-variant">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={`What's this ${COLLECTION_NOUN} about?`}
            className="bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant/20 outline-none text-sm text-on-surface placeholder:text-on-surface-variant font-inter resize-none focus:border-primary/50"
          />
        </label>

        {/* Privacy toggle (private = PRO perk; backend gating is tracked debt). */}
        <button
          onClick={() => setIsPrivate((p) => !p)}
          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-left"
        >
          <span className="flex items-center gap-2 text-sm text-on-surface">
            {isPrivate ? <FiLock className="text-primary" /> : <FiGlobe className="text-on-surface-variant" />}
            {isPrivate ? "Private" : "Public"}
          </span>
          <span className={`relative w-10 h-6 rounded-full transition-colors ${isPrivate ? "bg-primary" : "bg-outline-variant/40"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-on-primary transition-transform ${isPrivate ? "translate-x-4" : ""}`} />
          </span>
        </button>

        <Button onClick={handleSave} loading={isSaving} disabled={isUploadingCover} fullWidth>
          Save changes
        </Button>

        {/* Delete with inline two-step confirm (no native confirm dialog). */}
        <div className="border-t border-outline-variant/10 pt-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)} fullWidth>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                loading={isDeleting}
                fullWidth
                className="bg-error text-on-error hover:bg-error/90"
              >
                Delete forever
              </Button>
            </div>
          ) : (
            <Button
              variant="unstyled"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-error hover:bg-error/10 rounded-full transition-colors"
            >
              <FiTrash2 /> Delete {COLLECTION_NOUN}
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
};

export default EditCollectionModal;

import React, { useState } from "react";
import { FiX, FiTrash2, FiLock, FiGlobe } from "react-icons/fi";
import { toast } from "react-toastify";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
} from "../../../utils/store/features/collections/curationApi";
import type { CollectionListItem } from "../../contracts/api";

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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Re-seed the form whenever a different collection is opened.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (collection && collection.id !== seededId) {
    setSeededId(collection.id);
    setTitle(collection.title);
    setDescription(collection.description ?? "");
    setIsPrivate(collection.isPrivate);
    setConfirmDelete(false);
  }

  if (!collection) return null;

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
        isPrivate,
        token,
      }).unwrap();
      toast.success("Collection updated");
      onClose();
    } catch {
      toast.error("Could not update collection");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCollection({ id: collection.id, token }).unwrap();
      toast.success("Collection deleted");
      onDeleted?.(collection.id);
      onClose();
    } catch {
      toast.error("Could not delete collection");
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
        <h2 className="font-syne font-bold text-lg text-on-surface">Edit collection</h2>
        <Button variant="unstyled" aria-label="Close" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
          <FiX />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
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
            placeholder="What's this collection about?"
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

        <Button onClick={handleSave} loading={isSaving} fullWidth>
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
              <FiTrash2 /> Delete collection
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
};

export default EditCollectionModal;

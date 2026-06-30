import React, { useState } from "react";
import { FiX, FiPlus, FiCheck } from "react-icons/fi";
import { VideoType } from "../../../types";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  useGetMyCollectionsQuery,
  useCreateCollectionMutation,
  useAddItemMutation,
  useRemoveItemMutation,
} from "../../../utils/store/features/collections/curationApi";
import {
  COLLECTION_NOUN,
  COLLECTION_NOUN_PLURAL,
  collectionCountLabel,
} from "../../constants/curation";

interface AddToCollectionModalProps {
  video: VideoType;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({ video, isOpen, onClose }) => {
  const { token } = useCurrentUser();
  const videoId = video?.id as string;
  const [newTitle, setNewTitle] = useState("");

  // List the user's collections, each flagged with whether it already contains
  // this video (?containsVideoId) so the checkmarks render without N lookups.
  const { data, isLoading } = useGetMyCollectionsQuery(
    { token, videoId },
    { skip: !token || !isOpen }
  );
  const collections = data?.data ?? [];

  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();
  const [addItem] = useAddItemMutation();
  const [removeItem] = useRemoveItemMutation();

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    // Create then immediately add the current video to the new collection.
    const created = await createCollection({ title, token }).unwrap().catch(() => null);
    const collectionId = created?.data?.id;
    if (collectionId) await addItem({ collectionId, videoId, token }).unwrap().catch(() => {});
  };

  const handleToggle = (collectionId: string, included: boolean) => {
    const op = included
      ? removeItem({ collectionId, videoId, token })
      : addItem({ collectionId, videoId, token });
    op.unwrap().catch(() => {});
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} variant="center" className="w-full max-w-sm bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne font-bold text-lg text-on-surface">Add to {COLLECTION_NOUN}</h2>
        <Button variant="unstyled" aria-label="Close" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
          <FiX />
        </Button>
      </div>

      {/* Existing collections */}
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-hide mb-4">
        {isLoading && (
          <p className="text-sm text-on-surface-variant py-4 text-center">Loading {COLLECTION_NOUN_PLURAL}…</p>
        )}
        {!isLoading && collections.length === 0 && (
          <p className="text-sm text-on-surface-variant py-4 text-center">No {COLLECTION_NOUN_PLURAL} yet — create one below.</p>
        )}
        {collections.map((c) => {
          const included = Boolean(c.containsVideo);
          return (
            <button
              key={c.id}
              onClick={() => handleToggle(c.id, included)}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors text-left"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-on-surface truncate">{c.title}</span>
                <span className="text-[11px] font-jetbrains text-on-surface-variant">{collectionCountLabel(c._count?.items ?? 0)}</span>
              </div>
              <span className={`w-6 h-6 shrink-0 rounded-md border flex items-center justify-center transition-colors ${included ? "bg-primary border-primary text-on-primary" : "border-outline-variant/40 text-transparent"}`}>
                <FiCheck className="text-sm" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Create new */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-t border-outline-variant/10 pt-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder={`New ${COLLECTION_NOUN} name…`}
          className="flex-1 w-full bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant/20 outline-none text-sm text-on-surface placeholder:text-on-surface-variant font-inter"
        />
        <Button onClick={handleCreate} disabled={!newTitle.trim() || isCreating} className="flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto">
          <FiPlus /> Create
        </Button>
      </div>
    </Sheet>
  );
};

export default AddToCollectionModal;

import React, { useState } from "react";
import { FiX, FiPlus, FiCheck } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../../../utils/hooks/storeHooks";
import { RootState } from "../../../utils/store/store";
import { createCollection, toggleVideoInCollection } from "../../../utils/store/features/collections/collectionsSlice";
import { VideoType } from "../../../types";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";

interface AddToCollectionModalProps {
  video: VideoType;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({ video, isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const collections = useAppSelector((s: RootState) => s.collections.items);
  const [newTitle, setNewTitle] = useState("");

  const item = {
    id: video?.id as string,
    title: video?.title ?? "Untitled",
    video_url: video?.video_url ?? "",
    username: video?.uploaded_by?.username,
  };

  const handleCreate = () => {
    const title = newTitle.trim();
    if (!title) return;
    dispatch(createCollection(title));
    setNewTitle("");
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} variant="center" className="w-full max-w-sm bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne font-bold text-lg text-on-surface">Add to collection</h2>
        <Button variant="unstyled" aria-label="Close" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
          <FiX />
        </Button>
      </div>

      {/* Existing collections */}
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-hide mb-4">
        {collections.length === 0 && (
          <p className="text-sm text-on-surface-variant py-4 text-center">No collections yet — create one below.</p>
        )}
        {collections.map((c) => {
          const included = c.items.some((i) => i.id === item.id);
          return (
            <button
              key={c.id}
              onClick={() => dispatch(toggleVideoInCollection({ collectionId: c.id, item }))}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors text-left"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-on-surface truncate">{c.title}</span>
                <span className="text-[11px] font-jetbrains text-on-surface-variant">{c.items.length} items</span>
              </div>
              <span className={`w-6 h-6 shrink-0 rounded-md border flex items-center justify-center transition-colors ${included ? "bg-primary border-primary text-on-primary" : "border-outline-variant/40 text-transparent"}`}>
                <FiCheck className="text-sm" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Create new */}
      <div className="flex items-center gap-2 border-t border-outline-variant/10 pt-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New collection name…"
          className="flex-1 bg-surface-container rounded-lg px-3 py-2.5 border border-outline-variant/20 outline-none text-sm text-on-surface placeholder:text-on-surface-variant font-inter"
        />
        <Button onClick={handleCreate} disabled={!newTitle.trim()} className="flex items-center gap-1.5 shrink-0">
          <FiPlus /> Create
        </Button>
      </div>
    </Sheet>
  );
};

export default AddToCollectionModal;

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { Button } from "../ui/Button";
import { MockCollection } from "../../../utils/store/features/collections/collectionsSlice";

interface CollectionModalProps {
  collection: MockCollection | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-up modal showing a collection's title + its items (videos). Tapping a
 * video opens it. Mock data today (snapshots from the collections slice).
 */
export const CollectionModal: React.FC<CollectionModalProps> = ({ collection, isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && collection && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-scrim/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-[71] h-[85dvh] bg-surface-container-low border-t border-outline-variant/20 rounded-t-3xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 px-6 pt-4 pb-4 border-b border-outline-variant/10">
              <div className="w-10 h-1 rounded-full bg-outline-variant/40 mx-auto mb-4" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-syne font-bold text-2xl md:text-3xl text-on-surface">{collection.title}</h2>
                  <p className="text-sm font-jetbrains text-on-surface-variant mt-1">{collection.items.length} items</p>
                </div>
                <Button variant="unstyled" aria-label="Close" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
                  <FiX className="text-lg" />
                </Button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
              {collection.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant">
                  <p className="font-semibold">This collection is empty.</p>
                  <p className="text-sm">Curate videos with the bookmark button to fill it.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {collection.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onClose();
                        navigate(`/videos/${item.id}`);
                      }}
                      className="card-solid relative aspect-9/16 rounded-md overflow-hidden group text-left"
                    >
                      <video src={item.video_url} muted playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-linear-to-t from-scrim/90 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-on-media font-bold text-xs line-clamp-1">{item.title}</p>
                        {item.username && <p className="text-on-media-dim text-[10px] font-jetbrains">@{item.username}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CollectionModal;

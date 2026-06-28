import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { cn } from "../../utils/cn";

type SheetVariant = "bottom" | "center";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** "bottom" slides up from the bottom edge; "center" scales in centered. */
  variant?: SheetVariant;
  /** Classes for the panel (bg, size, radius, padding, layout). */
  className?: string;
  children: React.ReactNode;
}

const PANEL_MOTION: Record<
  SheetVariant,
  { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  bottom: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },
  center: {
    initial: { opacity: 0, scale: 0.95, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 12 },
  },
};

/**
 * Overlay primitive: portalled to document.body (escapes ancestor transforms/
 * overflow), with a dimmed backdrop and an animated panel. The single home for
 * the app's modals/sheets so the scaffolding isn't re-implemented per modal.
 */
export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, variant = "center", className, children }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={cn("fixed inset-0 z-[70] flex", variant === "bottom" ? "items-end" : "items-center justify-center p-4")}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-scrim/60 backdrop-blur-sm"
          />
          <motion.div
            initial={PANEL_MOTION[variant].initial}
            animate={PANEL_MOTION[variant].animate}
            exit={PANEL_MOTION[variant].exit}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className={cn("relative", variant === "bottom" && "w-full", className)}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Sheet;

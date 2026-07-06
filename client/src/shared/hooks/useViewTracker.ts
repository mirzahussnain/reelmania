import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useRegisterViewMutation } from "../../utils/store/features/video/videoApi";

// Register a view only after the Kine has been genuinely watched, not the instant
// it scrolls past. An IntersectionObserver watches the element; once it's mostly
// on-screen a timer starts, and only if it STAYS visible for VIEW_DWELL_MS do we
// fire a single POST /:id/view. Scrolling away before the dwell cancels it.
//
// The server also dedupes per (video, viewer) for an hour, but the dwell + the
// once-per-mount guard here keep us from spamming it on every scroll/replay.
//
// Reusable across sources: pass the <video> ref for NATIVE, or the embed wrapper
// ref for a YouTube/TikTok iframe (drive the same hook from the Iframe API later).
const VIEW_DWELL_MS = 3000;
const VISIBILITY_THRESHOLD = 0.6; // ~centered / mostly on-screen

export const useViewTracker = (
  targetRef: RefObject<HTMLElement | null>,
  { videoId, viewerId }: { videoId?: string; viewerId?: string }
) => {
  const [registerView] = useRegisterViewMutation();
  const viewedRef = useRef(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !videoId) return;

    // Reset for a reused element pointing at a new video.
    viewedRef.current = false;
    let dwellTimer: ReturnType<typeof setTimeout> | null = null;

    const clearDwell = () => {
      if (dwellTimer) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (viewedRef.current) return;
        if (entry.isIntersecting) {
          if (!dwellTimer) {
            dwellTimer = setTimeout(() => {
              viewedRef.current = true;
              clearDwell();
              registerView({ videoId, viewerId: viewerId || undefined });
              observer.disconnect();
            }, VIEW_DWELL_MS);
          }
        } else {
          clearDwell(); // scrolled away before the dwell completed
        }
      },
      { threshold: VISIBILITY_THRESHOLD }
    );

    observer.observe(el);
    return () => {
      clearDwell();
      observer.disconnect();
    };
  }, [targetRef, videoId, viewerId, registerView]);
};

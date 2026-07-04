import React, { useEffect, useState } from "react";
import { HiVolumeUp, HiVolumeOff } from "react-icons/hi";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import { FeedTabs } from "./FeedTabs";

/**
 * Mobile in-feed top bar — a SINGLE fixed instance (speed · tabs · volume) that
 * sits over the feed instead of per-video controls that scroll away with each
 * card. The per-card top header is hidden on mobile (see VideoControlsOverlay);
 * this drives every <video> directly (mute/volume already sync app-wide via
 * useVideoPlayback), so the setting persists as the feed scrolls.
 *
 * Layout: speed on the left, volume on the right, tabs centered between them.
 */
const RATES = [0.5, 1, 1.5, 2];
const allVideos = () => Array.from(document.querySelectorAll("video")) as HTMLVideoElement[];

export const MobileFeedTopBar: React.FC = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  // Mirror the active video's state. volumechange/ratechange don't bubble, so
  // listen in the capture phase to catch them from any <video>.
  useEffect(() => {
    const sync = () => {
      const v = document.querySelector("video");
      if (!v) return;
      setIsMuted(v.muted);
      setVolume(v.volume);
      setRate(v.playbackRate);
    };
    sync();
    document.addEventListener("volumechange", sync, true);
    document.addEventListener("ratechange", sync, true);
    document.addEventListener("loadeddata", sync, true);
    return () => {
      document.removeEventListener("volumechange", sync, true);
      document.removeEventListener("ratechange", sync, true);
      document.removeEventListener("loadeddata", sync, true);
    };
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    allVideos().forEach((v) => { v.muted = next; });
    setIsMuted(next);
    setIsVolumeOpen(true);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    allVideos().forEach((v) => { v.volume = val; v.muted = val === 0; });
    setVolume(val);
    setIsMuted(val === 0);
  };

  const changeRate = (r: number) => {
    allVideos().forEach((v) => { v.playbackRate = r; });
    setRate(r);
    setShowSettings(false);
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-40 pt-[calc(env(safe-area-inset-top)+0.6rem)] px-3 pointer-events-none">
      {/* Click-away to dismiss the speed / volume popovers (tap anywhere else). */}
      {(showSettings || isVolumeOpen) && (
        <div
          className="fixed inset-0 z-30 pointer-events-auto"
          onClick={() => { setShowSettings(false); setIsVolumeOpen(false); }}
        />
      )}
      <div className="relative flex items-start justify-between">
        {/* Left: speed / settings */}
        <div className="relative pointer-events-auto">
          <Button
            variant="unstyled"
            className="p-2 text-on-media drop-shadow-md hover:scale-110 transition-transform"
            onClick={() => { setShowSettings((s) => !s); setIsVolumeOpen(false); }}
            aria-label="Playback speed"
          >
            <BiDotsHorizontalRounded className="text-[26px]" />
          </Button>
          {showSettings && (
            <div
              className="absolute top-11 left-0 w-32 backdrop-blur-xl rounded-xl border border-outline-variant/20 overflow-hidden flex flex-col z-50"
              style={{ background: "var(--color-media-scrim-lg)" }}
            >
              <div className="px-3 py-2 text-xs font-semibold text-on-media-dim border-b border-outline-variant/20 uppercase tracking-wider">
                Speed
              </div>
              {RATES.map((r) => (
                <Button
                  key={r}
                  variant="unstyled"
                  className={cn(
                    "px-4 py-2 text-sm text-left transition-colors hover:bg-surface-container-high",
                    rate === r ? "text-tertiary font-bold" : "text-on-media font-medium"
                  )}
                  onClick={() => changeRate(r)}
                >
                  {r === 1 ? "Normal" : `${r}x`}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Center: feed tabs, centered between the flanking controls */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1 pointer-events-auto">
          <FeedTabs variant="mobile" />
        </div>

        {/* Right: volume — tap toggles mute; a vertical slider drops below the icon. */}
        <div className="relative pointer-events-auto">
          <Button
            variant="unstyled"
            className="p-2 text-on-media drop-shadow-md hover:scale-110 transition rounded-full"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? <HiVolumeOff className="text-2xl" /> : <HiVolumeUp className="text-2xl" />}
          </Button>

          {isVolumeOpen && (
            <div
              className="absolute top-full right-1 mt-2 py-3 px-2 rounded-full backdrop-blur-md flex justify-center z-50"
              style={{ background: "var(--color-media-scrim)" }}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={changeVolume}
                aria-label="Volume"
                // Vertical orientation: max at top, min at bottom.
                style={{ writingMode: "vertical-lr", direction: "rtl" }}
                className="h-24 w-1 bg-on-media/30 appearance-none rounded cursor-pointer accent-tertiary"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFeedTopBar;

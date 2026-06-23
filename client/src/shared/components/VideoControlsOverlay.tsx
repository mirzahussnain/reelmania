import React, { useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { HiVolumeUp, HiVolumeOff } from "react-icons/hi";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { cn } from "../utils/cn";
import { Button } from "./ui/Button";

interface VideoControlsOverlayProps {
  isPlaying: boolean;
  progress: number;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  showPlayAnimation: boolean;
  togglePlayPause: () => void;
  toggleMute: () => void;
  changeVolume: (e: React.ChangeEvent<HTMLInputElement>) => void;
  changePlaybackRate: (rate: number) => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VideoControlsOverlay: React.FC<VideoControlsOverlayProps> = ({
  isPlaying,
  progress,
  isMuted,
  volume,
  playbackRate,
  showPlayAnimation,
  togglePlayPause,
  toggleMute,
  changeVolume,
  changePlaybackRate,
  handleSeek,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">
      
      {/* Invisible Click Area for Play/Pause */}
      <div 
        className="absolute inset-0 pointer-events-auto" 
        onClick={() => {
          if (showSettings) setShowSettings(false);
          else if (isVolumeOpen) setIsVolumeOpen(false);
          else togglePlayPause();
        }}
      />

      {/* Center Play/Pause Flash Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className={cn(
            "flex items-center justify-center w-20 h-20 backdrop-blur-md rounded-full text-on-media transition-all duration-500",
            showPlayAnimation ? "opacity-100 scale-100" : "opacity-0 scale-150"
          )}
          style={{ background: 'var(--color-media-scrim)' }}
        >
          {isPlaying ? <FaPlay className="text-3xl ml-1" /> : <FaPause className="text-3xl" />}
        </div>
      </div>

      {/* Top Header Controls (Settings & Mute) */}
      <div className="relative w-full p-4 flex items-start justify-between pointer-events-auto z-30">
        
        {/* Top Left: Settings / Speed Control */}
        <div className="relative">
          <Button
            variant="unstyled"
            className="p-2 text-on-media drop-shadow-md hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
              setIsVolumeOpen(false);
            }}
          >
            <BiDotsHorizontalRounded className="text-[28px]" />
          </Button>
          
          {/* Settings Menu Dropdown */}
          {showSettings && (
            <div className="absolute top-12 left-0 w-32 backdrop-blur-xl rounded-xl border border-outline-variant/20 overflow-hidden flex flex-col" style={{ background: 'var(--color-media-scrim-lg)' }}>
              <div className="px-3 py-2 text-xs font-semibold text-on-media-dim border-b border-outline-variant/20 uppercase tracking-wider">
                Speed
              </div>
              {[0.5, 1, 1.5, 2].map((rate) => (
                <Button
                  key={rate}
                  variant="unstyled"
                  className={cn(
                    "px-4 py-2 text-sm text-left transition-colors hover:bg-surface-container-high",
                    playbackRate === rate ? "text-tertiary font-bold" : "text-on-media font-medium"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    changePlaybackRate(rate);
                    setShowSettings(false);
                  }}
                >
                  {rate === 1 ? "Normal" : `${rate}x`}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Top Right: Volume Toggle & Slider */}
        <div 
          className={cn(
            "relative flex items-center group/volume transition-all duration-300 ease-in-out",
            isVolumeOpen ? "backdrop-blur-md rounded-full shadow-lg pr-1" : ""
          )}
          style={isVolumeOpen ? { background: 'var(--color-media-scrim)' } : undefined}
          onMouseEnter={() => setIsVolumeOpen(true)}
          onMouseLeave={() => setIsVolumeOpen(false)}
        >
          {/* Expanding Volume Slider */}
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out flex items-center h-10",
            isVolumeOpen ? "w-24 pl-4 pr-1 opacity-100" : "w-0 px-0 opacity-0"
          )}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={changeVolume}
              className="w-full h-1 bg-on-media/30 appearance-none rounded cursor-pointer accent-tertiary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <Button
            variant="unstyled"
            className="p-2 text-on-media drop-shadow-md hover:scale-110 transition z-10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
              setIsVolumeOpen(true);
              setShowSettings(false);
            }}
          >
            {isMuted || volume === 0 ? <HiVolumeOff className="text-2xl" /> : <HiVolumeUp className="text-2xl" />}
          </Button>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="relative w-full h-1 group pointer-events-auto z-30">
        {/* The thin custom track */}
        <div className="absolute bottom-0 w-full h-[3px] bg-on-media/20 group-hover:h-1.5 transition-all">
          <div 
            className="h-full bg-tertiary transition-all relative"
            style={{ width: `${progress}%` }}
          >
            {/* Scrubber Knob (visible on hover) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md shadow-tertiary/50 transform translate-x-1/2" />
          </div>
        </div>
        
        {/* Invisible interactive native range slider mapped strictly to the track */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSeek}
          className="absolute bottom-0 w-full h-4 opacity-0 cursor-pointer translate-y-1.5"
        />
      </div>

    </div>
  );
};

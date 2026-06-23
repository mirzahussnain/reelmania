import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiCheck } from "react-icons/fi";
import { cn } from "../utils/cn";

interface AvatarConnectBadgeProps {
  username: string;
  avatarUrl?: string;
  isConnected?: boolean;
  onConnect?: () => void;
  className?: string; // Additional classes for the wrapper if needed
  sizeClassName?: string; // e.g., "w-12 h-12"
  isFollowing?: boolean;
  isOwnProfile?: boolean;
}

export const AvatarConnectBadge: React.FC<AvatarConnectBadgeProps> = ({
  username,
  avatarUrl,
  isConnected = false,
  onConnect,
  className,
  sizeClassName = "w-12 h-12 text-lg",
  isFollowing = false,
  isOwnProfile = false,
}) => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "hidden">(
    isConnected || isFollowing || isOwnProfile ? "hidden" : "idle"
  );

  useEffect(() => {
    if (isFollowing || isOwnProfile) {
      setStatus("hidden");
    } else {
      // No longer following (e.g. unfollowed elsewhere): show the connect
      // affordance again, but don't interrupt an in-progress connect animation.
      setStatus((prev) => (prev === "hidden" ? "idle" : prev));
    }
  }, [isFollowing, isOwnProfile]);

  const handleConnect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setStatus("loading");
    if (onConnect) onConnect();

    // Simulate the animation sequence
    setTimeout(() => {
      setStatus("success");

      // Hide the badge after showing the checkmark
      setTimeout(() => {
        setStatus("hidden");
      }, 1500);

    }, 1500); // Slower 1.5s animation
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className, sizeClassName)}>

      {/* The Animated SVG Ring around the whole Avatar */}
      {status === "loading" && (
        <svg className="absolute inset-0 w-full h-full scale-[1.15] -rotate-90 pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="48"
            stroke="currentColor" strokeWidth="6" fill="none"
            className="text-primary opacity-20"
          />
          <circle
            cx="50" cy="50" r="48"
            stroke="currentColor" strokeWidth="6" fill="none"
            className="text-primary drop-shadow-[0_0_12px_rgba(208,188,255,1)] animate-circle-fill"
            strokeLinecap="round"
            style={{ strokeDasharray: 301.59 }}
          />
        </svg>
      )}

      {/* The User Avatar */}
      <Link
        to={`/users/@${username}`}
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-10 shadow-lg"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="w-full h-full object-cover scale-105" />
        ) : (
          <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
            <span className="font-bold text-on-surface-variant uppercase select-none">
              {username?.charAt(0) || "U"}
            </span>
          </div>
        )}
      </Link>

      {/* The Bottom Connect Badge */}
      {status !== "hidden" && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
          {status === "idle" && (
            <button
              onClick={handleConnect}
              className="bg-primary text-on-primary rounded-full p-[3px] glow-primary-sm hover:scale-110 hover:bg-on-surface hover:text-primary transition-transform duration-200"
              title="Connect"
            >
              <FiPlus className="w-3 h-3" strokeWidth={3.5} />
            </button>
          )}

          {status === "loading" && (
            <div className="w-[18px] h-[18px] rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center animate-pulse" />
          )}

          {status === "success" && (
            <div
              className="bg-primary text-on-primary rounded-full p-[3px] glow-primary-sm animate-in zoom-in duration-300"
              title="Connected"
            >
              <FiCheck className="w-3 h-3" strokeWidth={3.5} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

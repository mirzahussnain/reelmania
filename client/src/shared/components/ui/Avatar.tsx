import React, { useState } from "react";
import { cn } from "../../utils/cn";
import { BADGE_ASSETS } from "../../constants/badges";
import { BadgeModal } from "./Badge";
import { Button } from "./Button";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE: Record<AvatarSize, string> = {
  sm: "w-10 h-10",
  md: "w-12 h-12 text-lg",
  lg: "w-20 h-20 text-2xl",
  xl: "w-32 h-32 lg:w-40 lg:h-40 text-4xl",
};

interface AvatarProps {
  src?: string;
  username?: string;
  size?: AvatarSize;
  /** "full" for circular (default), "2xl" for the squared Vault style. */
  shape?: "full" | "2xl";
  verified?: boolean;
  online?: boolean;
  ring?: boolean;
  className?: string;
}

// Avatar image with initial fallback and optional verified / online badges.
export const Avatar: React.FC<AvatarProps> = ({
  src,
  username,
  size = "md",
  shape = "full",
  verified = false,
  online = false,
  ring = false,
  className,
}) => {
  const radius = shape === "full" ? "rounded-full" : "rounded-2xl";
  const [badgeOpen, setBadgeOpen] = useState(false);
  return (
    <div className={cn("relative shrink-0 inline-flex", SIZE[size], className)}>
      <div
        className={cn(
          "w-full h-full overflow-hidden flex items-center justify-center bg-surface-container-low",
          radius,
          ring && "ring-2 ring-outline-variant/30 glow-black"
        )}
      >
        {src ? (
          <img src={src} alt={username || "avatar"} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-on-surface-variant uppercase select-none">
            {username?.charAt(0) || "U"}
          </span>
        )}
      </div>

      {verified && (
        <>
          <Button
            variant="unstyled"
            title="Verified"
            aria-label="Verified"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBadgeOpen(true);
            }}
            className="absolute -bottom-3 -right-4 w-2/5 h-2/5 min-w-[36px] min-h-[36px] flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
          >
            <img
              src={BADGE_ASSETS.verified}
              alt="Verified"
              className="w-full h-full object-contain scale-125 drop-shadow-[0_0_5px_rgba(208,188,255,0.5)]"
            />
          </Button>
          <BadgeModal
            badge={{ id: "verified", label: "Verified" }}
            src={BADGE_ASSETS.verified}
            isOpen={badgeOpen}
            onClose={() => setBadgeOpen(false)}
          />
        </>
      )}
      {online && !verified && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary border-2 border-surface" />
      )}
    </div>
  );
};

export default Avatar;

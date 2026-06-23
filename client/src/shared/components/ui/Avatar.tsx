import React from "react";
import { MdVerified } from "react-icons/md";
import { cn } from "../../utils/cn";

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
        <div className="absolute -bottom-1 -right-1 w-1/4 h-1/4 min-w-[20px] min-h-[20px] rounded-full bg-primary flex items-center justify-center border-[3px] border-surface-container">
          <MdVerified className="text-on-primary w-2/3 h-2/3" />
        </div>
      )}
      {online && !verified && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary border-2 border-surface" />
      )}
    </div>
  );
};

export default Avatar;

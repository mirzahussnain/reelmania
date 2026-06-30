import React, { useRef, useState } from "react";
import { cn } from "../../utils/cn";

interface CarouselProps {
  /** One slide per child. */
  children: React.ReactNode[];
  className?: string;
  /** Width of each slide. Defaults to ~80% so the next card peeks in. */
  slideClassName?: string;
}

/**
 * Horizontal scroll-snap carousel with dot indicators at the bottom. The active
 * dot tracks the slide nearest the scroll centre; tapping a dot scrolls to it.
 * Used on mobile where a grid of cards would otherwise stack vertically.
 */
export const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  slideClassName = "w-[80%]",
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setActive(nearest);
  };

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const el = track.children[i] as HTMLElement | undefined;
    if (el) track.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" });
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 pb-4 scrollbar-hide"
      >
        {children.map((child, i) => (
          <div key={i} className={cn("shrink-0 snap-center", slideClassName)}>
            {child}
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center items-center gap-2 mt-2">
        {children.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === active ? "w-5 bg-primary" : "w-2 bg-on-surface-variant/30"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;

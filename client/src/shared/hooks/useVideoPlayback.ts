import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export const useVideoPlayback = (setIsModalOpen: ({ isOpen }: { isOpen: boolean }) => void) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handleUnmuteAllVideos = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      const allVideos = document.querySelectorAll("video");
      if (!target.muted) {
        allVideos.forEach((video) => {
          video.muted = false;
          video.volume = target.volume;
        });
      } else {
        allVideos.forEach((video) => {
          video.muted = true;
        });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (videoRef.current) {
              videoRef.current.play();
            }
            gsap.to(videoRef.current, {
              opacity: 1,
              duration: 0.5,
              ease: "power1.out",
            });
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsModalOpen({ isOpen: false });
            }
            gsap.to(videoRef.current, {
              opacity: 0.5,
              duration: 0.5,
              ease: "power1.out",
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
      videoRef.current.addEventListener("volumechange", handleUnmuteAllVideos);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
        videoRef.current.removeEventListener("volumechange", handleUnmuteAllVideos);
      }
    };
  }, [setIsModalOpen]);

  return videoRef;
};

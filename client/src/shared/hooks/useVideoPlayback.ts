import { useEffect, useRef } from "react";

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
              videoRef.current.style.opacity = "1";
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.style.opacity = "0.5";
              setIsModalOpen({ isOpen: false });
            }
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

import { useState, useEffect, RefObject } from "react";

export const useCustomPlayer = (videoRef: RefObject<HTMLVideoElement | null>) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlayAnimation, setShowPlayAnimation] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(currentProgress);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChangeEvent = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };
    const handleRateChange = () => setPlaybackRate(video.playbackRate);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChangeEvent);
    video.addEventListener("ratechange", handleRateChange);

    // Initial state setup
    setIsPlaying(!video.paused);
    setIsMuted(video.muted);
    setVolume(video.volume);
    setPlaybackRate(video.playbackRate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChangeEvent);
      video.removeEventListener("ratechange", handleRateChange);
    };
  }, [videoRef]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    
    // Trigger the center animation flash
    setShowPlayAnimation(true);
    setTimeout(() => setShowPlayAnimation(false), 500);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = Number(e.target.value);
    video.volume = newVolume;
    video.muted = newVolume === 0;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (Number(e.target.value) / 100) * video.duration;
    video.currentTime = newTime;
    setProgress(Number(e.target.value));
  };

  return {
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
  };
};

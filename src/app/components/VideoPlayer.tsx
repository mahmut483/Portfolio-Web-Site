"use client";

import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  id?: string;
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoPlayer({
  id,
  src,
  poster,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Fullscreen letterboxing is handled by the video:fullscreen rule in globals.css
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Başka bir video oynatıldığında bu videoyu durdur
    const handleOtherVideo = (e: Event) => {
      const customEvent = e as CustomEvent<{ target: HTMLVideoElement }>;
      if (customEvent.detail && customEvent.detail.target !== video) {
        video.pause();
      }
    };

    // Oyun oynanmaya başladığında bu videoyu durdur
    const handleGamePlaying = (e: MessageEvent) => {
      if (e.data === "game-playing") {
        video.pause();
      }
    };

    // Tab gizlendiğinde videoyu durdur
    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      }
    };

    window.addEventListener("app:video-play", handleOtherVideo);
    window.addEventListener("message", handleGamePlaying);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("app:video-play", handleOtherVideo);
      window.removeEventListener("message", handleGamePlaying);
      document.removeEventListener("visibilitychange", handleVisibility);
      video.pause();
      if (!video.isConnected) {
        video.removeAttribute("src");
        video.load();
      }
    };
  }, []);

  const handlePlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;

    // 1. Diğer tüm videolara bildirim gönder ve onları durdur
    window.dispatchEvent(
      new CustomEvent("app:video-play", { detail: { target: video } })
    );

    // 2. Varsa sayfadaki tüm oyun iframe'lerinin sesini durdur
    document.querySelectorAll("iframe").forEach((frame) => {
      try {
        frame.contentWindow?.postMessage("pause-audio", "*");
      } catch {}
    });
  };

  return (
    <video
      ref={videoRef}
      id={id}
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      onPlay={handlePlay}
      className={className}
    />
  );
}

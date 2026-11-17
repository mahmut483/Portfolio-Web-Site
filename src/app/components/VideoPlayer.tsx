"use client";

import { useRef, useEffect } from "react";
import { track } from "../lib/analytics";
import { videoTitle } from "../lib/videos";

interface VideoPlayerProps {
  id?: string;
  src: string;
  poster?: string;
  className?: string;
  // "none" (default) waits for play, so videos further down the page don't fetch on load.
  // Use "metadata" where a script needs the video ready, e.g. the iPhone fullscreen button.
  preload?: "none" | "metadata";
}

export default function VideoPlayer({
  id,
  src,
  poster,
  className,
  preload = "none",
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

    // Analytics: start, 25/50/75% milestones, completion and real seconds watched
    // (seeking doesn't count as watching; watch time is sent whenever playback stops)
    const title = videoTitle(src);
    const percentOf = (seconds: number) =>
      Number.isFinite(video.duration) && video.duration > 0 ? Math.round((seconds / video.duration) * 100) : undefined;
    let started = false;
    let watched = 0;
    let unsent = 0;
    let last: number | null = null;
    const milestones = new Set<number>();

    const onStart = () => {
      last = video.currentTime;
      if (!started) {
        started = true;
        track("video_start", { video_title: title });
      }
    };
    const onTime = () => {
      const t = video.currentTime;
      if (last !== null && !video.paused) {
        const delta = t - last;
        if (delta > 0 && delta < 1.5) {
          watched += delta;
          unsent += delta;
        }
      }
      last = t;
      const pct = percentOf(t) ?? 0;
      for (const m of [25, 50, 75]) {
        if (pct >= m && !milestones.has(m)) {
          milestones.add(m);
          track("video_progress", { video_title: title, percent: m });
        }
      }
    };
    const flush = (reason: string) => {
      if (unsent < 1) return;
      track("video_watch_time", {
        video_title: title,
        seconds: Math.round(unsent),
        total_seconds: Math.round(watched),
        percent_watched: percentOf(watched),
        reason,
      });
      unsent = 0;
    };
    const onPause = () => {
      flush("pause");
      last = null;
    };
    const onEnded = () => {
      track("video_complete", { video_title: title });
      flush("ended");
    };
    const onSeeking = () => {
      last = null;
    };
    const onLeave = () => flush("leave");
    video.addEventListener("play", onStart);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("seeking", onSeeking);
    window.addEventListener("pagehide", onLeave);

    window.addEventListener("app:video-play", handleOtherVideo);
    window.addEventListener("message", handleGamePlaying);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      onLeave();
      video.removeEventListener("play", onStart);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeking", onSeeking);
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("app:video-play", handleOtherVideo);
      window.removeEventListener("message", handleGamePlaying);
      document.removeEventListener("visibilitychange", handleVisibility);
      video.pause();
      if (!video.isConnected) {
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [src]);

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
      aria-label={videoTitle(src)}
      controls
      playsInline
      preload={preload}
      onPlay={handlePlay}
      className={className}
    />
  );
}

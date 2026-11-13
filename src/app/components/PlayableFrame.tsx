"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { Play } from "./icons";

interface PlayableFrameProps {
  src: string;
  cover: string;
  title: string;
  className?: string;
  sizes?: string;
}

export default function PlayableFrame({
  src,
  cover,
  title,
  className = "w-[min(100%,calc(78svh*9/16))] aspect-[9/16] mx-auto",
  sizes = "(max-width: 640px) 100vw, 440px",
}: PlayableFrameProps) {
  const [started, setStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // With cacheComponents, a page the visitor leaves stays mounted but hidden
  // (React <Activity>). Resetting here unmounts the iframe, so the Unity build
  // or playable does not keep its memory and GPU context on other pages.
  useLayoutEffect(() => {
    return () => setStarted(false);
  }, []);

  // Tab arka plana geçtiğinde oyun sesini durdur
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        iframeRef.current?.contentWindow?.postMessage("pause-audio", "*");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Keyboard and screen reader users land inside the game once it starts
  useEffect(() => {
    if (started) iframeRef.current?.focus();
  }, [started]);

  const handleStart = () => {
    // Oyunu başlatmadan önce sayfadaki TÜM videoları durdur
    document.querySelectorAll("video").forEach((v) => v.pause());
    setStarted(true);
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-line bg-black hover:border-line-strong transition-colors ${className}`}
    >
      {started ? (
        <iframe
          ref={iframeRef}
          src={src}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen"
          title={title}
        />
      ) : (
        <button
          type="button"
          onClick={handleStart}
          className="group absolute inset-0 w-full h-full cursor-pointer"
          aria-label={`Play ${title}`}
        >
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover"
            sizes={sizes}
            loading="eager"
          />
          <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-xl shadow-black/40 transition-transform group-hover:scale-105 group-active:scale-95">
            <Play className="size-3.5" />
            Play
          </span>
        </button>
      )}
    </div>
  );
}

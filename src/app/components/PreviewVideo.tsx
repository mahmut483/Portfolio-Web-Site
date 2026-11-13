"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface PreviewVideoProps {
  src: string;
  poster: string;
  sizes: string;
}

// Muted loop that plays only while on screen. The poster stays underneath, so
// reduced motion, data saver or a blocked autoplay simply leave the still image.
export default function PreviewVideo({ src, poster, sizes }: PreviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    let onScreen = false;

    const sync = () => {
      if (onScreen && !reducedMotion.matches && !saveData && !document.hidden) {
        if (!video.getAttribute("src")) video.src = src;
        video.muted = true;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.3 },
    );
    observer.observe(video);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    // Pause only: Next keeps hidden routes mounted, so the element and its source stay
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [src]);

  return (
    <>
      <Image src={poster} alt="" fill sizes={sizes} loading="eager" className="object-cover" />
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          playing ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const GREETING_DURATION_MS = 6_000;
const LOAD_TIMEOUT_MS = 6_000;
const VIDEO_START_TIMEOUT_MS = 3_500;
const VIDEO_PLAY_TIMEOUT_MS = 8_000;

export default function BituWelcome({ onComplete }: { onComplete: () => void }) {
  const [canPlay] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia(
      "(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)",
    ).matches,
  );
  const [useVideo, setUseVideo] = useState(() =>
    canPlay && /\b(?:Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent),
  );
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!useVideo) return;
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    void video.play().catch(() => {
      if (active) {
        setLoaded(false);
        setUseVideo(false);
      }
    });
    return () => { active = false; };
  }, [useVideo]);

  useEffect(() => {
    if (!canPlay) {
      onComplete();
      return;
    }

    if (useVideo && !loaded) {
      const timer = window.setTimeout(() => setUseVideo(false), VIDEO_START_TIMEOUT_MS);
      return () => window.clearTimeout(timer);
    }

    const duration = useVideo ? VIDEO_PLAY_TIMEOUT_MS : loaded ? GREETING_DURATION_MS : LOAD_TIMEOUT_MS;
    const timer = window.setTimeout(onComplete, duration);
    return () => window.clearTimeout(timer);
  }, [canPlay, loaded, onComplete, useVideo]);

  if (!canPlay) return null;

  const className =
    "pointer-events-none absolute bottom-0 right-0 z-50 hidden h-[clamp(150px,23dvh,220px)] w-auto lg:block motion-reduce:hidden " +
    (loaded ? "" : "invisible");

  if (useVideo) {
    return (
      <video
        ref={videoRef}
        aria-hidden="true"
        src="/bitu/bitu-welcome-wave.webm"
        width={304}
        height={288}
        autoPlay
        muted
        playsInline
        onPlaying={() => setLoaded(true)}
        onEnded={onComplete}
        onError={() => {
          setLoaded(false);
          setUseVideo(false);
        }}
        className={className}
      />
    );
  }

  return (
    <Image
      alt=""
      aria-hidden="true"
      src="/bitu/bitu-welcome-wave.webp"
      width={304}
      height={288}
      unoptimized
      loading="eager"
      onLoad={() => setLoaded(true)}
      onError={onComplete}
      className={className}
    />
  );
}

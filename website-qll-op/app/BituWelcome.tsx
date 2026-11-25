"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./BituWelcome.module.css";

const RUN_START_SECONDS = 4.72;
const LEFT_EDGE_SECONDS = 6.95;

export default function BituWelcome({ onComplete }: { onComplete: () => void }) {
  const [canPlay] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)").matches,
  );
  const [useVideo, setUseVideo] = useState(() =>
    canPlay && /\b(?:Chrome|HeadlessChrome|Chromium|Edg|OPR)\//.test(navigator.userAgent),
  );
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const showImageFallback = useCallback(() => {
    setUseVideo(false);
    setLoaded(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const layer = video?.parentElement;
    if (!useVideo || !video || !layer) return;

    let frameId: number | undefined;
    let lastProgress = 0;
    const moveWithVideo = () => {
      const progress = Math.min(
        Math.max(0, video.currentTime - RUN_START_SECONDS) / (LEFT_EDGE_SECONDS - RUN_START_SECONDS),
        1,
      );
      if (progress !== lastProgress) {
        layer.style.transform = `translate3d(calc((100% - 100vw) * ${progress.toFixed(5)}), 0, 0)`;
        lastProgress = progress;
      }
      if (progress < 1) frameId = window.requestAnimationFrame(moveWithVideo);
    };
    const beginMovement = () => {
      if (frameId === undefined && video.currentTime >= RUN_START_SECONDS - 0.3) {
        frameId = window.requestAnimationFrame(moveWithVideo);
      }
    };
    video.addEventListener("timeupdate", beginMovement);

    let active = true;
    void video.play().catch(() => {
      if (active) showImageFallback();
    });
    return () => {
      active = false;
      video.removeEventListener("timeupdate", beginMovement);
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      layer.style.removeProperty("transform");
    };
  }, [useVideo, showImageFallback]);

  useEffect(() => {
    if (!canPlay) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(
      useVideo && !loaded ? showImageFallback : onComplete,
      loaded ? 12_000 : useVideo ? 4_000 : 10_000,
    );
    return () => window.clearTimeout(timer);
  }, [canPlay, loaded, onComplete, showImageFallback, useVideo]);

  if (!canPlay) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 right-0 z-50 hidden h-[clamp(150px,23dvh,220px)] aspect-video lg:block motion-reduce:hidden ${loaded ? (useVideo ? styles.videoLayer : styles.crossScreen) : "invisible"}`}
      onAnimationEnd={onComplete}
    >
      {useVideo ? (
        <video
          ref={videoRef}
          src="/bitu/bitu-wave-run-native.webm"
          width={416}
          height={234}
          autoPlay
          muted
          playsInline
          onPlaying={() => setLoaded(true)}
          onEnded={onComplete}
          onError={showImageFallback}
          className="block h-full w-full"
        />
      ) : (
        <Image
          alt=""
          src="/bitu/bitu-wave-run-native.webp"
          width={416}
          height={234}
          unoptimized
          loading="eager"
          onLoad={() => setLoaded(true)}
          onError={onComplete}
          className="block h-full w-full"
        />
      )}
    </div>
  );
}

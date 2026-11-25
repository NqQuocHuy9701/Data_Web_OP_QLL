"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./BituWelcome.module.css";

export default function BituWelcome({ onComplete }: { onComplete: () => void }) {
  const [canPlay] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)").matches,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!canPlay) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(onComplete, loaded ? 14_000 : 10_000);
    return () => window.clearTimeout(timer);
  }, [canPlay, loaded, onComplete]);

  if (!canPlay) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 right-0 z-50 hidden h-[clamp(150px,23dvh,220px)] lg:block motion-reduce:hidden ${loaded ? styles.crossScreen : "invisible"}`}
      onAnimationEnd={onComplete}
    >
      <Image
        alt=""
        src="/bitu/bitu-wave-run-slow.webp"
        width={416}
        height={234}
        unoptimized
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={onComplete}
        className="block h-full w-auto"
      />
    </div>
  );
}

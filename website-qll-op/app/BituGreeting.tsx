import Image from "next/image";

export default function BituGreeting({ className }: { className?: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      src="/bitu/bitu-wave-loop.webp"
      width={360}
      height={600}
      unoptimized
    />
  );
}

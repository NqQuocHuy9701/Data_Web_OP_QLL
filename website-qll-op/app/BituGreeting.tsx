import Image from "next/image";

export default function BituGreeting({ className }: { className?: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      src="/bitu/bitu-chot-loop.webp"
      width={396}
      height={550}
      unoptimized
    />
  );
}

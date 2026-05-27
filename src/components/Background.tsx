import Image from "next/image";

export function Background() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden
    >
      <Image
        src="/site-bg.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/25 via-navy-900/50 to-navy-900/80" />
      <div className="absolute inset-0 bg-radial-glow opacity-40" />
    </div>
  );
}

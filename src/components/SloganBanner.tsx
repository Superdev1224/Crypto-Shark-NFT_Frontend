export function SloganBanner() {
  return (
    <section
      aria-label="Crypto Sharks slogan"
      className="relative border-b border-cyan-400/15 bg-navy-900/30 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 md:py-6 overflow-x-auto">
        <p
          className="
            font-display uppercase text-center leading-tight
            text-[30px] tracking-[0.08em]
            sm:text-[36px] sm:tracking-[0.10em]
            md:text-[42px] md:tracking-[0.12em] md:whitespace-nowrap
            lg:text-[48px] lg:tracking-[0.14em]
            text-cyan-100
          "
        >
          <span className="md:inline">We swim alone,</span>{" "}
          <span className="text-cyan-300 md:inline">but eat together</span>
        </p>
      </div>
      <div className="neon-divider" aria-hidden />
    </section>
  );
}

interface MarqueeProps {
  className?: string;
  theme?: 'dark' | 'light' | 'terracotta';
}

export function Marquee({ className = '', theme = 'dark' }: MarqueeProps) {
  const items = [
    '100% INDIE WORKSHOPS',
    '95% DIRECT TO MAKER',
    'NO FACTORY MASS PRODUCTION',
    'SMALL-BATCH DROPS ONLY',
    'PLASTIC-FREE ATELIER PACKAGING',
    'HAND-THROWN & BENCH-BUILT',
    'VERIFIED STUDIO PROVENANCE',
    'SLOW LIVING & HEIRLOOM CRAFT',
    'CARBON-NEUTRAL DISPATCH'
  ];

  const themeClasses = {
    dark: 'bg-ink text-linen border-ink/80',
    light: 'bg-linen/90 text-ink border-hairline',
    terracotta: 'bg-terracotta text-white border-terracotta/90'
  }[theme];

  return (
    <div
      className={`relative w-full overflow-hidden border-y py-3 select-none ${themeClasses} ${className}`}
      aria-label="Studio announcements"
    >
      <div className="animate-marquee flex items-center gap-8 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.22em]">
        {/* Render twice for seamless infinite looping */}
        {[...items, ...items].map((text, idx) => (
          <span key={idx} className="inline-flex items-center gap-8">
            <span>{text}</span>
            <span className="text-terracotta text-xs opacity-80" aria-hidden="true">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

interface ArtisanLogoProps {
  className?: string;
  size?: number;
}

export function ArtisanLogo({ className = 'h-11 w-11', size = 44 }: ArtisanLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Atelier Parchment Plaque */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="#FAF7F2"
        stroke="#E5DDD0"
        strokeWidth="1.5"
      />

      {/* Artisan Atelier Corner Stamps (representing Artisan's Corner) */}
      <path
        d="M6 14V8C6 6.89543 6.89543 6 8 6H14"
        stroke="#C85A32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M42 34V40C42 41.1046 41.1046 42 40 42H34"
        stroke="#C85A32"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Wheel-Thrown Ceramic / Craft Vase Silhouette */}
      <path
        d="M24 9C20.5 9 17 11.5 17 15C17 18.5 19 20.8 20 23.5C21 26.5 22 30.5 19 34.5C18.4 35.3 19 36.5 20.5 36.5H27.5C29 36.5 29.6 35.3 29 34.5C26 30.5 27 26.5 28 23.5C29 20.8 31 18.5 31 15C31 11.5 27.5 9 24 9Z"
        fill="url(#artisan-terracotta)"
      />

      {/* Ceramic Rim Highlight */}
      <ellipse cx="24" cy="12" rx="4.5" ry="1.5" fill="#FAF7F2" opacity="0.9" />

      {/* Maker's Guild Star Center */}
      <circle cx="24" cy="22" r="1.8" fill="#FAF7F2" />

      <defs>
        <linearGradient
          id="artisan-terracotta"
          x1="17"
          y1="9"
          x2="31"
          y2="36.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D96840" />
          <stop offset="1" stopColor="#A84326" />
        </linearGradient>
      </defs>
    </svg>
  );
}

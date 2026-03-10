import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const GamesHubLogo: React.FC<LogoProps> = ({
  size = 36,
  showText = true,
  className = '',
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    {/* SVG Icon */}
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 drop-shadow-md"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#ec4899" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#fda4af" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>

      {/* Background pill */}
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#logoGrad)" />

      {/* Controller body */}
      <rect x="9" y="17" width="30" height="16" rx="8" fill="white" fillOpacity="0.95" />

      {/* D-pad left cluster */}
      <rect x="13" y="23" width="6" height="2.5" rx="1.2" fill="url(#logoGrad)" />
      <rect x="15.2" y="21" width="2.5" height="6" rx="1.2" fill="url(#logoGrad)" />

      {/* Heart on right side instead of ABXY */}
      <path
        d="M32 22.5 C32 21.1 30.9 20 29.5 20 C28.7 20 28 20.4 27.5 21 C27 20.4 26.3 20 25.5 20 C24.1 20 23 21.1 23 22.5 C23 25 27.5 28 27.5 28 C27.5 28 32 25 32 22.5Z"
        fill="url(#heartGrad)"
      />

      {/* Select / start dots */}
      <circle cx="21" cy="25" r="1.2" fill="#d1d5db" />
      <circle cx="24" cy="25" r="1.2" fill="#d1d5db" />

      {/* Sparkle top-right */}
      <circle cx="38" cy="10" r="2" fill="#fde68a" />
      <line x1="38" y1="7" x2="38" y2="6"   stroke="#fde68a" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="38" y1="13" x2="38" y2="14" stroke="#fde68a" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="35" y1="10" x2="34" y2="10" stroke="#fde68a" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="41" y1="10" x2="42" y2="10" stroke="#fde68a" strokeWidth="1.2" strokeLinecap="round" />
    </svg>

    {/* Text */}
    {showText && (
      <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent select-none leading-none">
        Games<span className="font-black">Hub</span>
      </span>
    )}
  </div>
);

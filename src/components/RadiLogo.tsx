import React, { useState } from 'react';
import { RADI_LOGO } from '../assets/plantBackground';

interface RadiLogoProps {
  className?: string;
}

/**
 * Radi Energy Solutions logo lockup — rendered from high-resolution base64 data URI
 * with instant load time and inline vector SVG fallback.
 */
export const RadiLogo: React.FC<RadiLogoProps> = ({ className = 'h-8' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`flex items-center gap-1.5 shrink-0 select-none ${className}`}>
        <div className="h-full aspect-square bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-md p-1 flex items-center justify-center shadow-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>
        <div className="flex flex-col justify-center leading-none">
          <span className="text-[11px] font-black tracking-tight text-slate-900 uppercase">RADI</span>
          <span className="text-[7px] font-bold tracking-wider text-amber-600 uppercase">ENERGY SOLUTIONS</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={RADI_LOGO}
      alt="Radi Energy Solutions"
      className={`h-full w-auto object-contain ${className}`}
      loading="eager"
      onError={() => setHasError(true)}
    />
  );
};


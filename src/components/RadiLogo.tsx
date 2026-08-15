import React, { useState } from 'react';

interface RadiLogoProps {
  className?: string;
}

export const RadiLogo: React.FC<RadiLogoProps> = ({ className = "h-8" }) => {
  const [imgError, setImgError] = useState(false);
  const [useSecondary, setUseSecondary] = useState(false);

  // Google Drive file ID: 1ZeEat97cbj7r3W35lhj-9wcqiPLStZBp
  const primaryUrl = "https://lh3.googleusercontent.com/d/1ZeEat97cbj7r3W35lhj-9wcqiPLStZBp";
  const secondaryUrl = "https://drive.google.com/thumbnail?id=1ZeEat97cbj7r3W35lhj-9wcqiPLStZBp&sz=w1000";

  const currentUrl = useSecondary ? secondaryUrl : primaryUrl;

  const handleImageError = () => {
    if (!useSecondary) {
      setUseSecondary(true);
    } else {
      setImgError(true);
    }
  };

  if (!imgError) {
    return (
      <div className={`flex items-center shrink-0 ${className}`}>
        <img
          src={currentUrl}
          alt="Radi Energy Solutions Logo"
          className="h-full w-auto object-contain max-h-10 transition-all duration-200"
          onError={handleImageError}
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>
    );
  }

  // High-fidelity SVG vector fallback for Radi Energy Solutions
  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      <div className="h-full aspect-square bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 rounded-lg p-1.5 flex items-center justify-center shadow-xs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.3" />
        </svg>
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-sm font-black tracking-tight text-slate-900 leading-none uppercase">RADI</span>
        <span className="text-[9px] font-bold tracking-wider text-amber-600 leading-none mt-0.5 uppercase">ENERGY SOLUTIONS</span>
      </div>
    </div>
  );
};

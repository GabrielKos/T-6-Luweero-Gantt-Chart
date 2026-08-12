import React from 'react';

interface KmcLogoProps {
  className?: string;
}

export const KmcLogo: React.FC<KmcLogoProps> = ({ className = "h-7" }) => {
  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 500 215"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto object-contain"
      >
        {/* Main KMC Red Shapes */}
        <g fill="#E31B23">
          {/* Letter K */}
          <path d="M 22 172 L 72 16 L 126 16 L 82 108 L 140 16 L 195 16 L 130 112 L 147 172 L 98 172 L 91 128 L 70 172 Z" />
          {/* Letter M */}
          <path d="M 168 172 L 202 75 L 240 172 L 273 172 L 305 75 L 338 172 L 382 172 L 342 16 L 293 16 L 258 112 L 222 16 L 175 16 L 138 172 Z" />
          {/* Letter C */}
          <path d="M 362 65 C 378 16 430 16 480 16 L 480 44 C 445 44 415 48 406 80 C 395 118 412 144 448 144 C 470 144 485 130 485 130 L 485 100 L 415 100 L 415 74 L 485 74 L 485 172 C 455 172 422 172 390 152 C 352 128 348 88 362 65 Z" />
        </g>
        {/* Dynamic Curved Swoosh in White cutting across the K, M, C */}
        <path fill="#FFFFFF" d="M 48 104 C 180 135 320 60 482 60 C 330 65 200 110 110 160 C 70 135 52 112 48 104 Z" />
        {/* Registered Emblem */}
        <g fill="#E31B23">
          <circle cx="482" cy="168" r="7" stroke="#E31B23" strokeWidth="2" fill="none" />
          <text x="482" y="171.5" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#E31B23">R</text>
        </g>
      </svg>
    </div>
  );
};

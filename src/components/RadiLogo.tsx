import React from 'react';
import { RADI_LOGO } from '../assets/plantBackground';

interface RadiLogoProps {
  className?: string;
}

/**
 * Radi Energy Solutions lockup — served locally from public/assets rather
 * than fetched from Google Drive. That removes the old retry/fallback dance
 * (the Drive thumbnail endpoint was flaky and blocked in some networks) and,
 * just as importantly, makes the logo same-origin so the PNG/PDF export
 * renderers can draw it straight onto a canvas without tainting it.
 */
export const RadiLogo: React.FC<RadiLogoProps> = ({ className = 'h-8' }) => (
  <img
    src={RADI_LOGO}
    alt="Radi Energy Solutions — Powering the Future"
    className={`h-full w-auto object-contain ${className}`}
    loading="eager"
  />
);

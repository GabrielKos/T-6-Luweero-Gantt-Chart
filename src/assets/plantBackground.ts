// Brand media for the T-6 Luweero battery pack plant workplan.
//
// Served as plain static files under /assets (Vite's `public/` dir) rather
// than embedded as base64 data URLs. That keeps the JS bundle small and,
// because the files are same-origin, <img> tags, canvas drawImage() and
// jsPDF's addImage() can all use them without any cross-origin tainting —
// no fetch/proxy dance needed for the PNG snapshot or PDF exports.
export const PLANT_BACKGROUND = '/assets/plant-bg.jpg';
export const RADI_LOGO = '/assets/radi-logo.png';

// Native pixel size of radi-logo.png — lets export code size the white pill
// to the logo's real aspect ratio (≈3.13:1) instead of guessing.
export const RADI_LOGO_ASPECT = 516 / 165;

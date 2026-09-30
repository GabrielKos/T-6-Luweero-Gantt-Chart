import { RADI_LOGO } from '../assets/plantBackground';
import { saveBrandingLogo, subscribeToBrandingLogo } from './firebase';

const STORAGE_KEY = 'radi_custom_logo';
const EVENT_NAME = 'radi_logo_updated';

/**
 * Returns the currently active brand logo data URI:
 * 1. Checks localStorage ('radi_custom_logo')
 * 2. Falls back to the authentic master RADI_LOGO (1000x1100 high-res PNG)
 */
export function getActiveLogo(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.length > 50) {
        return stored;
      }
    } catch {
      // localStorage may fail in restricted contexts; fallback cleanly
    }
  }
  return RADI_LOGO;
}

/**
 * Saves a new logo data URI to:
 * 1. LocalStorage for immediate, offline, zero-latency access
 * 2. Firestore system_config/branding for multi-device real-time sync
 * 3. Broadcasts an event to all components and windows
 */
export async function saveActiveLogo(dataUrl: string): Promise<void> {
  if (!dataUrl) return;

  // 1. LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, dataUrl);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: dataUrl }));
    } catch (e) {
      console.warn('Failed to set localStorage radi_custom_logo:', e);
    }
  }

  // 2. Firestore Sync
  try {
    await saveBrandingLogo(dataUrl);
  } catch (err) {
    console.warn('Failed to sync branding logo to Firestore:', err);
  }
}

/**
 * Subscribes to logo changes across:
 * - Current window custom events
 * - Other browser tabs (window 'storage' event)
 * - Firestore real-time snapshot sync
 */
export function subscribeToLogo(callback: (logoUrl: string) => void): () => void {
  // Fire initial value
  callback(getActiveLogo());

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<string>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      callback(e.newValue);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  // Subscribe to Firestore for real-time multi-device sync
  const unsubscribeFirestore = subscribeToBrandingLogo((remoteLogo) => {
    if (remoteLogo && remoteLogo.length > 50) {
      try {
        localStorage.setItem(STORAGE_KEY, remoteLogo);
      } catch {
        // ignore
      }
      callback(remoteLogo);
    }
  });

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EVENT_NAME, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
    unsubscribeFirestore();
  };
}

/**
 * Loads the active brand logo into an HTMLImageElement ready for high-resolution canvas or PDF rendering.
 */
export function getActiveLogoImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const src = getActiveLogo();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If custom logo fails to load, fallback to default master RADI_LOGO
      if (src !== RADI_LOGO) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => reject(new Error('Failed to load branding logo'));
        fallbackImg.src = RADI_LOGO;
      } else {
        reject(new Error('Failed to load branding logo'));
      }
    };
    img.src = src;
  });
}

/**
 * Initializes branding sync on application boot:
 * - Pre-populates localStorage with the authentic master RADI_LOGO if not yet set
 * - Listens to Firestore to receive any team-wide logo updates
 */
export function initBrandingSync(): () => void {
  if (typeof window !== 'undefined') {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing || existing.length < 50) {
        localStorage.setItem(STORAGE_KEY, RADI_LOGO);
      }
    } catch {
      // ignore
    }
  }

  return subscribeToBrandingLogo((remoteLogo) => {
    if (remoteLogo && remoteLogo.length > 50) {
      try {
        localStorage.setItem(STORAGE_KEY, remoteLogo);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: remoteLogo }));
        }
      } catch {
        // ignore
      }
    }
  });
}

import React, { useState, useEffect, useRef } from 'react';
import { getActiveLogo, saveActiveLogo, subscribeToLogo } from '../lib/branding';
import { Upload, Check } from 'lucide-react';

interface RadiLogoProps {
  className?: string;
  allowUpload?: boolean;
}

/**
 * Radi Energy Systems Ltd logo component.
 *
 * 1. Default: High-resolution authentic master lockup (1000x1100) with true brand typography and emblem.
 * 2. Instant Upload: Users can click directly on the badge to upload their exact "Radi Logo.jpeg" from disk.
 * 3. Real-Time Sync: Uploaded custom logo persists in localStorage and syncs across devices via Firestore.
 */
export const RadiLogo: React.FC<RadiLogoProps> = ({ className = 'h-full w-full', allowUpload = true }) => {
  const [logoSrc, setLogoSrc] = useState<string>(getActiveLogo);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to shared branding logo in localStorage and Firestore
  useEffect(() => {
    const unsubscribe = subscribeToLogo((newLogo) => {
      if (newLogo) {
        setLogoSrc(newLogo);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the user's authentic local file directly
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoSrc(dataUrl);
        await saveActiveLogo(dataUrl);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative group flex items-center justify-center select-none ${className}`}
      title="Click or hover to upload custom Radi Logo file directly from your computer"
    >
      <img
        src={logoSrc}
        alt="Radi Energy Systems Ltd - Powering the Future"
        className="h-full w-full object-contain pointer-events-none transition-transform duration-200 group-hover:scale-[1.02]"
        loading="eager"
        decoding="sync"
      />

      {allowUpload && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            className="hidden"
          />

          {/* Quick upload hover trigger */}
          <button
            type="button"
            onClick={triggerUpload}
            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center p-1 text-white backdrop-blur-[1px] cursor-pointer"
            aria-label="Upload original Radi Logo from computer"
            title="Upload original Radi Logo file"
          >
            {uploadSuccess ? (
              <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
            ) : (
              <Upload className="w-4 h-4 text-white" />
            )}
            <span className="text-[7.5px] font-bold text-center leading-tight mt-0.5 text-white/90">
              {uploadSuccess ? 'Updated!' : 'Upload'}
            </span>
          </button>
        </>
      )}
    </div>
  );
};

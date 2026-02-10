'use client';

import { useState } from 'react';

interface ScreenshotImageProps {
  src: string;
  backupSrc?: string | null;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ScreenshotImage({ src, backupSrc, alt, className, onClick }: ScreenshotImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const activeSrc = useFallback && backupSrc ? backupSrc : src;

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => {
        if (!useFallback && backupSrc) setUseFallback(true);
      }}
    />
  );
}

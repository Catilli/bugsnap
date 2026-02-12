'use client';

import { useState } from 'react';

interface ScreenshotImageProps {
  src: string;
  backupSrc?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export function ScreenshotImage({ src, backupSrc, alt, className, style, onClick }: ScreenshotImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const activeSrc = useFallback && backupSrc ? backupSrc : src;

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      onError={() => {
        if (!useFallback && backupSrc) setUseFallback(true);
      }}
    />
  );
}

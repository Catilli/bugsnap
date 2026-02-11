'use client';

import { useState, useRef, useCallback } from 'react';
import { safeHref } from '../lib/safeUrl';

interface AnnotationData {
  id?: string;
  type: string;
  coordinates: any;
  content?: string;
  color?: string;
}

interface PinData {
  clickX: number;
  clickY: number;
  devicePixelRatio: number;
  viewportWidth: number;
  viewportHeight: number;
  url: string;
  innerText?: string;
  cssSelector?: string;
  tagName?: string;
  boundingClientRect?: { x: number; y: number; width: number; height: number };
}

interface AnnotatedLightboxProps {
  src: string;
  backupSrc?: string | null;
  alt: string;
  annotations?: AnnotationData[];
  pinData?: PinData | null;
  annotationCanvasSize?: { width: number; height: number } | null;
}

export default function AnnotatedLightbox({
  src,
  backupSrc,
  alt,
  annotations,
  pinData,
  annotationCanvasSize,
}: AnnotatedLightboxProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const activeSrc = useFallback && backupSrc ? backupSrc : src;

  const handleLoad = useCallback(() => {
    const img = imgRef.current;
    if (img) {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  // Compute scale factor: annotations were drawn at canvas size, image displays at natural size
  const scale = naturalSize && annotationCanvasSize
    ? naturalSize.w / annotationCanvasSize.width
    : 1;

  // Build pin navigation URL with scroll-to-text fragment
  const pinHref = pinData?.url
    ? buildPinUrl(pinData.url, pinData.innerText)
    : null;

  // Compute pin position in image pixel space
  const pinPos = pinData && naturalSize
    ? getPinPosition(pinData, naturalSize)
    : null;

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        className="max-w-none"
        onLoad={handleLoad}
        onError={() => {
          if (!useFallback && backupSrc) setUseFallback(true);
        }}
      />

      {/* SVG annotation overlay */}
      {naturalSize && annotations && annotations.length > 0 && (
        <svg
          className="absolute top-0 left-0"
          width={naturalSize.w}
          height={naturalSize.h}
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
            </marker>
          </defs>
          {annotations.map((ann, i) => (
            <AnnotationShape key={ann.id || i} annotation={ann} scale={scale} />
          ))}
        </svg>
      )}

      {/* Clickable pin overlay */}
      {pinPos && (
        <PinOverlay
          x={pinPos.x}
          y={pinPos.y}
          href={pinHref}
          label={pinData!.tagName}
          innerText={pinData!.innerText}
        />
      )}
    </div>
  );
}

function AnnotationShape({ annotation, scale }: { annotation: AnnotationData; scale: number }) {
  const { type, coordinates, content, color = '#ef4444' } = annotation;

  switch (type) {
    case 'rectangle': {
      const { x, y, width, height } = coordinates;
      return (
        <rect
          x={x * scale}
          y={y * scale}
          width={width * scale}
          height={height * scale}
          stroke={color}
          strokeWidth={2}
          fill={hexToRgba(color, 0.1)}
        />
      );
    }
    case 'highlighter': {
      const { x, y, width, height } = coordinates;
      return (
        <rect
          x={x * scale}
          y={y * scale}
          width={width * scale}
          height={height * scale}
          stroke="none"
          fill={hexToRgba(color, 0.3)}
        />
      );
    }
    case 'arrow': {
      const { startX, startY, endX, endY } = coordinates;
      return (
        <line
          x1={startX * scale}
          y1={startY * scale}
          x2={endX * scale}
          y2={endY * scale}
          stroke={color}
          strokeWidth={2}
          markerEnd="url(#arrowhead)"
          style={{ color }}
        />
      );
    }
    case 'pen': {
      const points = coordinates.points as Array<{ x: number; y: number }>;
      if (!points || points.length < 2) return null;
      const d = points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'}${p.x * scale},${p.y * scale}`
      ).join(' ');
      return (
        <path
          d={d}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    case 'text': {
      const { x, y } = coordinates;
      return (
        <g>
          <rect
            x={x * scale - 4}
            y={y * scale - 14}
            width={(content || '').length * 8 + 8}
            height={20}
            rx={4}
            fill="rgba(0,0,0,0.6)"
          />
          <text
            x={x * scale}
            y={y * scale}
            fill="#fff"
            fontSize={14}
            fontFamily="Arial, sans-serif"
          >
            {content}
          </text>
        </g>
      );
    }
    default:
      return null;
  }
}

function PinOverlay({
  x,
  y,
  href,
  label,
  innerText,
}: {
  x: number;
  y: number;
  href: string | null;
  label?: string;
  innerText?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const tooltipText = [label, innerText?.substring(0, 40)].filter(Boolean).join(': ');

  const pin = (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'auto',
        cursor: href ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Teardrop pin SVG */}
      <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
        <path
          d="M14 0C6.268 0 0 6.268 0 14c0 9.8 14 24 14 24s14-14.2 14-24C28 6.268 21.732 0 14 0z"
          fill="#dc2626"
          stroke="#fff"
          strokeWidth="1.5"
        />
        <circle cx="14" cy="13" r="5" fill="#fff" />
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap shadow-lg">
          {href ? 'Click to view on page' : 'Pinned element'}
          {tooltipText && <span className="block text-gray-300 text-[10px]">{tooltipText}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {pin}
      </a>
    );
  }
  return pin;
}

// --- Helpers ---

function getPinPosition(
  pinData: PinData,
  naturalSize: { w: number; h: number },
): { x: number; y: number } {
  const dpr = pinData.devicePixelRatio || 1;

  // New issues: use clickX/clickY
  if (pinData.clickX != null && pinData.clickY != null) {
    return {
      x: pinData.clickX * dpr,
      y: pinData.clickY * dpr,
    };
  }

  // Old issues: fallback to center of boundingClientRect
  if (pinData.boundingClientRect) {
    const { x, y, width, height } = pinData.boundingClientRect;
    return {
      x: (x + width / 2) * dpr,
      y: (y + height / 2) * dpr,
    };
  }

  // Last resort: center of image
  return { x: naturalSize.w / 2, y: naturalSize.h / 2 };
}

function buildPinUrl(baseUrl: string, innerText?: string): string | null {
  const safe = safeHref(baseUrl);
  if (!safe) return null;

  if (innerText && innerText.trim().length > 0) {
    const text = innerText.trim().substring(0, 80);
    return `${safe}#:~:text=${encodeURIComponent(text)}`;
  }
  return safe;
}

function hexToRgba(hex: string, alpha: number): string {
  // Handle non-hex colors gracefully
  if (!hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

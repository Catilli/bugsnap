'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MousePointer2, Square, MoveRight, PenTool, Type, Highlighter,
  Undo2, Redo2, Trash2, X, Save,
} from 'lucide-react';
import { authFetch } from '../lib/api';
import { notifyError } from '../lib/toast';

// @ts-ignore — vanilla JS class, no types
import MarkMyImage from '../lib/markMyImage';

interface AnnotationEditorModalProps {
  isOpen: boolean;
  screenshotUrl: string;
  backupScreenshotUrl?: string | null;
  annotations: any[];
  issueId: string;
  onSave: (updatedIssue: any) => void;
  onCancel: () => void;
}

const TOOLS = [
  { id: 'cursor', label: 'Select', icon: MousePointer2 },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'arrow', label: 'Arrow', icon: MoveRight },
  { id: 'pen', label: 'Pen', icon: PenTool },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
] as const;

const COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#000000', label: 'Black' },
];

export default function AnnotationEditorModal({
  isOpen,
  screenshotUrl,
  backupScreenshotUrl,
  annotations,
  issueId,
  onSave,
  onCancel,
}: AnnotationEditorModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const markMyImageRef = useRef<any>(null);

  const [activeTool, setActiveTool] = useState('rectangle');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [isSaving, setIsSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const activeSrc = useFallback && backupScreenshotUrl ? backupScreenshotUrl : screenshotUrl;

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  // Init MarkMyImage after image loads
  useEffect(() => {
    if (!imgLoaded || !containerRef.current) return;

    const mmi = new MarkMyImage(containerRef.current, {
      strokeColor: activeColor,
    });
    markMyImageRef.current = mmi;

    if (annotations && annotations.length > 0) {
      mmi.setAnnotations(JSON.parse(JSON.stringify(annotations)));
    }
    mmi.saveToHistory();

    return () => {
      mmi.destroy();
      markMyImageRef.current = null;
    };
  }, [imgLoaded]); // only re-init when image loads

  // Sync tool changes
  useEffect(() => {
    markMyImageRef.current?.setTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    markMyImageRef.current?.setColor(activeColor);
  }, [activeColor]);

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);
  };

  const handleColorChange = (color: string) => {
    setActiveColor(color);
  };

  const handleUndo = () => markMyImageRef.current?.undo();
  const handleRedo = () => markMyImageRef.current?.redo();
  const handleDelete = () => markMyImageRef.current?.deleteSelectedAnnotation();

  const handleSave = async () => {
    if (!markMyImageRef.current || !imgRef.current) return;
    setIsSaving(true);

    try {
      const updatedAnnotations = markMyImageRef.current.getAnnotations();

      // Composite: draw image + annotation canvas onto a temp canvas
      const img = imgRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const tempCtx = tempCanvas.getContext('2d')!;

      // Draw the base image
      tempCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

      // Draw the annotation canvas scaled to natural size
      const annCanvas = markMyImageRef.current.canvas;
      if (annCanvas.width > 0 && annCanvas.height > 0) {
        tempCtx.drawImage(annCanvas, 0, 0, img.naturalWidth, img.naturalHeight);
      }

      const compositeDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);

      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annotations: updatedAnnotations,
            screenshotUrl: compositeDataUrl,
          }),
        },
      );

      if (response.ok) {
        const updatedIssue = await response.json();
        onSave(updatedIssue);
      } else {
        notifyError('Failed to save annotations');
      }
    } catch {
      notifyError('Failed to save annotations');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-800">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-1">
          {/* Tool buttons */}
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleToolChange(id)}
              className={`p-2 rounded transition-colors ${
                activeTool === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-600 mx-2" />

          {/* Color palette */}
          {COLORS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleColorChange(value)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                activeColor === value ? 'border-white scale-110' : 'border-transparent hover:border-gray-400'
              }`}
              style={{ backgroundColor: value }}
              title={label}
            />
          ))}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-600 mx-2" />

          {/* Undo / Redo / Delete */}
          <button onClick={handleUndo} className="p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors" title="Undo (Ctrl+Z)">
            <Undo2 className="w-5 h-5" />
          </button>
          <button onClick={handleRedo} className="p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors" title="Redo (Ctrl+Y)">
            <Redo2 className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors" title="Delete selected">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Screenshot container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div
          ref={containerRef}
          className="relative"
          style={{ display: imgLoaded ? 'block' : 'none' }}
        >
          <img
            ref={imgRef}
            src={activeSrc}
            alt="Screenshot"
            crossOrigin="anonymous"
            className="max-w-full max-h-[calc(100vh-80px)] object-contain select-none"
            draggable={false}
            onLoad={(e) => {
              setImgLoaded(true);
              // Size the container to match the rendered image dimensions
              const img = e.currentTarget;
              if (containerRef.current) {
                containerRef.current.style.width = `${img.clientWidth}px`;
                containerRef.current.style.height = `${img.clientHeight}px`;
              }
            }}
            onError={() => {
              if (!useFallback && backupScreenshotUrl) {
                setUseFallback(true);
              }
            }}
          />
        </div>

        {/* Loading state */}
        {!imgLoaded && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
            Loading screenshot...
          </div>
        )}
      </div>
    </div>
  );
}

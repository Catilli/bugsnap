'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  icon?: React.ReactNode;
  variant?: 'danger' | 'default';
  confirmLabel?: string;
  cancelLabel?: string;
}

interface LightboxOptions {
  src: string;
  backupSrc?: string | null;
  alt?: string;
}

interface ConfirmEntry {
  id: number;
  type: 'confirm';
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface LightboxEntry {
  id: number;
  type: 'lightbox';
  options: LightboxOptions;
}

type DialogEntry = ConfirmEntry | LightboxEntry;

interface DialogContextValue {
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  openLightbox: (options: LightboxOptions) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

let nextId = 0;

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogEntry[]>([]);
  const dialogsRef = useRef(dialogs);
  dialogsRef.current = dialogs;

  const dismiss = useCallback((id: number, value: boolean) => {
    setDialogs((prev) => {
      const entry = prev.find((d) => d.id === id);
      if (entry && entry.type === 'confirm') entry.resolve(value);
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  const openConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const id = ++nextId;
      setDialogs((prev) => [...prev, { id, type: 'confirm', options, resolve }]);
    });
  }, []);

  const openLightbox = useCallback((options: LightboxOptions) => {
    const id = ++nextId;
    setDialogs((prev) => [...prev, { id, type: 'lightbox', options }]);
  }, []);

  // Escape key handler — capture phase so it fires before Drawer's bubble-phase handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialogsRef.current.length > 0) {
        e.stopImmediatePropagation();
        const top = dialogsRef.current[dialogsRef.current.length - 1];
        dismiss(top.id, false);
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [dismiss]);

  return (
    <DialogContext.Provider value={{ openConfirm, openLightbox }}>
      {children}

      {dialogs.map((dialog, index) => {
        const zIndex = 60 + index * 10;

        if (dialog.type === 'lightbox') {
          return (
            <div
              key={dialog.id}
              className="fixed inset-0 bg-black/90 flex items-center justify-center"
              style={{ zIndex }}
              onClick={() => dismiss(dialog.id, false)}
            >
              <button
                onClick={() => dismiss(dialog.id, false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <LightboxImage
                src={dialog.options.src}
                backupSrc={dialog.options.backupSrc}
                alt={dialog.options.alt || 'Screenshot'}
              />
            </div>
          );
        }

        const { options } = dialog;
        const isDanger = options.variant === 'danger';

        return (
          <div
            key={dialog.id}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex }}
          >
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => dismiss(dialog.id, false)}
            />

            {/* Dialog */}
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
              <div className="flex items-center mb-4">
                {options.icon && (
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      isDanger ? 'bg-red-100' : 'bg-gray-100'
                    }`}
                  >
                    {options.icon}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{options.title}</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">{options.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => dismiss(dialog.id, false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {options.cancelLabel || 'Cancel'}
                </button>
                <button
                  onClick={() => dismiss(dialog.id, true)}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    isDanger
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {options.confirmLabel || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </DialogContext.Provider>
  );
}

function LightboxImage({ src, backupSrc, alt }: { src: string; backupSrc?: string | null; alt: string }) {
  const [useFallback, setUseFallback] = useState(false);
  const activeSrc = useFallback && backupSrc ? backupSrc : src;

  return (
    <img
      src={activeSrc}
      alt={alt}
      className="w-full h-full object-contain"
      onClick={(e) => e.stopPropagation()}
      onError={() => {
        if (!useFallback && backupSrc) setUseFallback(true);
      }}
    />
  );
}

'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  notFound?: boolean;
  notFoundMessage?: string;
  header?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  isLoading,
  notFound,
  notFoundMessage = 'Not found',
  header,
  headerActions,
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="!m-0">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-full md:w-[600px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {header}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : notFound ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">{notFoundMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

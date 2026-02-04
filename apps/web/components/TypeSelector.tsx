'use client';

import { Bug, Lightbulb } from 'lucide-react';

interface TypeSelectorProps {
  value: 'BUG' | 'FEATURE';
  onChange: (type: 'BUG' | 'FEATURE') => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('BUG')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
          value === 'BUG'
            ? 'border-red-500 bg-red-50 text-red-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        <Bug className="w-5 h-5" />
        <span className="font-medium">Bug Report</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('FEATURE')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
          value === 'FEATURE'
            ? 'border-purple-500 bg-purple-50 text-purple-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        <Lightbulb className="w-5 h-5" />
        <span className="font-medium">Feature Request</span>
      </button>
    </div>
  );
}

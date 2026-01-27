'use client';

import { useState, useRef, useEffect } from 'react';

type SortOption = {
  label: string;
  value: string;
};

type OrderOption = {
  label: string;
  value: string;
};

interface SortDropdownProps {
  sortOptions: SortOption[];
  orderOptions: OrderOption[];
  selectedSort: string;
  selectedOrder: string;
  onSortChange: (value: string) => void;
  onOrderChange: (value: string) => void;
}

export default function SortDropdown({
  sortOptions,
  orderOptions,
  selectedSort,
  selectedOrder,
  onSortChange,
  onOrderChange,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the label for the selected sort option
  const selectedSortLabel = sortOptions.find((opt) => opt.value === selectedSort)?.label || 'Sort';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white text-sm font-medium text-gray-700"
      >
        <span>{selectedSortLabel}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {/* Grid icon */}
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Sort by Section */}
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Sort by
            </div>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                  }}
                  className="flex items-center w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  {selectedSort === option.value && (
                    <svg
                      className="w-4 h-4 mr-2 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={selectedSort === option.value ? '' : 'ml-6'}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Order Section */}
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Order
            </div>
            <div className="space-y-1">
              {orderOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onOrderChange(option.value);
                  }}
                  className="flex items-center w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  {selectedOrder === option.value && (
                    <svg
                      className="w-4 h-4 mr-2 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={selectedOrder === option.value ? '' : 'ml-6'}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Grid2x2, Check } from 'lucide-react';

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
        className="flex items-center gap-2 pl-4 pr-[0.75rem] py-[0.625rem] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white text-sm font-medium text-gray-700"
      >
        <span>{selectedSortLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
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
                    <Check className="w-4 h-4 mr-2 text-gray-700" />
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
                    <Check className="w-4 h-4 mr-2 text-gray-700" />
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
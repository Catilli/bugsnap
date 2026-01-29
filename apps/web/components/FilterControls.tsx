'use client';

import { useState } from 'react';
import { Search, Grid2x2, List } from 'lucide-react';
import SortDropdown from './SortDropdown';

type ViewMode = 'grid' | 'list';

type SortOption = {
  label: string;
  value: string;
};

type OrderOption = {
  label: string;
  value: string;
};

interface FilterControlsProps {
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOptions: SortOption[];
  orderOptions: OrderOption[];
  selectedSort: string;
  selectedOrder: string;
  onSortChange: (value: string) => void;
  onOrderChange: (value: string) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewModeToggle?: boolean;
}

export default function FilterControls({
  searchPlaceholder = 'Search...',
  searchQuery,
  onSearchChange,
  sortOptions,
  orderOptions,
  selectedSort,
  selectedOrder,
  onSortChange,
  onOrderChange,
  viewMode = 'grid',
  onViewModeChange,
  showViewModeToggle = true,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Search Bar */}
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      {/* Sort and View Controls */}
      <div className="flex gap-2">
        <SortDropdown
          sortOptions={sortOptions}
          orderOptions={orderOptions}
          selectedSort={selectedSort}
          selectedOrder={selectedOrder}
          onSortChange={onSortChange}
          onOrderChange={onOrderChange}
        />

        {/* View Mode Toggle */}
        {showViewModeToggle && onViewModeChange && (
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-2 ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } transition-colors`}
              title="Grid View"
            >
              <Grid2x2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-2 ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              } transition-colors`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
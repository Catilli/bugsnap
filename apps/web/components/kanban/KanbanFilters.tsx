'use client';

import { Search, Bug, Lightbulb, X } from 'lucide-react';

interface KanbanFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: ('BUG' | 'FEATURE')[];
  onTypeFilterChange: (types: ('BUG' | 'FEATURE')[]) => void;
  priorityFilter: string | null;
  onPriorityFilterChange: (priority: string | null) => void;
}

export function KanbanFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}: KanbanFiltersProps) {
  const toggleType = (type: 'BUG' | 'FEATURE') => {
    if (typeFilter.includes(type)) {
      onTypeFilterChange(typeFilter.filter((t) => t !== type));
    } else {
      onTypeFilterChange([...typeFilter, type]);
    }
  };

  const hasActiveFilters = typeFilter.length > 0 || priorityFilter !== null || searchQuery !== '';

  const clearFilters = () => {
    onSearchChange('');
    onTypeFilterChange([]);
    onPriorityFilterChange(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
        />
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => toggleType('BUG')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            typeFilter.includes('BUG')
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Bug className="w-4 h-4" />
          Bug
        </button>
        <button
          onClick={() => toggleType('FEATURE')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            typeFilter.includes('FEATURE')
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Feature
        </button>
      </div>

      {/* Priority filter */}
      <select
        value={priorityFilter || ''}
        onChange={(e) => onPriorityFilterChange(e.target.value || null)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-600"
      >
        <option value="">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  );
}

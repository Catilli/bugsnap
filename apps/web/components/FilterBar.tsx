'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

const CONTROL_HEIGHT = 'h-[38px]';

// --- Slot types ---

interface ToggleButtonSlot {
  kind: 'toggle';
  key: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  activeClassName: string;
  onClick: () => void;
}

interface DropdownSlot {
  kind: 'dropdown';
  key: string;
  label: string;
  sections: {
    title: string;
    options: { label: string; value: string }[];
    selected: string;
    onChange: (value: string) => void;
  }[];
}

interface SelectSlot {
  kind: 'select';
  key: string;
  placeholder: string;
  value: string | null;
  options: { label: string; value: string }[];
  onChange: (value: string | null) => void;
}

interface ViewToggleSlot {
  kind: 'view-toggle';
  key: string;
  options: { icon: React.ReactNode; value: string; title: string }[];
  selected: string;
  onChange: (value: string) => void;
}

type FilterSlot = ToggleButtonSlot | DropdownSlot | SelectSlot | ViewToggleSlot;

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  slots?: FilterSlot[];
  showClear?: boolean;
  onClear?: () => void;
}

// --- Sub-components ---

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${CONTROL_HEIGHT}`}
      />
    </div>
  );
}

function ToggleButton({ slot }: { slot: ToggleButtonSlot }) {
  return (
    <button
      onClick={slot.onClick}
      className={`flex items-center gap-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${CONTROL_HEIGHT} ${
        slot.active
          ? slot.activeClassName
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {slot.icon}
      {slot.label}
    </button>
  );
}

function FilterDropdown({ slot }: { slot: DropdownSlot }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white text-sm font-medium text-gray-700 ${CONTROL_HEIGHT}`}
      >
        <span>{slot.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {slot.sections.map((section, i) => (
            <div key={section.title}>
              {i > 0 && <div className="border-t border-gray-200 my-2" />}
              <div className="px-3 py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => section.onChange(option.value)}
                      className="flex items-center w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      {section.selected === option.value && (
                        <Check className="w-4 h-4 mr-2 text-gray-700" />
                      )}
                      <span className={section.selected === option.value ? '' : 'ml-6'}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ slot }: { slot: SelectSlot }) {
  return (
    <select
      value={slot.value || ''}
      onChange={(e) => slot.onChange(e.target.value || null)}
      className={`px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-600 ${CONTROL_HEIGHT}`}
    >
      <option value="">{slot.placeholder}</option>
      {slot.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ViewToggle({ slot }: { slot: ViewToggleSlot }) {
  return (
    <div className={`flex border border-gray-300 rounded-lg overflow-hidden ${CONTROL_HEIGHT}`}>
      {slot.options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => slot.onChange(opt.value)}
          className={`px-3 flex items-center ${
            slot.selected === opt.value
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          } transition-colors`}
          title={opt.title}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 text-sm text-gray-500 hover:text-gray-700 transition-colors ${CONTROL_HEIGHT}`}
    >
      <X className="w-4 h-4" />
      Clear
    </button>
  );
}

// --- Main component ---

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  slots = [],
  showClear = false,
  onClear,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput value={searchQuery} onChange={onSearchChange} placeholder={searchPlaceholder} />

      {slots.map((slot) => {
        switch (slot.kind) {
          case 'toggle':
            return <ToggleButton key={slot.key} slot={slot} />;
          case 'dropdown':
            return <FilterDropdown key={slot.key} slot={slot} />;
          case 'select':
            return <FilterSelect key={slot.key} slot={slot} />;
          case 'view-toggle':
            return <ViewToggle key={slot.key} slot={slot} />;
        }
      })}

      {showClear && onClear && <ClearButton onClick={onClear} />}
    </div>
  );
}

export type { FilterSlot, ToggleButtonSlot, DropdownSlot, SelectSlot, ViewToggleSlot, FilterBarProps };

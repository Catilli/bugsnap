'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface ButtonDropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  buttonClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
}

export default function ButtonDropdown({
  label,
  options,
  selectedValue,
  onChange,
  buttonClassName = 'w-full flex items-center justify-between px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm',
  dropdownClassName = 'absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden',
  optionClassName = 'w-full px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-gray-50 transition-colors font-medium',
}: ButtonDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName}
        type="button"
      >
        <span>{label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className={dropdownClassName}>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={optionClassName}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
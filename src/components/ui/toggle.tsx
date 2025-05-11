import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: ToggleProps) {
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-10 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 
          ${checked ? 'bg-blue-600' : ''}`}></div>
        <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all
          ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
}

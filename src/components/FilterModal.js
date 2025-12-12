"use client";

import { useEffect, useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export default function FilterModal({ 
  isOpen, 
  onClose, 
  onApply,
  initialFilters,
  filterFields
}) {
  const [tempFilters, setTempFilters] = useState(initialFilters);
  const [hasChanges, setHasChanges] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(initialFilters);
      setHasChanges(false);
    }
  }, [isOpen, initialFilters]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const changed = JSON.stringify(tempFilters) !== JSON.stringify(initialFilters);
    setHasChanges(changed);
  }, [tempFilters, initialFilters]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(tempFilters);
    onClose();
  };

  const handleCancel = () => {
    setTempFilters(initialFilters);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all">
        {/* Header - Yellow background */}
        <div className="bg-yellow-400 px-6 py-6 relative rounded-t-xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-emerald-700">
              Filter Options
            </h2>
            <p className="text-base text-gray-700 mt-1">
              Customize your search criteria
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 btn-base p-2 hover:bg-yellow-500 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Filter Fields */}
        <div className="bg-white border-t-0 border-gray-200 px-6 py-8 rounded-b-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filterFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  {field.label}
                </label>
                <select
                  value={tempFilters[field.key] || ''}
                  onChange={(e) => handleFilterChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 text-gray-900 text-sm"
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Footer - Action Buttons */}
          <div className="mt-8 flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="btn-base btn-secondary px-6 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className={`btn-base px-6 py-2 text-sm ${
                hasChanges 
                  ? 'btn-primary' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

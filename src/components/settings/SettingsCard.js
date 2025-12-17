"use client";

export default function SettingsCard({ title, description, children, danger = false }) {
  return (
    <div className={`bg-white rounded-xl border ${danger ? 'border-red-200' : 'border-gray-200'} shadow-sm overflow-hidden`}>
      <div className={`px-6 py-4 border-b ${danger ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-semibold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
}

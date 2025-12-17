"use client";

import { useState } from "react";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsCard from "@/components/settings/SettingsCard";

export default function PreferencesPage() {
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");

  return (
    <div>
      <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Preferences</h1>
        <p className="text-base sm:text-lg text-gray-700 mt-2">Customize your experience</p>
      </div>

      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm space-y-8">
        <SettingsSection title="Appearance" description="Customize how Twibbonize looks">
          <SettingsCard title="Theme">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose your preferred color theme for the interface.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: "light", label: "Light", icon: "☀️" },
                  { value: "dark", label: "Dark", icon: "🌙" },
                  { value: "system", label: "System", icon: "💻" }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                      theme === option.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
                Theme switching is coming soon. Currently using system preference.
              </p>
            </div>
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Language" description="Choose your preferred language">
          <SettingsCard title="Display Language">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select the language for the Twibbonize interface.
              </p>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="en">English</option>
              </select>
              <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
                Additional languages coming soon.
              </p>
            </div>
          </SettingsCard>
        </SettingsSection>
      </div>
    </div>
  );
}

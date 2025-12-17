"use client";

import { useState, useEffect } from "react";
import { useOptionalAuth } from "@/hooks/useAuth";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsCard from "@/components/settings/SettingsCard";

export default function PreferencesPage() {
  const authContext = useOptionalAuth();
  const user = authContext?.user || null;

  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/settings/preferences', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTheme(data.preferences.theme);
            setLanguage(data.preferences.language);
          }
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const handleThemeChange = async (newTheme) => {
    if (!user || newTheme === theme) return;

    const previousTheme = theme;
    setTheme(newTheme);
    setSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme: newTheme })
      });

      const data = await response.json();

      if (!data.success) {
        setTheme(previousTheme);
        setSaveError(data.error || 'Failed to save theme');
      } else {
        setSaveSuccess("Theme preference saved");
        setTimeout(() => setSaveSuccess(""), 2000);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      setTheme(previousTheme);
      setSaveError('Failed to save theme. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    if (!user || newLanguage === language) return;

    const previousLanguage = language;
    setLanguage(newLanguage);
    setSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ language: newLanguage })
      });

      const data = await response.json();

      if (!data.success) {
        setLanguage(previousLanguage);
        setSaveError(data.error || 'Failed to save language');
      } else {
        setSaveSuccess("Language preference saved");
        setTimeout(() => setSaveSuccess(""), 2000);
      }
    } catch (error) {
      console.error('Error saving language:', error);
      setLanguage(previousLanguage);
      setSaveError('Failed to save language. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Preferences</h1>
          <p className="text-base sm:text-lg text-gray-700 mt-2">Customize your experience</p>
        </div>
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Preferences</h1>
        <p className="text-base sm:text-lg text-gray-700 mt-2">Customize your experience</p>
      </div>

      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm space-y-8">
        {saveSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {saveSuccess}
          </div>
        )}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {saveError}
          </div>
        )}

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
                    onClick={() => handleThemeChange(option.value)}
                    disabled={saving}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                      theme === option.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span>{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
                Your theme preference is saved. Full theme switching (dark mode) is coming soon.
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
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={saving}
                className={`w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <option value="en">English</option>
              </select>
              <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
                Your language preference is saved. Additional languages coming soon.
              </p>
            </div>
          </SettingsCard>
        </SettingsSection>
      </div>
    </div>
  );
}

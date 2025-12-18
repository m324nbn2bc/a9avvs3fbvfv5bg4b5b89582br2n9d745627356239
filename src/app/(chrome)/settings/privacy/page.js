"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsToggle from "@/components/settings/SettingsToggle";

export default function PrivacySettingsPage() {
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    profileVisibility: true,
    showInCreatorLeaderboard: true,
    allowSearchEngineIndexing: true,
    showSupportCount: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/settings/privacy/visibility', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSettings({
              profileVisibility: data.settings.profileVisibility === 'public',
              showInCreatorLeaderboard: data.settings.showInCreatorLeaderboard,
              allowSearchEngineIndexing: data.settings.allowSearchEngineIndexing,
              showSupportCount: data.settings.showSupportCount
            });
          }
        }
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggle = async (key) => {
    if (!user) return;

    const newValue = !settings[key];
    const previousSettings = { ...settings };

    setSettings(prev => ({
      ...prev,
      [key]: newValue
    }));

    setSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/privacy/visibility', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [key]: newValue
        })
      });

      const data = await response.json();

      if (!data.success) {
        setSettings(previousSettings);
        setSaveError(data.error || 'Failed to save setting');
      } else {
        setSaveSuccess("Setting saved");
        setTimeout(() => setSaveSuccess(""), 2000);
      }
    } catch (error) {
      console.error('Error saving privacy setting:', error);
      setSettings(previousSettings);
      setSaveError('Failed to save setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportLoading(true);
    setExportError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/privacy/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `twibbonize-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setExportError(data.error || 'Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setExportError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Privacy & Data</h1>
          <p className="text-base sm:text-lg text-gray-700 mt-2">Control your privacy and data settings</p>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Privacy & Data</h1>
        <p className="text-base sm:text-lg text-gray-700 mt-2">Control your privacy and data settings</p>
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

        <SettingsSection title="Profile Visibility" description="Control who can see your profile">
          <SettingsCard title="Visibility Settings">
            <SettingsToggle
              label="Public Profile"
              description="Allow anyone to view your profile and campaigns"
              checked={settings.profileVisibility}
              onChange={() => handleToggle("profileVisibility")}
              disabled={saving}
            />
            <SettingsToggle
              label="Show in Creator Leaderboard"
              description="Display your profile on the top creators page"
              checked={settings.showInCreatorLeaderboard}
              onChange={() => handleToggle("showInCreatorLeaderboard")}
              disabled={saving}
            />
            <SettingsToggle
              label="Show Support Count"
              description="Display the number of supporters on your campaigns"
              checked={settings.showSupportCount}
              onChange={() => handleToggle("showSupportCount")}
              disabled={saving}
            />
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Search Engine Indexing" description="Control how search engines see your profile">
          <SettingsCard title="Search Visibility">
            <SettingsToggle
              label="Allow Search Engine Indexing"
              description="Let search engines like Google index your profile"
              checked={settings.allowSearchEngineIndexing}
              onChange={() => handleToggle("allowSearchEngineIndexing")}
              disabled={saving}
            />
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Your Data" description="Export or download your data">
          <SettingsCard title="Data Export">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Download a copy of all your data including your profile information,
                campaigns, and notifications. The data will be exported as a JSON file.
              </p>
              {exportError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {exportError}
                </div>
              )}
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="btn-base btn-secondary py-2 px-4"
              >
                {exportLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparing Export...
                  </span>
                ) : (
                  "Download My Data"
                )}
              </button>
            </div>
          </SettingsCard>
        </SettingsSection>

      </div>
    </div>
  );
}

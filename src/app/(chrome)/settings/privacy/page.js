"use client";

import { useState } from "react";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsToggle from "@/components/settings/SettingsToggle";

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState({
    profileVisibility: true,
    showInLeaderboard: true,
    allowSearchEngines: true,
    showSupportCount: true
  });
  const [exportLoading, setExportLoading] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Data export functionality coming soon!");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Privacy & Data</h1>
        <p className="text-base sm:text-lg text-gray-700 mt-2">Control your privacy and data settings</p>
      </div>

      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm space-y-8">
        <SettingsSection title="Profile Visibility" description="Control who can see your profile">
          <SettingsCard title="Visibility Settings">
            <SettingsToggle
              label="Public Profile"
              description="Allow anyone to view your profile and campaigns"
              checked={settings.profileVisibility}
              onChange={() => handleToggle("profileVisibility")}
            />
            <SettingsToggle
              label="Show in Creator Leaderboard"
              description="Display your profile on the top creators page"
              checked={settings.showInLeaderboard}
              onChange={() => handleToggle("showInLeaderboard")}
            />
            <SettingsToggle
              label="Show Support Count"
              description="Display the number of supporters on your campaigns"
              checked={settings.showSupportCount}
              onChange={() => handleToggle("showSupportCount")}
            />
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Search Engine Indexing" description="Control how search engines see your profile">
          <SettingsCard title="Search Visibility">
            <SettingsToggle
              label="Allow Search Engine Indexing"
              description="Let search engines like Google index your profile"
              checked={settings.allowSearchEngines}
              onChange={() => handleToggle("allowSearchEngines")}
            />
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Your Data" description="Export or download your data">
          <SettingsCard title="Data Export">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Download a copy of all your data including your profile information,
                campaigns, and activity. This may take a few minutes to prepare.
              </p>
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
                    Preparing...
                  </span>
                ) : (
                  "Request Data Export"
                )}
              </button>
            </div>
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Connected Apps" description="Manage third-party connections">
          <SettingsCard title="Third-Party Apps">
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="font-medium">No connected apps</p>
              <p className="text-sm mt-1">Third-party app connections will appear here</p>
            </div>
          </SettingsCard>
        </SettingsSection>
      </div>
    </div>
  );
}

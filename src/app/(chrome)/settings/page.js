import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/account');
}

export const metadata = {
  title: "Settings - Twibbonize",
  description: "Manage your account settings",
};

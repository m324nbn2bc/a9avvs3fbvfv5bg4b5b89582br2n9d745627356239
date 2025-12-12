'use client';

import { AuthProvider } from '../hooks/useAuth';

export default function ClientAuthProvider({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
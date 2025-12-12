"use client";

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileMenu from './MobileMenu';
import { useLayoutVisibility } from './LayoutVisibilityContext';

// Pages where header/footer should NOT be shown
const EXCLUDED_PAGES = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/onboarding',
  '/verify-email'
];

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { hideChrome } = useLayoutVisibility();
  
  // Check if current page should exclude header/footer
  const shouldExcludeLayout = hideChrome || 
    EXCLUDED_PAGES.includes(pathname) || 
    pathname.startsWith('/admin');
  
  // If layout should be excluded, just return children
  if (shouldExcludeLayout) {
    return children;
  }
  
  // Show header/footer for all other pages
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Main Content with blur effect */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${
        isMenuOpen ? 'blur-sm' : ''
      }`}>
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>

      {/* Mobile Menu Component */}
      <MobileMenu 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
    </div>
  );
}
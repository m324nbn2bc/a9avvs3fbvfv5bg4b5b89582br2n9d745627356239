'use client';

import { useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import Header from './Header';
import Footer from './Footer';
import MobileMenu from './MobileMenu';

export default function InteractiveClient({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent body scrolling when sidebar is open
  useBodyScrollLock(isMenuOpen);

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
'use client'

import Link from 'next/link';
import SearchInput from './SearchInput';
import ProfileSwitcher from './ProfileSwitcher';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-bold text-red-600 tracking-tighter hover:scale-105 transition-transform">
            Famflix
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/movies" className="text-white hover:text-red-600 transition-colors">
              Film
            </Link>
            <Link href="/tv" className="text-white hover:text-red-600 transition-colors">
              Serie TV
            </Link>
            <Link href="/favorites" className="text-white hover:text-red-600 transition-colors">
              Preferiti
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block w-64">
            <SearchInput />
          </div>
          <ProfileSwitcher />
        </div>
      </div>
      {/* Mobile Search - Visible only on small screens */}
      <div className="md:hidden px-4 pb-4">
        <SearchInput />
      </div>
    </nav>
  );
}

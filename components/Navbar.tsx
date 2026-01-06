import Link from 'next/link';
import SearchInput from './SearchInput';
import ProfileSwitcher from './ProfileSwitcher';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-linear-to-b from-black/80  to-transparent backdrop-blur-sm">
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

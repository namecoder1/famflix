import Link from 'next/link';
import SearchInput from './SearchInput';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-linear-to-b from-black/80 to-transparent backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-red-600 tracking-tighter hover:scale-105 transition-transform">
          MYMOVIES
        </Link>
        <div className="w-full max-w-xs md:max-w-md hidden md:block">
          <SearchInput />
        </div>
      </div>
      {/* Mobile Search - Visible only on small screens */}
      <div className="md:hidden px-4 pb-4">
        <SearchInput />
      </div>
    </nav>
  );
}

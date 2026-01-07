'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { Separator } from './ui/separator';

const Footer = () => {
  const pathname = usePathname();

  function checkRoute(route: string) {
    if (pathname === route) return true;
    return false;
  }

  return (
    <footer className='container mx-auto px-4 py-10'>
      <div className='flex flex-col md:flex-row justify-between items-center'>
        <Link href="/" className="text-2xl font-bold text-red-600 tracking-tighter hover:scale-105 transition-transform">
            Famflix
        </Link>
        <div className='flex items-center gap-4 mt-4 md:mt-0'>
          <Link href="/movies" className={checkRoute('/movies') ? 'text-red-500' : 'text-white hover:text-red-600 transition-colors'}>
            Film
          </Link>
          <Link href="/tv" className={checkRoute('/tv') ? 'text-red-500' : 'text-white hover:text-red-600 transition-colors'}>
            Serie TV
          </Link>
          <Link href="/favorites" className={checkRoute('/favorites') ? 'text-red-500' : 'text-white hover:text-red-600 transition-colors'}>
            Preferiti
          </Link>
        </div>
      </div>
      <Separator className='my-6' />
      <div className='mx-auto w-fit'>
        <p className='text-muted-foreground text-xs'>© {new Date().getFullYear()} Famflix. Creato da Tobi per la fam.</p>
      </div>
    </footer>
  )
}

export default Footer
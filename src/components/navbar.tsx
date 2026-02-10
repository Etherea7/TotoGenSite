'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  onSettingsClick: () => void
}

export function Navbar({ onSettingsClick }: NavbarProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-gold-mid/30 bg-gradient-to-r from-gold-dark/10 via-gold-mid/5 to-gold-dark/10 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl bg-gradient-to-r from-gold-dark via-lucky-red to-gold-dark bg-clip-text text-transparent">
            TOTO Generator
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={cn(
                'text-sm font-medium transition-all duration-200 py-1 border-b-2',
                pathname === '/'
                  ? 'text-gold-dark dark:text-gold-mid border-gold-dark dark:border-gold-mid'
                  : 'text-muted-foreground border-transparent hover:text-gold-dark dark:hover:text-gold-mid hover:border-gold-mid/50'
              )}
            >
              Generator
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                'text-sm font-medium transition-all duration-200 py-1 border-b-2',
                pathname === '/dashboard'
                  ? 'text-gold-dark dark:text-gold-mid border-gold-dark dark:border-gold-mid'
                  : 'text-muted-foreground border-transparent hover:text-gold-dark dark:hover:text-gold-mid hover:border-gold-mid/50'
              )}
            >
              Dashboard
            </Link>
          </nav>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-gold-dark dark:hover:text-gold-mid"
            onClick={onSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

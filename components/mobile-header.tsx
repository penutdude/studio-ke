"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import Link from "next/link"

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const handleAuthAction = async () => {
    if (user) {
      await signOut()
    }
    setIsMenuOpen(false)
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/blogs", label: "Blogs" },
    { href: "/events", label: "Events" },
    { href: "/family-tree", label: "Family Tree" },
    { href: "/gallery", label: "Gallery" },
  ]

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-lg border-b border-gray-200 dark:bg-gray-900/98 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="font-heading font-bold text-xl text-foreground">
            Thazhuthedath
          </Link>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="h-9 w-9">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div
            className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="font-heading font-semibold text-lg">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth Button */}
            <div className="absolute bottom-4 left-4 right-4">
              {user ? (
                <Button onClick={handleAuthAction} variant="outline" className="w-full">
                  Logout
                </Button>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="default" className="w-full">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="md:hidden h-16" />
    </>
  )
}

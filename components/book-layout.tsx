"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, Home, BookText, Calendar, Users, ImageIcon, Menu, X, LogIn, LogOut, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

interface BookLayoutProps {
  children: React.ReactNode
  title: string
}

export function BookLayout({ children, title }: BookLayoutProps) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pageFlipping, setPageFlipping] = useState(false)
  const [currentContent, setCurrentContent] = useState<React.ReactNode>(children)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Handle page transitions
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageFlipping(true)

      // After animation starts, update content
      const timer = setTimeout(() => {
        setCurrentContent(children)

        // After content updates, end animation
        const endTimer = setTimeout(() => {
          setPageFlipping(false)
        }, 500)

        return () => clearTimeout(endTimer)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [children, pathname])

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/blogs", label: "Blogs", icon: BookText },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/family-tree", label: "Family Tree", icon: Users },
    { href: "/gallery", label: "Gallery", icon: ImageIcon },
  ]

  const handleLogout = async () => {
    await signOut()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#E6D7C3]">
      {/* Header - shown on both mobile and desktop */}
      <header className="border-b border-amber-200 py-3 px-4 bg-leather text-amber-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <h1 className="text-xl font-serif font-bold">Thazguthedath Family</h1>
          </div>

          {/* Desktop navigation */}
          {!isMobile && (
            <div className="flex items-center">
              <nav className="flex space-x-1 mr-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      className={cn(
                        "font-serif btn-book",
                        pathname === item.href
                          ? "bg-amber-700 hover:bg-amber-800 text-white"
                          : "text-amber-50 hover:bg-amber-700/20",
                      )}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>

              {user ? (
                <Button
                  variant="outline"
                  className="border-amber-700/50 text-amber-50 hover:bg-amber-700/20 btn-book"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="border-amber-700/50 text-amber-50 hover:bg-amber-700/20 btn-book"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-amber-700 hover:bg-amber-800 text-white btn-book">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-amber-50 hover:bg-amber-700/20"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </header>

      {/* Mobile menu */}
      {isMobile && mobileMenuOpen && (
        <div className="md:hidden bg-leather border-b border-amber-700/30 shadow-md z-50">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start font-serif",
                    pathname === item.href
                      ? "bg-amber-700 hover:bg-amber-800 text-white"
                      : "text-amber-50 hover:bg-amber-700/20",
                  )}
                >
                  {/* @ts-expect-error */}
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}

            {user ? (
              <Button
                variant="outline"
                className="w-full justify-start border-amber-700/50 text-amber-50 hover:bg-amber-700/20"
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-amber-700/50 text-amber-50 hover:bg-amber-700/20"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-start bg-amber-700 hover:bg-amber-800 text-white">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 py-6 md:py-12 px-4">
        <div className={cn("max-w-7xl mx-auto", !isMobile && "book-container")}>
          {/* Book title */}
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-900 mb-4 md:mb-6 text-center">{title}</h2>

          {/* Book content with page flip animation */}
          <div
            className={cn(
              "bg-paper border border-amber-200 rounded-lg shadow-md overflow-hidden relative",
              !isMobile && "book-pages",
              pageFlipping && "page-flipping",
            )}
          >
            {/* Decorative elements */}
            <div className="decorative-corner corner-top-left"></div>
            <div className="decorative-corner corner-top-right"></div>
            <div className="decorative-corner corner-bottom-left"></div>
            <div className="decorative-corner corner-bottom-right"></div>

            {/* Page curl effect */}
            <div className="page-curl"></div>

            <div className="p-4 md:p-8 relative">
              {currentContent}

              {/* Page indicator */}
              <div className="mt-6 text-center text-amber-700 border-t border-dashed border-amber-300 pt-4 handwritten">
                Thazguthedath Family Chronicles
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-leather border-t border-amber-700/30 shadow-lg z-50">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex-1">
                <div
                  className={cn(
                    "flex flex-col items-center justify-center py-2",
                    pathname === item.href ? "text-amber-200" : "text-amber-50/80",
                  )}
                >
                  {/* @ts-expect-error */}
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Footer - only shown on desktop */}
      {!isMobile && (
        <footer className="border-t border-amber-200 py-4 px-6 bg-leather text-amber-50">
          <div className="max-w-7xl mx-auto text-center font-serif">
            <p>The Thazguthedath Family Chronicles</p>
          </div>
        </footer>
      )}
    </div>
  )
}

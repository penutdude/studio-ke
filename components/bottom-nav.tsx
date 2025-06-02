"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookText, ImageIcon, Calendar, Users, Home, Clock, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Check if user is admin (hardcoded for altros421@gmail.com)
  const isAdmin = user?.email === "altros421@gmail.com"

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/blogs", label: "Blogs", icon: BookText },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/family-tree", label: "Family", icon: Users },
    { href: "/history", label: "History", icon: Clock },
    { href: "/gallery", label: "Gallery", icon: ImageIcon },
  ]

  // Add admin link if user is admin
  if (isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: Shield })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-lg border-t border-gray-200 dark:bg-gray-900/98 dark:border-gray-800 md:hidden shadow-lg">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          // Fix events page detection
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href)) ||
            (item.href === "/events" && pathname.includes("/events"))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 px-1 py-2 rounded-xl transition-all duration-300 group relative",
                "hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95",
                isActive && "bg-black dark:bg-white shadow-lg",
              )}
              // Ensure proper navigation
              prefetch={true}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-black dark:bg-white rounded-full" />
              )}

              <div
                className={cn(
                  "flex items-center justify-center w-5 h-5 mb-1 transition-all duration-300",
                  isActive
                    ? "text-white dark:text-black scale-110"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 group-hover:scale-105",
                )}
              >
                <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-xs font-heading font-medium transition-all duration-300 truncate leading-tight",
                  isActive
                    ? "text-white dark:text-black font-semibold"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200",
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/98 dark:bg-gray-900/98" />
    </nav>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookText, ImageIcon, Calendar, Users, Home, Clock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth/auth-context"

export function SidebarNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Check if user is admin (hardcoded for altros421@gmail.com)
  const isAdmin = user?.email === "altros421@gmail.com"

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/blogs", label: "Blogs", icon: BookText },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/family-tree", label: "Family Tree", icon: Users },
    { href: "/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/history", label: "History", icon: Clock },
  ]

  // Add admin link if user is admin
  if (isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: Shield })
  }

  return (
    <div className="fixed left-0 top-0 h-full w-[60px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col items-center py-6 z-50 hidden md:flex">
      <div className="flex flex-col items-center gap-6 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="icon"
                className={`h-10 w-10 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
                asChild
              >
                <div>
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </div>
              </Button>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto pb-4">
        <ThemeToggle />
      </div>
    </div>
  )
}

"use client"

import type * as React from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { BottomNav } from "@/components/bottom-nav"

interface MinimalLayoutProps {
  children: React.ReactNode
  title?: string
}

export function MinimalLayout({ children, title }: MinimalLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SidebarNav />
      <main className="md:ml-[60px] pb-20 md:pb-0 pt-6">{children}</main>
      <BottomNav />
    </div>
  )
}

"use client"

import type React from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { MinimalLayout } from "@/components/minimal-layout"

interface AlbumLayoutProps {
  children: React.ReactNode
  title: string
}

export function AlbumLayout({ children, title }: AlbumLayoutProps) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    await signOut()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  return <MinimalLayout title={title}>{children}</MinimalLayout>
}

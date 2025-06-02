"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import { initializeDefaultAdmin } from "./admin-utils"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  clearError: () => void
  checkAdminStatus: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user?.email) return false

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("admins").select("*").eq("email", user.email).single()

      const adminStatus = !!data && !error
      setIsAdmin(adminStatus)
      return adminStatus
    } catch (error) {
      console.error("Error checking admin status:", error)
      return false
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient()

        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setError("Failed to initialize authentication")
        } else if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)

          // Initialize default admin if needed
          await initializeDefaultAdmin()

          if (session?.user?.email) {
            const adminCheck = await checkAdminStatus()
            setIsAdmin(adminCheck)
          }
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session?.user?.email)

          if (mounted) {
            setSession(session)
            setUser(session?.user ?? null)
            setError(null)

            if (session?.user?.email) {
              const adminCheck = await checkAdminStatus()
              setIsAdmin(adminCheck)
            } else {
              setIsAdmin(false)
            }
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) {
          setError("Failed to initialize authentication")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)

      if (!email?.trim() || !password?.trim()) {
        const error = { message: "Email and password are required" }
        setError(error.message)
        return { error }
      }

      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      console.log("Sign in result:", data, error)

      if (error) {
        setError(error.message)
        return { error }
      }

      if (data.user) {
        setUser(data.user)
        setSession(data.session)

        // Check if user is admin
        const adminCheck = await checkAdminStatus()
        setIsAdmin(adminCheck)
      }

      return { error: null }
    } catch (error) {
      console.error("Sign in error:", error)
      const errorMessage = "An unexpected error occurred during sign in"
      setError(errorMessage)
      return { error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)

      if (!email?.trim() || !password?.trim()) {
        const error = { message: "Email and password are required" }
        setError(error.message)
        return { data: null, error }
      }

      if (password.length < 6) {
        const error = { message: "Password must be at least 6 characters" }
        setError(error.message)
        return { data: null, error }
      }

      const supabase = getSupabaseBrowserClient()

      // First check if this is the first user (altros421@gmail.com)
      if (email.trim().toLowerCase() === "altros421@gmail.com") {
        // Allow direct signup for the default admin
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })

        if (error) {
          setError(error.message)
          return { data: null, error }
        }

        // Add to admins table
        await supabase.from("admins").insert({
          email: email.trim().toLowerCase(),
          created_at: new Date().toISOString(),
        })

        return { data, error: null }
      }

      // For other users, add to pending_users table
      const { data: pendingData, error: pendingError } = await supabase
        .from("pending_users")
        .insert({
          email: email.trim().toLowerCase(),
          created_at: new Date().toISOString(),
          status: "pending",
        })
        .select()

      if (pendingError) {
        setError(pendingError.message)
        return { data: null, error: pendingError }
      }

      // Return success but with pending status
      return {
        data: { user: null, session: null, pendingApproval: true },
        error: null,
      }
    } catch (error) {
      console.error("Sign up error:", error)
      const errorMessage = "An unexpected error occurred during sign up"
      setError(errorMessage)
      return { data: null, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setIsAdmin(false)
    } catch (error) {
      console.error("Sign out error:", error)
      setError("Failed to sign out")
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    session,
    isLoading,
    error,
    isAdmin,
    signIn,
    signUp,
    signOut,
    clearError,
    checkAdminStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

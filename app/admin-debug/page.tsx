"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

export default function AdminDebugPage() {
  const { user, isAdmin, checkAdminStatus } = useAuth()
  const [loading, setLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<any>(null)
  const [adminTableExists, setAdminTableExists] = useState<boolean | null>(null)
  const [defaultAdminExists, setDefaultAdminExists] = useState<boolean | null>(null)
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAdminTables()
  }, [])

  const checkAdminTables = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      // Check if admins table exists
      const { data: adminData, error: tableError } = await supabase.from("admins").select("count").limit(1)

      setAdminTableExists(!tableError)

      // Check if default admin exists
      if (!tableError) {
        const { data: defaultAdmin, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("email", "altros421@gmail.com")
          .single()

        setDefaultAdminExists(!!defaultAdmin && !adminError)
      } else {
        setDefaultAdminExists(false)
      }

      // Check if current user is admin
      if (user?.email) {
        const isUserAdmin = await checkAdminStatus()
        setCurrentUserIsAdmin(isUserAdmin)
      }
    } catch (err) {
      console.error("Error checking admin tables:", err)
      setError("Failed to check admin tables")
    } finally {
      setLoading(false)
    }
  }

  const setupAdminTables = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/setup-admin-tables")
      const data = await response.json()
      setSetupStatus(data)

      // Refresh status after setup
      setTimeout(() => {
        checkAdminTables()
      }, 1000)
    } catch (err) {
      console.error("Error setting up admin tables:", err)
      setError("Failed to set up admin tables")
    } finally {
      setLoading(false)
    }
  }

  const createTablesDirect = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/create-tables-direct", {
        method: "POST",
      })
      const data = await response.json()
      setSetupStatus(data)

      // Refresh status after setup
      setTimeout(() => {
        checkAdminTables()
      }, 1000)
    } catch (err) {
      console.error("Error creating tables:", err)
      setError("Failed to create tables")
    } finally {
      setLoading(false)
    }
  }

  const forceAddCurrentUserAsAdmin = async () => {
    if (!user?.email) return

    try {
      setLoading(true)
      setError(null)
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("admins")
        .upsert({
          email: user.email.toLowerCase(),
          created_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        setError(`Failed to add admin: ${error.message}`)
      } else {
        setSetupStatus({ success: true, message: "Successfully added as admin", data })
        // Refresh status
        setTimeout(() => {
          checkAdminTables()
          checkAdminStatus()
        }, 1000)
      }
    } catch (err: any) {
      console.error("Error adding current user as admin:", err)
      setError(`Failed to add current user as admin: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin System Debug</CardTitle>
          <CardDescription>Diagnose and fix issues with the admin system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Current User</h3>
            <p>Email: {user?.email || "Not logged in"}</p>
            <p>
              Admin Status:{" "}
              {isAdmin ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Admin
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> Not Admin
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">System Status</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span>Admin Table Exists:</span>
                {adminTableExists === null ? (
                  <span>Checking...</span>
                ) : adminTableExists ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span>Default Admin Exists:</span>
                {defaultAdminExists === null ? (
                  <span>Checking...</span>
                ) : defaultAdminExists ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span>Current User Is Admin:</span>
                {currentUserIsAdmin === null ? (
                  <span>Checking...</span>
                ) : currentUserIsAdmin ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={checkAdminTables} variant="outline" disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
          <Button onClick={setupAdminTables} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Setting up..." : "Setup Admin Tables"}
          </Button>
          <Button onClick={createTablesDirect} disabled={loading} variant="secondary" className="w-full sm:w-auto">
            {loading ? "Creating..." : "Create Tables Direct"}
          </Button>
          {user?.email && (
            <Button
              onClick={forceAddCurrentUserAsAdmin}
              variant="destructive"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Adding..." : "Force Add As Admin"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {setupStatus && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Setup Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(setupStatus, null, 2)}
            </pre>
          </CardContent>
          <CardFooter />
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              First, try clicking <strong>"Setup Admin Tables"</strong> to create the database tables
            </li>
            <li>
              If that doesn't work, try <strong>"Create Tables Direct"</strong> for a different approach
            </li>
            <li>
              If tables exist but you're not recognized as admin, click <strong>"Force Add As Admin"</strong>
            </li>
            <li>
              After any action, click <strong>"Refresh Status"</strong> to see the updated status
            </li>
            <li>
              Once you see "Admin Status: Admin", you can go to <strong>/admin</strong>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

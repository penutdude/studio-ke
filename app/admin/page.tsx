"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loading } from "@/components/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, UserPlus, Users, Clock } from "lucide-react"

interface PendingUser {
  id: string
  email: string
  created_at: string
  status: string
}

interface Admin {
  id: string
  email: string
  created_at: string
}

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [accessChecked, setAccessChecked] = useState(false)

  // Hardcoded admins that always work
  const hardcodedAdmins = ["altros421@gmail.com"]

  // Check if user is admin (including hardcoded)
  const userIsAdmin = user?.email && hardcodedAdmins.includes(user.email.toLowerCase())

  useEffect(() => {
    // Only check access after auth has loaded
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      console.log("User email:", user.email)
      console.log("Is hardcoded admin:", user.email && hardcodedAdmins.includes(user.email.toLowerCase()))
      console.log("Is admin from context:", isAdmin)

      // Check if user is admin (including hardcoded)
      if (!userIsAdmin && !isAdmin) {
        console.log("User is not admin, redirecting to home")
        router.push("/")
        return
      }

      setAccessChecked(true)
      fetchData()
    }
  }, [isAdmin, isLoading, user, router, userIsAdmin])

  const fetchData = async () => {
    try {
      setDataLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Try to fetch data, but don't fail if tables don't exist
      try {
        const { data: pendingData } = await supabase
          .from("pending_users")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        setPendingUsers(pendingData || [])
      } catch (error) {
        console.log("Pending users table doesn't exist yet")
        setPendingUsers([])
      }

      try {
        const { data: adminData } = await supabase.from("admins").select("*").order("created_at", { ascending: false })

        // Combine hardcoded admins with database admins
        const combinedAdmins = [
          ...hardcodedAdmins.map((email) => ({
            id: `hardcoded-${email}`,
            email,
            created_at: new Date().toISOString(),
          })),
          ...(adminData || []).filter((admin) => !hardcodedAdmins.includes(admin.email)),
        ]

        setAdmins(combinedAdmins)
      } catch (error) {
        console.log("Admins table doesn't exist yet")
        // Just show hardcoded admins
        setAdmins(
          hardcodedAdmins.map((email) => ({
            id: `hardcoded-${email}`,
            email,
            created_at: new Date().toISOString(),
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const approveUser = async (userId: string, email: string) => {
    try {
      // Create user account via API
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        // Update pending user status
        const supabase = getSupabaseBrowserClient()
        await supabase.from("pending_users").update({ status: "approved" }).eq("id", userId)

        setMessage({ type: "success", text: `User ${email} approved successfully!` })
        fetchData()
      } else {
        setMessage({ type: "error", text: "Failed to approve user" })
      }
    } catch (error) {
      console.error("Error approving user:", error)
      setMessage({ type: "error", text: "Error approving user" })
    }
  }

  const rejectUser = async (userId: string, email: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from("pending_users").update({ status: "rejected" }).eq("id", userId)

      setMessage({ type: "success", text: `User ${email} rejected` })
      fetchData()
    } catch (error) {
      console.error("Error rejecting user:", error)
      setMessage({ type: "error", text: "Error rejecting user" })
    }
  }

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("admins").insert({
        email: newAdminEmail.toLowerCase(),
        created_at: new Date().toISOString(),
      })

      if (!error) {
        setMessage({ type: "success", text: `${newAdminEmail} added as admin` })
        setNewAdminEmail("")
        fetchData()
      } else {
        setMessage({ type: "error", text: "Failed to add admin" })
      }
    } catch (error) {
      console.error("Error adding admin:", error)
      setMessage({ type: "error", text: "Error adding admin" })
    }
  }

  const removeAdmin = async (email: string) => {
    if (hardcodedAdmins.includes(email)) {
      setMessage({ type: "error", text: "Cannot remove default admin" })
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("admins").delete().eq("email", email)

      if (!error) {
        setMessage({ type: "success", text: `${email} removed as admin` })
        fetchData()
      } else {
        setMessage({ type: "error", text: "Failed to remove admin" })
      }
    } catch (error) {
      console.error("Error removing admin:", error)
      setMessage({ type: "error", text: "Error removing admin" })
    }
  }

  // Show loading state while checking auth
  if (isLoading || !accessChecked) {
    return <Loading />
  }

  // If we've checked access and user is still here, they're authorized
  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and administrators</p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Users ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Admins ({admins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>Review and approve new user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending users</p>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveUser(user.id, user.email)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectUser(user.id, user.email)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Admin</CardTitle>
                <CardDescription>Grant admin privileges to a user</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="admin-email">Email Address</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="user@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={addAdmin} className="mt-6">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Admins</CardTitle>
                <CardDescription>Manage administrator accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{admin.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Added: {new Date(admin.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {hardcodedAdmins.includes(admin.email) && <Badge variant="secondary">Default Admin</Badge>}
                        {admin.email === user?.email && <Badge variant="outline">You</Badge>}
                      </div>
                      {!hardcodedAdmins.includes(admin.email) && admin.email !== user?.email && (
                        <Button size="sm" variant="outline" onClick={() => removeAdmin(admin.email)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

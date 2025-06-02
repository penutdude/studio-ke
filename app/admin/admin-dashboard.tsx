"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Users, UserPlus, Shield, Calendar, Mail, Trash2, Check, X } from "lucide-react"

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

interface AdminDashboardProps {
  pendingUsers: PendingUser[]
  admins: Admin[]
  currentUserEmail: string
  onDataUpdate: () => void
}

export function AdminDashboard({ pendingUsers, admins, currentUserEmail, onDataUpdate }: AdminDashboardProps) {
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const approveUser = async (userId: string, email: string) => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()

      // Create the user account
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: "TempPass123!" }),
      })

      if (response.ok) {
        // Update pending user status
        await supabase.from("pending_users").update({ status: "approved" }).eq("id", userId)

        toast({
          title: "User Approved",
          description: `${email} has been approved and can now sign in.`,
        })

        onDataUpdate()
      } else {
        throw new Error("Failed to create user")
      }
    } catch (error) {
      console.error("Error approving user:", error)
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const rejectUser = async (userId: string, email: string) => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from("pending_users").update({ status: "rejected" }).eq("id", userId)

      toast({
        title: "User Rejected",
        description: `${email} has been rejected.`,
      })

      onDataUpdate()
    } catch (error) {
      console.error("Error rejecting user:", error)
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return

    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from("admins").insert({
        email: newAdminEmail.toLowerCase().trim(),
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Admin Added",
        description: `${newAdminEmail} has been added as an admin.`,
      })

      setNewAdminEmail("")
      onDataUpdate()
    } catch (error) {
      console.error("Error adding admin:", error)
      toast({
        title: "Error",
        description: "Failed to add admin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeAdmin = async (adminId: string, email: string) => {
    if (email === "altros421@gmail.com") {
      toast({
        title: "Cannot Remove",
        description: "The default admin cannot be removed.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.from("admins").delete().eq("id", adminId)

      toast({
        title: "Admin Removed",
        description: `${email} has been removed as an admin.`,
      })

      onDataUpdate()
    } catch (error) {
      console.error("Error removing admin:", error)
      toast({
        title: "Error",
        description: "Failed to remove admin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage user approvals and admin permissions</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pending Users ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admins ({admins.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Pending User Approvals
                </CardTitle>
                <CardDescription>Review and approve new user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending user approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{user.status}</Badge>
                          <Button
                            size="sm"
                            onClick={() => approveUser(user.id, user.email)}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectUser(user.id, user.email)}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4 mr-1" />
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

          <TabsContent value="admins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New Admin
                </CardTitle>
                <CardDescription>Grant admin privileges to existing users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="admin-email">Email Address</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="Enter email address"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addAdmin} disabled={isLoading || !newAdminEmail.trim()}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Current Admins
                </CardTitle>
                <CardDescription>Manage existing admin accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{admin.email}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Added {new Date(admin.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {admin.email === "altros421@gmail.com" && <Badge variant="default">Default Admin</Badge>}
                        {admin.email === currentUserEmail && <Badge variant="secondary">You</Badge>}
                        {admin.email !== "altros421@gmail.com" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={isLoading}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Admin</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {admin.email} as an admin? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeAdmin(admin.id, admin.email)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

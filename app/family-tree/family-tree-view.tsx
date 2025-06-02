"use client"

import { useState, useMemo } from "react"
import type { Database } from "@/lib/types/database.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FamilyMemberCard } from "./family-member-card"
import { FamilyTreeFlow } from "./family-tree-flow"
import { EditFamilyMemberForm } from "./edit-family-member-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { deleteFamilyMember } from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MemberProfileView } from "./member-profile-view"
import { Button } from "@/components/ui/button"
import { Edit, User, Trash2, TreePine, Users, GitBranch, Search, X } from "lucide-react"

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"]

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function FamilyTreeView({ members }: { members: FamilyMember[] }) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [viewingProfile, setViewingProfile] = useState<FamilyMember | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  // Handle clicks from the tree view - open edit form directly
  const handleTreeNodeClick = (member: FamilyMember) => {
    setEditingMember(member)
  }

  // Handle clicks from the list view - show profile with options
  const handleListMemberClick = (member: FamilyMember) => {
    setSelectedMember(member)
  }

  const handleEdit = (member: FamilyMember) => {
    setSelectedMember(null)
    setViewingProfile(null)
    setEditingMember(member)
  }

  const handleViewProfile = (member: FamilyMember) => {
    setSelectedMember(null)
    setViewingProfile(member)
  }

  const handleDelete = async () => {
    if (!user || !memberToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteFamilyMember(memberToDelete.id, memberToDelete.added_by || "", user.email || "")

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Family member deleted successfully",
      })

      setSelectedMember(null)
      setViewingProfile(null)
      setEditingMember(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete family member",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setMemberToDelete(null)
    }
  }

  const handleEditSuccess = () => {
    setEditingMember(null)
    // Refresh the page to get updated data
    window.location.reload()
  }

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members

    const query = searchQuery.toLowerCase().trim()
    return members.filter(
      (member) =>
        member.name?.toLowerCase().includes(query) ||
        member.relationship?.toLowerCase().includes(query) ||
        member.birth_date?.includes(query) ||
        member.death_date?.includes(query) ||
        member.notes?.toLowerCase().includes(query),
    )
  }, [members, searchQuery])

  // Group filtered members by relationship for list view
  const byRelationship = filteredMembers.reduce(
    (acc, member) => {
      const relationship = member.relationship || "Unspecified"
      if (!acc[relationship]) {
        acc[relationship] = []
      }
      acc[relationship].push(member)
      return acc
    },
    {} as Record<string, FamilyMember[]>,
  )

  const relationships = Object.keys(byRelationship)

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Tabs defaultValue="tree" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger
            value="tree"
            className="data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white"
          >
            <TreePine className="h-4 w-4 mr-2" />
            Tree View
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="mt-6 fade-in">
          <Card className="elegant-card animate-scale-in">
            <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
              <CardTitle className="page-title text-center flex items-center justify-center gap-2 text-2xl">
                <GitBranch className="h-6 w-6" />
                Interactive Family Tree
              </CardTitle>
              <div className="text-center space-y-2">
                <p className="text-muted-foreground text-sm">
                  <strong className="text-foreground">Click on family members to edit relationships</strong>
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <FamilyTreeFlow members={members} onMemberClick={handleTreeNodeClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-6 fade-in">
          <div className="space-y-6">
            {/* Search Bar */}
            <Card className="elegant-card">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search family members by name, relationship, dates, or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 bg-background border-border focus:border-foreground transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Found {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""} matching "
                    {searchQuery}"
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {relationships.length === 0 ? (
              <Card className="elegant-card">
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No members found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? `No family members match "${searchQuery}". Try a different search term.`
                      : "No family members have been added yet."}
                  </p>
                  {searchQuery && (
                    <Button onClick={clearSearch} variant="outline" className="mt-4">
                      Clear search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              relationships.map((relationship) => (
                <Card key={relationship} className="elegant-card animate-scale-in stagger-1">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
                    <CardTitle className="page-title text-xl flex items-center gap-2 text-foreground">
                      <Users className="h-5 w-5" />
                      {relationship}
                      <span className="text-sm font-normal text-muted-foreground ml-auto">
                        {byRelationship[relationship].length} member
                        {byRelationship[relationship].length !== 1 ? "s" : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {byRelationship[relationship].map((member) => (
                        <FamilyMemberCard
                          key={member.id}
                          member={member}
                          onClick={() => handleListMemberClick(member)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Member Options Modal (from list view) */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        {selectedMember && (
          <DialogContent className="sm:max-w-[400px] elegant-card">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="page-title flex items-center gap-2 text-foreground">
                <User className="h-5 w-5" />
                {selectedMember.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 p-4">
              <div className="text-sm text-muted-foreground space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                {selectedMember.relationship && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">Relationship:</span>
                    <span className="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-foreground text-xs">
                      {selectedMember.relationship}
                    </span>
                  </div>
                )}
                {selectedMember.birth_date && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">Born:</span>
                    <span>{formatDate(selectedMember.birth_date)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleEdit(selectedMember)}
                  className="w-full justify-start btn-elegant-outline"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Relationships & Details
                </Button>

                <Button
                  onClick={() => handleViewProfile(selectedMember)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <User className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>

                {user?.email === selectedMember.added_by && (
                  <Button
                    onClick={() => setMemberToDelete(selectedMember)}
                    className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Member
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit Member Dialog (from tree view or list view) */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        {editingMember && (
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto elegant-card">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="page-title flex items-center gap-2 text-foreground">
                <Edit className="h-5 w-5" />
                Edit {editingMember.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Update relationships to see connections in the family tree
              </p>
            </DialogHeader>
            <div className="p-4">
              <EditFamilyMemberForm member={editingMember} existingMembers={members} onSuccess={handleEditSuccess} />
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Member Profile View */}
      {viewingProfile && (
        <MemberProfileView
          member={viewingProfile}
          onClose={() => setViewingProfile(null)}
          onUpdate={() => {
            // Refresh the page to get updated data
            window.location.reload()
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent className="elegant-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="page-title text-foreground">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete this family member and remove all their
              relationships.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

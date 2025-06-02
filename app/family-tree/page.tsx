import { GitBranch } from "lucide-react"
import { getFamilyMembers } from "./actions"
import { FamilyTreeView } from "./family-tree-view"
import { AddFamilyMemberButton } from "./add-family-member-button"
import { MinimalLayout } from "@/components/minimal-layout"

export default async function FamilyTreePage() {
  const familyMembers = await getFamilyMembers()

  return (
    <MinimalLayout title="Family Tree">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <p className="text-muted-foreground">Explore our family connections and relationships</p>
          <AddFamilyMemberButton />
        </div>

        {familyMembers.length === 0 ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="elegant-card max-w-md mx-auto p-8">
              <div className="flex flex-col items-center">
                <GitBranch className="h-12 w-12 mb-4 text-foreground" />
                <h3 className="heading-3 mb-2">No family members yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your family tree by adding family members. You can establish relationships between them
                  later.
                </p>
                <AddFamilyMemberButton />
              </div>
            </div>
          </div>
        ) : (
          <FamilyTreeView members={familyMembers} />
        )}
      </div>
    </MinimalLayout>
  )
}

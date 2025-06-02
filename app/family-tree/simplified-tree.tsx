"use client"

import { useState, useEffect } from "react"
import type { Database } from "@/lib/types/database.types"
import { Loader2, Users } from "lucide-react"

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"]

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  })
}

export function SimplifiedFamilyTree({ members }: { members: FamilyMember[] }) {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-[#FFFDF5] rounded-lg border border-amber-200">
        <Loader2 className="h-8 w-8 text-amber-800 animate-spin" />
        <span className="ml-2 text-amber-800">Loading visualization...</span>
      </div>
    )
  }

  // Create a map for quick lookup
  const memberMap = new Map(members.map((member) => [member.id, member]))

  // Find root members (those without parents)
  const rootMembers = members.filter((member) => !member.parent_id)

  return (
    <div
      className={`w-full ${
        isMobile ? "h-[400px]" : "h-[600px]"
      } bg-[#FFFDF5] rounded-lg border border-amber-200 p-4 overflow-auto`}
    >
      <style jsx>{`
        .family-tree {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: inherit;
        }
        
        .tree-level {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          margin: 20px 0;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .family-node {
          position: relative;
          text-align: center;
          margin: 0 10px;
        }
        
        .node-content {
          background: #FFFDF5;
          border: 2px solid #D97706;
          border-radius: 8px;
          padding: 12px;
          min-width: 120px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .node-content:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        }
        
        .spouse-connection {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .spouse-line {
          width: 30px;
          height: 2px;
          background: #D97706;
          border-style: dashed;
        }
        
        .children-line {
          width: 2px;
          height: 30px;
          background: #D97706;
          margin: 0 auto;
        }
        
        .children-connector {
          display: flex;
          justify-content: center;
          position: relative;
        }
        
        .children-connector::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          height: 2px;
          background: #D97706;
          max-width: 300px;
        }
      `}</style>

      <div className="family-tree">
        {rootMembers.length > 0 ? (
          <div className="tree-level">
            {rootMembers.map((member) => (
              <FamilyTreeNode
                key={member.id}
                member={member}
                members={members}
                memberMap={memberMap}
                level={0}
                isMobile={isMobile}
              />
            ))}
          </div>
        ) : (
          <div className="text-amber-700 font-serif text-center py-8 flex flex-col items-center">
            <Users className="h-12 w-12 mb-4 text-amber-600" />
            <p className="text-lg mb-2">Start Building Your Family Tree</p>
            <p className="text-sm text-amber-600">
              Add family members with parent relationships to see your family tree visualization.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FamilyTreeNode({
  member,
  members,
  memberMap,
  level,
  isMobile,
}: {
  member: FamilyMember
  members: FamilyMember[]
  memberMap: Map<string, FamilyMember>
  level: number
  isMobile: boolean
}) {
  // Find children of this member
  const children = members.filter((m) => m.parent_id === member.id)

  // Find spouse of this member
  const spouse = member.spouse_id ? memberMap.get(member.spouse_id) : null

  return (
    <div className="family-node">
      <div className="spouse-connection">
        {/* Member node */}
        <div className="node-content">
          {!isMobile && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJzdHJpcGVzIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHdpZHRoPSI2IiBoZWlnaHQ9IjEwIiBmaWxsPSJyZ2JhKDIxMCwxODAsMTIwLDAuNSkiIC0+PHJlY3QgeD0iNiIgd2lkdGg9IjQiIGhlaWdodD0iMTAiIGZpbGw9InJnYmEoMjU1LDI0NywyMzAsMC43KSIgLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjc3RyaXBlcykiIC0+PC9zdmc+')] opacity-80"></div>
          )}
          <div className={`${isMobile ? "font-serif text-sm" : "font-handwriting text-base"} font-bold text-amber-900`}>
            {member.name}
          </div>
          {member.birth_date && <div className="text-xs text-amber-700 mt-1">{formatDate(member.birth_date)}</div>}
          {member.relationship && <div className="text-xs text-amber-700 mt-1 italic">{member.relationship}</div>}
        </div>

        {/* Spouse connection */}
        {spouse && (
          <>
            <div className="spouse-line"></div>
            <div className="node-content">
              {!isMobile && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJzdHJpcGVzIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHdpZHRoPSI2IiBoZWlnaHQ9IjEwIiBmaWxsPSJyZ2JhKDIxMCwxODAsMTIwLDAuNSkiIC0+PHJlY3QgeD0iNiIgd2lkdGg9IjQiIGhlaWdodD0iMTAiIGZpbGw9InJnYmEoMjU1LDI0NywyMzAsMC43KSIgLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjc3RyaXBlcykiIC0+PC9zdmc+')] opacity-80"></div>
              )}
              <div
                className={`${isMobile ? "font-serif text-sm" : "font-handwriting text-base"} font-bold text-amber-900`}
              >
                {spouse.name}
              </div>
              {spouse.birth_date && <div className="text-xs text-amber-700 mt-1">{formatDate(spouse.birth_date)}</div>}
              {spouse.relationship && <div className="text-xs text-amber-700 mt-1 italic">{spouse.relationship}</div>}
            </div>
          </>
        )}
      </div>

      {/* Children */}
      {children.length > 0 && (
        <>
          <div className="children-line"></div>
          <div className="children-connector">
            <div className="tree-level">
              {children.map((child) => (
                <FamilyTreeNode
                  key={child.id}
                  member={child}
                  members={members}
                  memberMap={memberMap}
                  level={level + 1}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  Controls,
  Background,
  type NodeTypes,
  MarkerType,
  Handle,
  Position,
  MiniMap,
  Panel,
  type NodeChange,
  type NodeDragHandler,
} from "reactflow"
import "reactflow/dist/style.css"
import type { Database } from "@/lib/types/database.types"
import { updateMemberPosition, resetTreeLayout } from "./actions"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { RotateCcw, Move } from "lucide-react"

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"]

interface FamilyTreeFlowProps {
  members: FamilyMember[]
  onMemberClick: (member: FamilyMember) => void
}

// Consistent spacing constants
const SPACING = {
  NODE_WIDTH: 180,
  NODE_HEIGHT: 100,
  HORIZONTAL_GAP: 120,
  VERTICAL_GAP: 200,
  SPOUSE_GAP: 60,
  JUNCTION_OFFSET: 100,
}

// Helper function to get gender-based colors
const getGenderColors = (gender: string | null) => {
  switch (gender) {
    case "male":
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-300 dark:border-blue-600",
        hover: "hover:border-blue-400 dark:hover:border-blue-500",
        text: "text-blue-900 dark:text-blue-100",
      }
    case "female":
      return {
        bg: "bg-pink-50 dark:bg-pink-900/20",
        border: "border-pink-300 dark:border-pink-600",
        hover: "hover:border-pink-400 dark:hover:border-pink-500",
        text: "text-pink-900 dark:text-pink-100",
      }
    case "non_binary":
      return {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-300 dark:border-purple-600",
        hover: "hover:border-purple-400 dark:hover:border-purple-500",
        text: "text-purple-900 dark:text-purple-100",
      }
    default:
      return {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        border: "border-gray-300 dark:border-gray-600",
        hover: "hover:border-gray-400 dark:hover:border-gray-500",
        text: "text-gray-900 dark:text-gray-100",
      }
  }
}

// Custom node component
const FamilyMemberNode = ({ data }: { data: { member: FamilyMember; onClick: () => void } }) => {
  const { member, onClick } = data
  const colors = getGenderColors(member.gender)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-gray-600 border-2 border-white dark:border-gray-900"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-gray-600 border-2 border-white dark:border-gray-900"
        style={{ bottom: -6 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-900"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-900"
        style={{ right: -6 }}
      />

      <div
        className={`${colors.bg} border-2 ${colors.border} ${colors.hover} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-move group hover:scale-105 relative`}
        onClick={onClick}
        style={{ width: SPACING.NODE_WIDTH, height: SPACING.NODE_HEIGHT }}
      >
        {/* Drag indicator */}
        <div className="absolute top-1 right-1 opacity-30 group-hover:opacity-60 transition-opacity">
          <Move className="w-3 h-3 text-gray-600" />
        </div>

        <div className="p-3 h-full flex flex-col justify-center items-center">
          {member.avatar_url ? (
            <div className="w-8 h-8 rounded-full overflow-hidden mb-2 border-2 border-white shadow-sm">
              <img
                src={member.avatar_url || "/placeholder.svg"}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-full mb-2 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text}`}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}

          <h4 className={`font-semibold ${colors.text} text-sm leading-tight mb-1 font-heading text-center`}>
            {member.name}
          </h4>

          {member.relationship && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate text-center">{member.relationship}</p>
          )}

          {/* Social media indicators */}
          {(member.instagram_username || member.twitter_username || member.facebook_username) && (
            <div className="flex gap-1 mt-1">
              {member.instagram_username && <div className="w-1.5 h-1.5 bg-pink-400 rounded-full" title="Instagram" />}
              {member.twitter_username && <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" title="X (Twitter)" />}
              {member.facebook_username && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" title="Facebook" />}
            </div>
          )}

          {/* Custom position indicator */}
          {member.custom_position && (
            <div className="absolute bottom-1 left-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Custom position" />
            </div>
          )}
        </div>
      </div>

      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-20 z-10 bg-white dark:bg-gray-800 p-2 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 text-xs w-48">
          <p className="font-bold">{member.name}</p>
          {member.birth_date && <p>Born: {new Date(member.birth_date).toLocaleDateString()}</p>}
          {member.location && <p>Location: {member.location}</p>}
          {member.bio && <p className="truncate">{member.bio}</p>}
          <p className="text-blue-500 mt-1">Drag to move • Click for details</p>
        </div>
      )}
    </div>
  )
}

// Junction node for connecting two parents to children
const JunctionNode = () => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-2 h-2 bg-gray-500 border border-white dark:border-gray-900 opacity-50"
        style={{ top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-2 h-2 bg-gray-500 border border-white dark:border-gray-900 opacity-50"
        style={{ bottom: -4 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2 h-2 bg-gray-500 border border-white dark:border-gray-900 opacity-50"
        style={{ left: -4 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="w-2 h-2 bg-gray-500 border border-white dark:border-gray-900 opacity-50"
        style={{ right: -4 }}
      />

      <div className="w-4 h-4 bg-gray-500 rounded-full opacity-30 border border-white dark:border-gray-900"></div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  familyMember: FamilyMemberNode,
  junction: JunctionNode,
}

export function FamilyTreeFlow({ members, onMemberClick }: FamilyTreeFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [showMinimap, setShowMinimap] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [layoutInitialized, setLayoutInitialized] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const membersRef = useRef<FamilyMember[]>([])

  // Handle node drag start
  const onNodeDragStart: NodeDragHandler = useCallback((event, node) => {
    setDraggedNodeId(node.id)
  }, [])

  // Handle node drag end - save position to database
  const onNodeDragStop: NodeDragHandler = useCallback(
    async (event, node) => {
      setDraggedNodeId(null)

      if (!user?.email || node.type !== "familyMember") return

      const member = node.data.member as FamilyMember

      try {
        const result = await updateMemberPosition(member.id, node.position.x, node.position.y, user.email)

        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
          // Revert position on error
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    position: {
                      x: member.position_x || 0,
                      y: member.position_y || 0,
                    },
                  }
                : n,
            ),
          )
        } else {
          // Update the local member data to reflect custom position
          // This prevents the layout from recalculating
          membersRef.current = membersRef.current.map((m) =>
            m.id === member.id
              ? {
                  ...m,
                  custom_position: true,
                  position_x: node.position.x,
                  position_y: node.position.y,
                }
              : m,
          )

          // Update the node data
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      member: {
                        ...member,
                        custom_position: true,
                        position_x: node.position.x,
                        position_y: node.position.y,
                      },
                    },
                  }
                : n,
            ),
          )

          toast({
            title: "Position Saved",
            description: `${member.name}'s position has been saved`,
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save position",
          variant: "destructive",
        })
      }
    },
    [user?.email, toast, setNodes],
  )

  // Handle node changes but don't interfere with dragging
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
    },
    [onNodesChange],
  )

  // Reset tree layout
  const handleResetLayout = useCallback(async () => {
    if (!user?.email) return

    setIsResetting(true)
    try {
      const result = await resetTreeLayout(user.email)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Layout Reset",
          description: "Tree layout has been reset to automatic positioning",
        })
        // Refresh the page to reload with automatic layout
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset layout",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }, [user?.email, toast])

  // Create family tree layout - RESPECTS CUSTOM POSITIONS
  const createFamilyLayout = (members: FamilyMember[]) => {
    const memberMap = new Map(members.map((m) => [m.id, m]))
    const positions = new Map<string, { x: number; y: number }>()
    const levels = new Map<string, number>()
    const reservedPositions = new Map<number, { start: number; end: number }[]>()

    // FIRST: Set all custom positions - these are FIXED and won't be moved
    const membersWithCustomPositions = members.filter(
      (m) => m.custom_position && m.position_x !== null && m.position_y !== null,
    )

    membersWithCustomPositions.forEach((member) => {
      positions.set(member.id, { x: member.position_x!, y: member.position_y! })
    })

    // SECOND: Calculate automatic positions only for members WITHOUT custom positions
    const membersWithoutCustomPos = members.filter(
      (m) => !m.custom_position || m.position_x === null || m.position_y === null,
    )

    if (membersWithoutCustomPos.length > 0) {
      // Calculate generational levels for automatic positioning
      const calculateLevels = (member: FamilyMember, level: number, visited: Set<string>) => {
        if (visited.has(member.id)) return
        visited.add(member.id)

        const currentLevel = levels.get(member.id) ?? level
        levels.set(member.id, Math.max(currentLevel, level))

        // Process children
        const children = membersWithoutCustomPos.filter((m) => m.parent_id === member.id || m.parent2_id === member.id)
        children.forEach((child) => {
          calculateLevels(child, level + 1, visited)
        })
      }

      // Start from root members (those without parents) that don't have custom positions
      const roots = membersWithoutCustomPos.filter((m) => !m.parent_id && !m.parent2_id)
      roots.forEach((root) => {
        calculateLevels(root, 0, new Set())
      })

      // Ensure spouses are on the same level (only for non-custom positioned members)
      membersWithoutCustomPos.forEach((member) => {
        if (member.spouse_id) {
          const spouse = memberMap.get(member.spouse_id)
          if (spouse && membersWithoutCustomPos.includes(spouse)) {
            const memberLevel = levels.get(member.id) ?? 0
            const spouseLevel = levels.get(spouse.id) ?? 0
            const maxLevel = Math.max(memberLevel, spouseLevel)
            levels.set(member.id, maxLevel)
            levels.set(spouse.id, maxLevel)
          }
        }
      })

      // Group members by generation (only non-custom positioned)
      const generations = new Map<number, FamilyMember[]>()
      membersWithoutCustomPos.forEach((member) => {
        const level = levels.get(member.id) ?? 0
        if (!generations.has(level)) {
          generations.set(level, [])
          reservedPositions.set(level, [])
        }
        generations.get(level)!.push(member)
      })

      // Position each generation
      const maxLevel = Math.max(...Array.from(generations.keys()))

      for (let level = 0; level <= maxLevel; level++) {
        const generationMembers = generations.get(level) || []
        if (generationMembers.length === 0) continue

        // Group members by family units (keeping spouses together)
        const familyUnits: FamilyMember[][] = []
        const processed = new Set<string>()

        generationMembers.forEach((member) => {
          if (processed.has(member.id)) return

          if (member.spouse_id) {
            const spouse = memberMap.get(member.spouse_id)
            if (spouse && generationMembers.includes(spouse) && !processed.has(spouse.id)) {
              // Create spouse pair
              familyUnits.push([member, spouse])
              processed.add(member.id)
              processed.add(spouse.id)
              return
            }
          }

          // Single member
          familyUnits.push([member])
          processed.add(member.id)
        })

        // Position family units
        familyUnits.forEach((unit) => {
          const member = unit[0]

          if (level === 0 || (!member.parent_id && !member.parent2_id)) {
            // Root level or orphan - position them evenly
            positionFamilyUnit(unit, level, positions, reservedPositions)
          } else {
            // Position under parents (if parents have positions)
            const parentIds = [member.parent_id, member.parent2_id].filter(Boolean) as string[]
            const parentPositions = parentIds.map((id) => positions.get(id)).filter(Boolean) as {
              x: number
              y: number
            }[]

            if (parentPositions.length > 0) {
              // Calculate parent center
              const parentCenterX =
                parentPositions.reduce((sum, pos) => sum + pos.x + SPACING.NODE_WIDTH / 2, 0) / parentPositions.length

              positionFamilyUnitUnderParent(unit, level, parentCenterX, positions, reservedPositions)
            } else {
              // Fallback if parents aren't positioned yet
              positionFamilyUnit(unit, level, positions, reservedPositions)
            }
          }
        })
      }
    }

    return positions
  }

  // Helper function to position a family unit (single member or spouse pair)
  const positionFamilyUnit = (
    unit: FamilyMember[],
    level: number,
    positions: Map<string, { x: number; y: number }>,
    reservedPositions: Map<number, { start: number; end: number }[]>,
  ) => {
    const y = level * SPACING.VERTICAL_GAP

    // Calculate width needed for this unit
    const unitWidth = unit.length * SPACING.NODE_WIDTH + (unit.length - 1) * SPACING.SPOUSE_GAP

    // Find a suitable x position that doesn't overlap with existing units
    let x = 0
    const levelReservations = reservedPositions.get(level) || []

    // If there are existing reservations, place to the right of the rightmost one
    if (levelReservations.length > 0) {
      const rightmostEnd = Math.max(...levelReservations.map((r) => r.end))
      x = rightmostEnd + SPACING.HORIZONTAL_GAP
    }

    // Position each member in the unit
    unit.forEach((member, index) => {
      positions.set(member.id, { x: x + index * (SPACING.NODE_WIDTH + SPACING.SPOUSE_GAP), y })
    })

    // Reserve this space
    levelReservations.push({
      start: x,
      end: x + unitWidth,
    })
    reservedPositions.set(level, levelReservations)
  }

  // Helper function to position a family unit under a parent
  const positionFamilyUnitUnderParent = (
    unit: FamilyMember[],
    level: number,
    parentCenterX: number,
    positions: Map<string, { x: number; y: number }>,
    reservedPositions: Map<number, { start: number; end: number }[]>,
  ) => {
    const y = level * SPACING.VERTICAL_GAP

    // Calculate width needed for this unit
    const unitWidth = unit.length * SPACING.NODE_WIDTH + (unit.length - 1) * SPACING.SPOUSE_GAP

    // Calculate the ideal starting x position (centered under parent)
    const idealX = parentCenterX - unitWidth / 2

    // Check for overlaps with existing positions
    const levelReservations = reservedPositions.get(level) || []
    let needsAdjustment = false

    for (const reservation of levelReservations) {
      // Check if there's an overlap
      if (idealX < reservation.end && idealX + unitWidth > reservation.start) {
        needsAdjustment = true
        break
      }
    }

    // If there's an overlap, position to the right of all existing units
    let x = idealX
    if (needsAdjustment && levelReservations.length > 0) {
      const rightmostEnd = Math.max(...levelReservations.map((r) => r.end))
      x = rightmostEnd + SPACING.HORIZONTAL_GAP
    }

    // Position each member in the unit
    unit.forEach((member, index) => {
      positions.set(member.id, { x: x + index * (SPACING.NODE_WIDTH + SPACING.SPOUSE_GAP), y })
    })

    // Reserve this space
    levelReservations.push({
      start: x,
      end: x + unitWidth,
    })
    reservedPositions.set(level, levelReservations)
  }

  // Only initialize layout once or when members change significantly
  useEffect(() => {
    if (members.length === 0) return

    // Check if this is a significant change (new members, not just position updates)
    const membersChanged =
      !layoutInitialized ||
      members.length !== membersRef.current.length ||
      members.some((m) => !membersRef.current.find((ref) => ref.id === m.id))

    if (!membersChanged) return

    membersRef.current = members
    setLayoutInitialized(true)

    const positions = createFamilyLayout(members)
    const memberMap = new Map(members.map((m) => [m.id, m]))

    // Create nodes
    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    const junctionNodes: Node[] = []

    // Add all family member nodes individually
    members.forEach((member) => {
      newNodes.push({
        id: member.id,
        type: "familyMember",
        position: positions.get(member.id) || { x: 0, y: 0 },
        data: {
          member,
          onClick: () => onMemberClick(member),
        },
        draggable: true,
      })
    })

    // Handle children with two parents (create junctions)
    const childrenWithTwoParents = members.filter((m) => m.parent_id && m.parent2_id)

    childrenWithTwoParents.forEach((child) => {
      const parent1 = memberMap.get(child.parent_id!)
      const parent2 = memberMap.get(child.parent2_id!)

      if (parent1 && parent2) {
        const childPos = positions.get(child.id) || { x: 0, y: 0 }
        const parent1Pos = positions.get(parent1.id) || { x: 0, y: 0 }
        const parent2Pos = positions.get(parent2.id) || { x: 0, y: 0 }

        // Create junction point between parents
        const junctionId = `junction-${child.id}`
        const junctionX = (parent1Pos.x + parent2Pos.x + SPACING.NODE_WIDTH) / 2
        const junctionY = childPos.y - SPACING.JUNCTION_OFFSET

        junctionNodes.push({
          id: junctionId,
          type: "junction",
          position: { x: junctionX, y: junctionY },
          data: {},
          draggable: false,
        })

        // Connect parents to junction
        newEdges.push({
          id: `${parent1.id}-${junctionId}`,
          source: parent1.id,
          target: junctionId,
          sourceHandle: "bottom",
          targetHandle: parent1Pos.x < junctionX ? "left" : "right",
          style: { stroke: "#374151", strokeWidth: 2 },
          type: "smoothstep",
          animated: true,
        })

        newEdges.push({
          id: `${parent2.id}-${junctionId}`,
          source: parent2.id,
          target: junctionId,
          sourceHandle: "bottom",
          targetHandle: parent2Pos.x < junctionX ? "left" : "right",
          style: { stroke: "#374151", strokeWidth: 2 },
          type: "smoothstep",
          animated: true,
        })

        // Connect junction to child
        newEdges.push({
          id: `${junctionId}-${child.id}`,
          source: junctionId,
          target: child.id,
          sourceHandle: "bottom",
          targetHandle: "top",
          style: { stroke: "#374151", strokeWidth: 2 },
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#374151" },
          animated: true,
        })
      }
    })

    // Create parent-child edges for single parent relationships
    members.forEach((member) => {
      // Only create edge if child doesn't have two parents (those are handled by junctions)
      if (member.parent_id && !member.parent2_id) {
        newEdges.push({
          id: `${member.parent_id}-${member.id}`,
          source: member.parent_id,
          target: member.id,
          sourceHandle: "bottom",
          targetHandle: "top",
          style: { stroke: "#374151", strokeWidth: 2 },
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#374151" },
          animated: true,
        })
      }
    })

    // Create spouse edges for all married couples
    const processedSpouses = new Set<string>()
    members.forEach((member) => {
      if (member.spouse_id && !processedSpouses.has(member.id) && !processedSpouses.has(member.spouse_id)) {
        const spouse = memberMap.get(member.spouse_id)
        if (spouse) {
          const memberPos = positions.get(member.id) || { x: 0, y: 0 }
          const spousePos = positions.get(member.spouse_id) || { x: 0, y: 0 }

          // Determine left and right member
          const leftMember = memberPos.x < spousePos.x ? member.id : member.spouse_id
          const rightMember = memberPos.x < spousePos.x ? member.spouse_id : member.id

          newEdges.push({
            id: `spouse-${leftMember}-${rightMember}`,
            source: leftMember,
            target: rightMember,
            sourceHandle: "right",
            targetHandle: "left",
            style: {
              stroke: "#f59e0b",
              strokeWidth: 2,
              strokeDasharray: "3,3",
            },
            type: "straight",
            label: "💍",
            labelStyle: {
              fontSize: "12px",
              background: "rgba(255,255,255,0.9)",
              padding: "1px 4px",
              borderRadius: "6px",
              border: "1px solid #f59e0b",
              fontWeight: "500",
            },
          })

          processedSpouses.add(member.id)
          processedSpouses.add(member.spouse_id)
        }
      }
    })

    // Center the entire tree (but don't move custom positioned nodes)
    if (newNodes.length > 0) {
      // Find the leftmost and rightmost positions of automatically positioned nodes only
      const autoNodes = newNodes.filter((node) => {
        const member = members.find((m) => m.id === node.id)
        return !member?.custom_position
      })

      if (autoNodes.length > 0) {
        let minX = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY

        autoNodes.forEach((node) => {
          minX = Math.min(minX, node.position.x)
          maxX = Math.max(maxX, node.position.x + SPACING.NODE_WIDTH)
        })

        // Calculate the center offset
        const centerOffset = -(maxX + minX) / 2

        // Apply the offset only to automatically positioned nodes and junctions
        newNodes.forEach((node) => {
          const member = members.find((m) => m.id === node.id)
          if (!member?.custom_position) {
            node.position.x += centerOffset
          }
        })

        junctionNodes.forEach((node) => {
          node.position.x += centerOffset
        })
      }
    }

    setNodes([...newNodes, ...junctionNodes])
    setEdges(newEdges)
  }, [members, onMemberClick, setNodes, setEdges, layoutInitialized])

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  return (
    <div className="w-full h-[700px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="family-tree-flow"
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Controls
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          showInteractive={false}
        />
        <Background color="#D1D5DB" gap={20} size={1} className="opacity-20 dark:opacity-10" />

        {showMinimap && (
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          />
        )}

        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
            title={showMinimap ? "Hide minimap" : "Show minimap"}
          >
            {showMinimap ? "🗺️ Hide Map" : "🗺️ Show Map"}
          </button>
        </Panel>

        <Panel position="top-left" className="flex gap-2">
          <Button
            onClick={handleResetLayout}
            disabled={isResetting}
            variant="outline"
            size="sm"
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isResetting ? "Resetting..." : "Reset Layout"}
          </Button>
        </Panel>

        <Panel position="bottom-right" className="flex gap-2">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 text-xs text-gray-600 dark:text-gray-400">
            💡 Drag family members to reposition them. Positions are saved automatically.
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

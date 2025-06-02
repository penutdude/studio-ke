import Link from "next/link"

export function FamilyTreeWidget() {
  return (
    <div className="bg-black text-white rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-medium mb-4 text-center">Family Tree</h3>

      <div className="text-center text-gray-400 text-sm mb-4">No recent members found.</div>

      <div className="text-center">
        <Link href="/family-tree" className="text-blue-400 hover:text-blue-300 text-sm">
          View Full Tree
        </Link>
      </div>
    </div>
  )
}

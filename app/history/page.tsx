"use client"

import { useState, useEffect } from "react"
import { MinimalLayout } from "@/components/minimal-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Heart, TreePine, Languages, User } from "lucide-react"
import { getFamilyMembers } from "@/app/family-tree/actions"

interface FamilyStats {
  totalMembers: number
  maleCount: number
  femaleCount: number
  generations: number
  marriedCouples: number
}

export default function HistoryPage() {
  const [isEnglish, setIsEnglish] = useState(false)
  const [stats, setStats] = useState<FamilyStats>({
    totalMembers: 0,
    maleCount: 0,
    femaleCount: 0,
    generations: 0,
    marriedCouples: 0,
  })
  const [loading, setLoading] = useState(true)

  const toggleLanguage = () => {
    setIsEnglish(!isEnglish)
  }

  useEffect(() => {
    const fetchFamilyStats = async () => {
      try {
        const members = await getFamilyMembers()

        // Calculate statistics
        const totalMembers = members.length
        const maleCount = members.filter((m) => m.gender === "male").length
        const femaleCount = members.filter((m) => m.gender === "female").length

        // Calculate generations by finding the maximum depth
        const calculateGenerations = (members: any[]) => {
          const memberMap = new Map(members.map((m) => [m.id, m]))
          let maxDepth = 0

          const getDepth = (memberId: string, visited = new Set()): number => {
            if (visited.has(memberId)) return 0
            visited.add(memberId)

            const member = memberMap.get(memberId)
            if (!member) return 0

            // Find children
            const children = members.filter((m) => m.parent_id === memberId || m.parent2_id === memberId)

            if (children.length === 0) return 1

            const childDepths = children.map((child) => getDepth(child.id, new Set(visited)))
            return 1 + Math.max(...childDepths, 0)
          }

          // Find root members (those without parents)
          const rootMembers = members.filter((m) => !m.parent_id && !m.parent2_id)

          for (const root of rootMembers) {
            const depth = getDepth(root.id)
            maxDepth = Math.max(maxDepth, depth)
          }

          return maxDepth
        }

        // Calculate married couples (members with spouse_id)
        const marriedCouples = Math.floor(members.filter((m) => m.spouse_id).length / 2)

        const generations = calculateGenerations(members)

        setStats({
          totalMembers,
          maleCount,
          femaleCount,
          generations,
          marriedCouples,
        })
      } catch (error) {
        console.error("Error fetching family stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFamilyStats()
  }, [])

  return (
    <MinimalLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                  {isEnglish ? "Family History" : "കുടുംബ ചരിത്രം"}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                  {isEnglish
                    ? "Discover and preserve the rich heritage and stories of the Thazhuthedath family through generations."
                    : "തലമുറകളിലൂടെ താഴുതേടത്ത് കുടുംബത്തിന്റെ സമ്പന്നമായ പൈതൃകവും കഥകളും കണ്ടെത്തുകയും സംരക്ഷിക്കുകയും ചെയ്യുക."}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={toggleLanguage}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Languages className="w-4 h-4 mr-2" />
                  {isEnglish ? "മലയാളം" : "English"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Family Overview */}
          <Card className="p-6 sm:p-8 mb-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                {isEnglish ? "Thazhuthedath Family History" : "താഴുതേടത്ത് കുടുംബ ചരിത്രം"}
              </h2>
              <p
                className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
                style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
              >
                {isEnglish
                  ? "This website is about the family history of Narayanan Kaimamal and his wife's two sons."
                  : "നാരായണൻ കൈമാമലിൻ്റെയും ഭാര്യയുടെയും രണ്ട് ആൺമക്കളുടെ കുടുംബ ചരിത്രത്തെക്കുറിച്ചാണ് ഈ വെബ്സൈറ്റ്."}
              </p>
            </div>
          </Card>

          {/* Founding Generation */}
          <Card className="p-6 sm:p-8 mb-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mr-4">
                <TreePine className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 dark:text-white">
                {isEnglish ? "Founding Generation" : "സ്ഥാപക തലമുറ"}
              </h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p
                className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-4"
                style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
              >
                {isEnglish
                  ? "Kochupilla Amma (daughter of Thazhuthedath Kallyani Amma) and Narayanan Kaimamal"
                  : "കൊച്ചുപിള്ള അമ്മ (തഴുത്തേടത്ത് കല്ല്യാണി അമ്മയുടെ മകൾ), നാരായണൻ കൈമാമൽ"}
              </p>
              <p
                className="text-base text-gray-600 dark:text-gray-400"
                style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
              >
                {isEnglish ? "Their 2 sons:" : "അവരുടെ 2 ആൺമക്കൾ:"}
              </p>
            </div>
          </Card>

          {/* Two Sons */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* First Son - Parameshwaran Nair */}
            <Card className="p-6 sm:p-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                  {isEnglish ? "First Son" : "ആദ്യ പുത്രൻ"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4
                    className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-2"
                    style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                  >
                    {isEnglish ? "Parameshwaran Nair" : "പരമേശ്വരൻ നായർ"}
                  </h4>
                  <p
                    className="text-sm text-gray-600 dark:text-gray-400 mb-3"
                    style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                  >
                    {isEnglish ? "(Thazhuthedath Tharavad, Karaman)" : "(തഴുത്തേടത്ത് തറവാട്, കരമൺ)"}
                  </p>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <div>
                    <p
                      className="font-medium text-gray-900 dark:text-white"
                      style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                    >
                      {isEnglish ? "Wife: Parukuttiamma" : "ഭാര്യ: പാറുക്കുട്ടിയമ്മ"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Second Son - Shivasankaran Nair */}
            <Card className="p-6 sm:p-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                  {isEnglish ? "Second Son" : "രണ്ടാമത്തെ മകൻ"}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4
                    className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-2"
                    style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                  >
                    {isEnglish ? "T.N. Shivasankaran Nair" : "ടി.എൻ. ശിവശങ്കരൻ നായർ"}
                  </h4>
                  <p
                    className="text-sm text-gray-600 dark:text-gray-400 mb-3"
                    style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                  >
                    {isEnglish ? "(Thiruvithamkoor, Petta)" : "(തിരുവിതാംകൂർ, പേട്ട)"}
                  </p>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <div>
                    <p
                      className="font-medium text-gray-900 dark:text-white"
                      style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                    >
                      {isEnglish ? "Wife: M.A. Saraswathi Amma" : "ഭാര്യ: എം.എ.സരസ്വതി അമ്മ"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Dynamic Family Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                    {loading ? "..." : stats.maleCount}
                  </p>
                  <p
                    className="text-sm text-gray-600 dark:text-gray-400"
                    style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                  >
                    {isEnglish ? "Male Members" : "പുരുഷ അംഗങ്ങൾ"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-800 rounded-lg">
                  <User className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                    {loading ? "..." : stats.femaleCount}
                  </p>
                  <p
                    className="text-sm text-gray-600 dark:text-gray-400"
                    style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                  >
                    {isEnglish ? "Female Members" : "സ്ത്രീ അംഗങ്ങൾ"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                    {loading ? "..." : stats.totalMembers}
                  </p>
                  <p
                    className="text-sm text-gray-600 dark:text-gray-400"
                    style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                  >
                    {isEnglish ? "Total Members" : "മൊത്തം അംഗങ്ങൾ"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <TreePine className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                    {loading ? "..." : stats.generations}
                  </p>
                  <p
                    className="text-sm text-gray-600 dark:text-gray-400"
                    style={!isEnglish ? { fontFamily: "Noto Sans Malayalam, sans-serif" } : {}}
                  >
                    {isEnglish ? "Generations" : "തലമുറകൾ"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MinimalLayout>
  )
}

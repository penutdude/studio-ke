"use client"

import { MinimalLayout } from "@/components/minimal-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookText, ImageIcon, Calendar, Users, Heart, Star, LogIn, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { HomepageEvents } from "@/components/homepage-events"

export default function HomePage() {
  const { user, signOut } = useAuth()

  const features = [
    {
      icon: BookText,
      title: "Family Blogs",
      description: "Share stories, memories, and experiences with your family",
      href: "/blogs",
      color: "bg-gray-100 dark:bg-gray-800",
    },
    {
      icon: Calendar,
      title: "Family Events",
      description: "Keep track of important dates and celebrations",
      href: "/events",
      color: "bg-gray-100 dark:bg-gray-800",
    },
    {
      icon: Users,
      title: "Family Tree",
      description: "Explore your family connections and relationships",
      href: "/family-tree",
      color: "bg-gray-100 dark:bg-gray-800",
    },
    {
      icon: ImageIcon,
      title: "Photo Gallery",
      description: "Preserve precious moments in our family gallery",
      href: "/gallery",
      color: "bg-gray-100 dark:bg-gray-800",
    },
  ]

  const handleAuthAction = async () => {
    if (user) {
      await signOut()
    }
  }

  return (
    <MinimalLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl pb-24 md:pb-8">
        {/* Header with Auth and Theme Toggle */}
        <div className="flex justify-between items-center mb-4">
          {/* Theme Toggle - Mobile Only */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block"></div>

          {/* Auth Button */}
          <div className="flex items-center">
            {user ? (
              <Button
                onClick={handleAuthAction}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-heading font-medium rounded-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-heading font-medium rounded-lg"
              >
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
          <div className="mb-4 md:mb-6">
            <Heart className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-800 dark:text-gray-200 animate-pulse-subtle" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-7xl font-heading font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
            Thazhuthedath
            <span className="block text-lg sm:text-xl md:text-4xl font-light text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
              Family Chronicles
            </span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
            Welcome to our family's digital home. A place where memories are preserved, stories are shared, and
            connections are celebrated.
          </p>
        </div>

        {/* Important Events Section */}
        <div className="mb-12 md:mb-16 px-2 md:px-0">
          <HomepageEvents />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mb-12 md:mb-16 px-2 md:px-0">
          {features.map((feature, index) => (
            <Link key={feature.href} href={feature.href}>
              <Card
                className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:scale-105 cursor-pointer animate-scale-in h-full"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-4 md:p-8">
                  <div
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl ${feature.color} flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-heading font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-12 animate-fade-in-up mx-2 md:mx-0">
          <Star className="w-8 h-8 md:w-12 md:h-12 mx-auto text-gray-700 dark:text-gray-300 mb-4 md:mb-6" />
          <h2 className="text-xl md:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
            Start Exploring
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 md:mb-8 max-w-md mx-auto px-4 md:px-0">
            Dive into our family's rich history and create new memories together.
          </p>
          <div className="flex flex-col gap-3 md:gap-4 md:flex-row justify-center">
            <Button
              asChild
              className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black font-heading font-medium px-6 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base"
            >
              <Link href="/family-tree">View Family Tree</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-heading font-medium px-6 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base"
            >
              <Link href="/blogs">Read Stories</Link>
            </Button>
          </div>
        </div>
      </div>
    </MinimalLayout>
  )
}

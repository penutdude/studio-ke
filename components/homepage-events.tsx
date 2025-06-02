"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Clock, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Database } from "@/lib/types/database.types"

type Event = Database["public"]["Tables"]["events"]["Row"]

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateFull(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function HomepageEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/events")
        if (response.ok) {
          const data = await response.json()
          // Get upcoming events (next 3)
          const upcomingEvents = data.filter((event: Event) => new Date(event.event_date) >= new Date()).slice(0, 3)
          setEvents(upcomingEvents)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in-up">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-6 md:mb-8">
          Important Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-6 md:mb-8">
          Important Events
        </h2>
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-6 md:p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No upcoming events scheduled</p>
            <Button
              asChild
              variant="outline"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-heading font-medium"
            >
              <Link href="/events">View All Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 dark:text-white">Important Events</h2>
        <Button
          asChild
          variant="ghost"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-heading font-medium"
        >
          <Link href="/events" className="flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {events.map((event, index) => (
          <Card
            key={event.id}
            className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:scale-105 cursor-pointer animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4 md:p-6">
              {/* Date Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase font-medium font-heading">
                      {new Date(event.event_date).toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white font-heading">
                      {new Date(event.event_date).getDate()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-gray-900 dark:text-white text-sm md:text-base line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-heading">
                      {formatDateFull(event.event_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-2 mb-4">
                {event.event_time && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span className="font-heading">{event.event_time}</span>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate font-heading">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{event.description}</p>
              )}

              {/* View Details Button */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-heading font-medium group-hover:border-gray-400 dark:group-hover:border-gray-600"
              >
                <Link href="/events" className="flex items-center justify-center gap-1">
                  View Details
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

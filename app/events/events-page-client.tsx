"use client"

import { useState } from "react"
import { EventCard } from "./event-card"
import { EventDetailsModal } from "./event-details-modal"
import type { Database } from "@/lib/types/database.types"

type Event = Database["public"]["Tables"]["events"]["Row"]

export function EventsPageClient({ events }: { events: Event[] }) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleCloseDetails = () => {
    setSelectedEvent(null)
  }

  return (
    <>
      <div className="grid gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onViewDetails={handleViewDetails} />
        ))}
      </div>

      <EventDetailsModal event={selectedEvent} isOpen={!!selectedEvent} onClose={handleCloseDetails} />
    </>
  )
}

import { Calendar, AlertCircle } from "lucide-react"
import { getEvents } from "./actions"
import { AddEventButton } from "./add-event-button"
import { EventsPageClient } from "./events-page-client"
import { MinimalLayout } from "@/components/minimal-layout"
import { checkDatabaseHealth } from "@/lib/supabase/health-check"
import { ErrorRetryButton } from "@/components/error-retry-button"

export default async function EventsPage() {
  let events = []
  let error = null

  try {
    // Check database health first
    const healthCheck = await checkDatabaseHealth()
    if (!healthCheck.healthy) {
      console.error("Database health check failed:", healthCheck)
      error = "Database connection failed. Please try again later."
    } else {
      events = await getEvents()
    }
  } catch (e) {
    console.error("Error in events page:", e)
    error = "Failed to load events. Please try again later."
  }

  return (
    <MinimalLayout title="Family Events">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <p className="text-muted-foreground">Plan gatherings and track important dates</p>
          <AddEventButton />
        </div>

        {error ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="elegant-card max-w-md mx-auto p-8">
              <div className="flex flex-col items-center">
                <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
                <h3 className="heading-3 mb-2">Something went wrong</h3>
                <p className="text-muted-foreground mb-6 text-center">{error}</p>
                <ErrorRetryButton onRetry={() => window.location.reload()} />
              </div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="elegant-card max-w-md mx-auto p-8">
              <div className="flex flex-col items-center">
                <Calendar className="h-12 w-12 mb-4 text-foreground" />
                <h3 className="heading-3 mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  Plan gatherings, track important dates, and never miss a family celebration.
                </p>
                <AddEventButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <EventsPageClient events={events} />
          </div>
        )}
      </div>
    </MinimalLayout>
  )
}

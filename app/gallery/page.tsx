import { ImageIcon } from "lucide-react"
import { getGalleryItems } from "./actions"
import { GalleryGrid } from "./gallery-grid"
import { AddPhotoButton } from "./add-photo-button"
import { MinimalLayout } from "@/components/minimal-layout"

export default async function GalleryPage() {
  let galleryItems = []
  let error = null

  try {
    galleryItems = await getGalleryItems()
  } catch (e) {
    console.error("Error fetching gallery items:", e)
    error = "Failed to load gallery items"
  }

  return (
    <MinimalLayout title="Family Gallery">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <p className="text-muted-foreground">Preserve and share our memories</p>
          <AddPhotoButton />
        </div>

        {error ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="elegant-card max-w-md mx-auto p-8">
              <div className="flex flex-col items-center">
                <ImageIcon className="h-12 w-12 mb-4 text-destructive" />
                <h3 className="heading-3 mb-2">Something went wrong</h3>
                <p className="text-muted-foreground mb-6">We couldn't load the gallery. Please try again later.</p>
              </div>
            </div>
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="elegant-card max-w-md mx-auto p-8">
              <div className="flex flex-col items-center">
                <ImageIcon className="h-12 w-12 mb-4 text-foreground" />
                <h3 className="heading-3 mb-2">No photos yet</h3>
                <p className="text-muted-foreground mb-6">
                  Preserve and share our precious family memories through photos.
                </p>
                <AddPhotoButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <GalleryGrid items={galleryItems} />
          </div>
        )}
      </div>
    </MinimalLayout>
  )
}

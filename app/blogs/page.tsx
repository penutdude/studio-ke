import { getBlogs } from "./actions"
import { BlogCard } from "./blog-card"
import { MinimalLayout } from "@/components/minimal-layout"
import { Search } from "lucide-react"
import { AddBlogButton } from "./add-blog-button"
import { Input } from "@/components/ui/input"

export default async function BlogsPage() {
  const blogs = await getBlogs()

  return (
    <MinimalLayout title="Family Stories">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search stories..." className="pl-10" />
          </div>
          <AddBlogButton />
        </div>

        {/* Blog Posts */}
        {blogs.length === 0 ? (
          <div className="text-center py-12 animate-scale-in">
            <div className="elegant-card max-w-md mx-auto p-8">
              <h3 className="heading-3 mb-2">No stories yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to share a family story.</p>
              <AddBlogButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {blogs.map((blog, index) => (
              <div key={blog.id} className={`animate-scale-in stagger-${Math.min(index + 1, 5)}`}>
                <BlogCard blog={blog} />
              </div>
            ))}
          </div>
        )}
      </div>
    </MinimalLayout>
  )
}

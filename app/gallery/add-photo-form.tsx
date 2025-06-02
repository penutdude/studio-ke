"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createGalleryItemWithUpload } from "./upload-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { ImageIcon, Loader2, Upload, Check, AlertCircle } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function AddPhotoForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFile(file)
  }

  const handleFile = (file: File | null) => {
    if (file) {
      // Reset states
      setUploadSuccess(false)
      setErrorMessage(null)

      // Check file type
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please select an image file (JPEG, PNG, etc.)")
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Check file size (limit to 2MB for data URLs)
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("File size must be less than 2MB")
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB for direct upload",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadSuccess(false)
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const resetForm = () => {
    clearSelectedFile()
    if (formRef.current) {
      formRef.current.reset()
    }
    setUploadSuccess(false)
    setErrorMessage(null)
  }

  async function handleSubmit(formData: FormData) {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a photo",
          variant: "destructive",
        })
        return
      }

      if (!selectedFile) {
        setErrorMessage("Please select an image to upload")
        toast({
          title: "Error",
          description: "Please select an image to upload",
          variant: "destructive",
        })
        return
      }

      // Add the user's email to the form data
      formData.set("uploaded_by", user.email || "Anonymous")

      // Add the file to the form data
      formData.set("file", selectedFile)

      const result = await createGalleryItemWithUpload(formData)

      if (result.error) {
        setErrorMessage(result.error)
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Show success state
      setUploadSuccess(true)
      setErrorMessage(null)

      toast({
        title: "Success",
        description: "Photo added successfully!",
      })

      // Reset form after a delay
      setTimeout(() => {
        resetForm()
      }, 2000)

      onSuccess()
    } catch (error) {
      console.error("Upload error:", error)
      setErrorMessage("Something went wrong. Please try again.")
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        handleSubmit(formData)
      }}
      className="flex flex-col gap-4"
    >
      {/* Image Upload Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Photo</Label>
          {selectedFile && (
            <button type="button" onClick={clearSelectedFile} className="text-xs text-primary hover:underline">
              Change photo
            </button>
          )}
        </div>

        {previewUrl ? (
          <div className="relative rounded-lg overflow-hidden border">
            <div className="aspect-video relative h-40">
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                fill
                className={cn("object-contain transition-all duration-300", uploadSuccess && "scale-95 opacity-80")}
              />

              {/* Success overlay */}
              {uploadSuccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-green-500 text-white p-2 rounded-full">
                    <Check className="h-8 w-8" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-2 bg-muted text-sm border-t flex justify-between items-center">
              <div className="truncate flex-1">
                <span className="font-medium">{selectedFile?.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`})
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer",
              dragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/20 hover:border-muted-foreground/50",
              errorMessage && "border-destructive/50",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              id="file"
              name="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-medium">Drag photo here</p>
                <p className="text-muted-foreground text-sm">or click to browse</p>
              </div>
              <div className="text-muted-foreground text-xs mt-1">Supported: JPEG, PNG, GIF, WebP • Max 2MB</div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-destructive text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Title and Description */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input id="title" name="title" required placeholder="Enter a title for your photo" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Tell us about this photo..."
            className="resize-none"
          />
        </div>
      </div>

      {/* Submit Button - Always visible */}
      <div className="sticky bottom-0 pt-2 mt-2">
        <Button
          type="submit"
          className={cn(
            "w-full py-2 font-medium transition-all duration-300",
            selectedFile ? "" : "bg-primary/50 text-primary-foreground/50 cursor-not-allowed",
          )}
          disabled={isSubmitting || !selectedFile || uploadSuccess}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : uploadSuccess ? (
            <div className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              <span>Uploaded Successfully</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Upload Photo</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}

"use client"

interface ErrorRetryButtonProps {
  onRetry: () => void
}

export function ErrorRetryButton({ onRetry }: ErrorRetryButtonProps) {
  return (
    <button onClick={onRetry} className="btn-elegant px-4 py-2 rounded-lg transition-colors">
      Try Again
    </button>
  )
}

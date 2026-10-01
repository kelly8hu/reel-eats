import { useEffect } from 'react'

interface Props {
  src: string
  alt: string
  onClose: () => void
}

/**
 * Full-screen view of a recipe's cover photo. Reel covers are portrait (9:16),
 * so the detail page shows a wide crop; this shows the whole image.
 * Closes on the × button, a tap anywhere, or Escape.
 */
export default function PhotoViewer({ src, alt, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    // Stop the page underneath from scrolling while the viewer is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <img src={src} alt={alt} className="photo-viewer-img" />
      <button
        className="photo-viewer-close"
        aria-label="Close photo"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        ×
      </button>
    </div>
  )
}

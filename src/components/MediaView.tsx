import { MediaKind, type MediaSource } from '../types'
import { mediaFilter, mediaSrc } from '../lib/media'
import type { MediaElement } from '../lib/mediaElement'

interface MediaViewProps {
  media: MediaSource
  registerRef?: (el: MediaElement | null) => void
  muted?: boolean
  className?: string
  draggable?: boolean
}

/**
 * Renders an image or video so it fills the parent box (object-contain).
 * The DOM element is registered upward for pixel sampling and playback control.
 */
export function MediaView({
  media,
  registerRef,
  muted = true,
  className = '',
  draggable = false,
}: MediaViewProps) {
  const src = mediaSrc(media)
  const filter = mediaFilter(media)
  const commonStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    filter,
  }

  if (media.kind === MediaKind.Video) {
    return (
      <video
        ref={registerRef}
        src={src}
        crossOrigin={media.crossOrigin ? 'anonymous' : undefined}
        muted={muted}
        playsInline
        preload="auto"
        draggable={draggable}
        style={commonStyle}
        className={className}
      />
    )
  }

  return (
    <img
      ref={registerRef}
      src={src}
      alt={`Media ${media.id}`}
      crossOrigin={media.crossOrigin ? 'anonymous' : undefined}
      draggable={draggable}
      style={commonStyle}
      className={className}
    />
  )
}

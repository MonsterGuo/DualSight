import { useRef } from 'react'
import { MediaKind, MediaTab, SlotId, type MediaSource } from '../types'
import { IMAGE_ACCEPT, VIDEO_ACCEPT, mediaSrc } from '../lib/media'
import { CloseIcon, FilmBadgeIcon, PlayIcon, UploadIcon } from './icons'

interface MediaSlotProps {
  slot: SlotId
  media: MediaSource | null
  tab: MediaTab
  onFiles: (files: FileList) => void
  onClear: () => void
}

const SLOT_COLOR: Record<SlotId, string> = {
  [SlotId.A]: '#4f8cff',
  [SlotId.B]: '#f0a050',
}

export function MediaSlot({ slot, media, tab, onFiles, onClear }: MediaSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const color = SLOT_COLOR[slot]
  const kindLabel = media?.kind === MediaKind.Video ? 'Video' : 'Image'

  const openPicker = () => inputRef.current?.click()

  return (
    <div
      className="overflow-hidden rounded-lg border border-line bg-panel2"
      data-slot={slot}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="flex h-9 items-center gap-2 px-2.5">
        <span
          className="grid h-5 w-5 place-items-center rounded-[5px] text-[11px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {slot}
        </span>
        <span className="text-[12.5px] font-medium text-ink">
          {kindLabel} {slot}
        </span>
        {media && (
          <button
            type="button"
            aria-label={`Remove ${slot}`}
            onClick={onClear}
            className="ml-auto grid h-6 w-6 place-items-center rounded text-muted transition-colors hover:bg-white/10 hover:text-ink"
          >
            <CloseIcon size={13} />
          </button>
        )}
      </div>

      {!media ? (
        <button
          type="button"
          data-drop-slot={slot}
          onClick={openPicker}
          className="flex h-[104px] w-full flex-col items-center justify-center gap-2 border-t border-line text-muted transition-colors hover:bg-white/[0.03] hover:text-ink"
        >
          <UploadIcon size={20} />
          <span className="text-[12px]">
            Drop or click · {tab === MediaTab.Image ? 'image' : 'video'} /{' '}
            {tab === MediaTab.Image ? 'video' : 'image'}
          </span>
        </button>
      ) : media.kind === MediaKind.Image ? (
        <div className="border-t border-line p-2" data-drop-slot={slot}>
          <div className="h-[72px] w-full overflow-hidden rounded bg-black">
            <img
              src={mediaSrc(media)}
              alt={media.name}
              crossOrigin={media.crossOrigin ? 'anonymous' : undefined}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
          <div className="truncate pt-2 text-[12px] text-ink">{media.name}</div>
          <div className="pb-0.5 pt-0.5 text-[11px] text-muted">
            {media.width} × {media.height}
          </div>
        </div>
      ) : (
        <div className="border-t border-line p-2" data-drop-slot={slot}>
          <div className="relative grid h-[96px] w-full place-items-center overflow-hidden rounded bg-black">
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-accentB px-1.5 py-[2px] text-[9px] font-bold tracking-wide text-black">
              <FilmBadgeIcon size={9} />
              VIDEO
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white/90">
              <PlayIcon size={13} />
            </span>
          </div>
          <div className="truncate pt-2 text-[12px] text-ink">{media.name}</div>
          <div className="pb-0.5 pt-0.5 text-[11px] text-muted">
            {media.width} × {media.height}
          </div>
        </div>
      )}
    </div>
  )
}

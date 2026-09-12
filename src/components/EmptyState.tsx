import { CompareImageIcon } from './icons'

interface EmptyStateProps {
  onExampleImages: () => void
  onExampleVideos: () => void
}

export function EmptyState({ onExampleImages, onExampleVideos }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 grid place-items-center p-6" data-drop-canvas>
      <div className="grid h-[74%] min-h-[380px] w-[min(64%,720px)] min-w-[420px] place-items-center rounded-[14px] border-[1.5px] border-dashed border-[#4a4a4a]">
        <div className="flex flex-col items-center">
          <div className="grid h-[88px] w-[88px] place-items-center rounded-[20px] bg-[#2c2c2c] text-muted">
            <CompareImageIcon size={42} />
          </div>
          <h2 className="mt-6 text-[22px] font-semibold tracking-tight text-white">
            Drop two files to compare
          </h2>
          <p className="mt-2.5 max-w-[470px] text-center text-[13px] leading-relaxed text-muted">
            Drag images or videos onto this canvas, or use the sidebar slots to load A and B.
            Supports PNG, JPG, WebP, MP4, WebM, MOV.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onExampleImages}
              className="h-10 rounded-lg bg-brand px-6 text-[13.5px] font-medium text-white transition-transform hover:brightness-110 active:scale-[0.98]"
            >
              Example images
            </button>
            <button
              type="button"
              onClick={onExampleVideos}
              className="h-10 rounded-lg border border-line bg-panel2 px-6 text-[13.5px] font-medium text-ink/80 transition-colors hover:border-[#4a4a4a] active:scale-[0.98]"
            >
              Example videos
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2 text-[12px] text-muted">
            <span>● Side by Side</span>
            <span>● Slider</span>
            <span>● Fade</span>
            <span>● Flicker</span>
          </div>
        </div>
      </div>
    </div>
  )
}

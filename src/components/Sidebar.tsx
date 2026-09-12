import {
  BackgroundKind,
  MediaKind,
  MediaTab,
  SlotId,
  type MediaSource,
  type SimilarityStats,
} from '../types'
import { MediaSlot } from './MediaSlot'
import { Toggle } from './Toggle'

interface SidebarProps {
  tab: MediaTab
  onTabChange: (t: MediaTab) => void
  mediaA: MediaSource | null
  mediaB: MediaSource | null
  onFiles: (slot: SlotId, files: FileList) => void
  onClear: (slot: SlotId) => void
  syncPan: boolean
  syncCursor: boolean
  onSyncPanChange: (v: boolean) => void
  onSyncCursorChange: (v: boolean) => void
  background: BackgroundKind
  onBackgroundChange: (b: BackgroundKind) => void
  stats: SimilarityStats | null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
      {children}
    </div>
  )
}

function TabButton({
  active,
  color,
  children,
  onClick,
}: {
  active: boolean
  color: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[20px] w-[38px] rounded-[5px] border text-[10.5px] font-bold transition-colors"
      style={{
        borderColor: active ? color : '#333333',
        color: active ? color : '#999999',
        backgroundColor: active ? `${color}1f` : 'transparent',
      }}
    >
      {children}
    </button>
  )
}

const BG_SWATCHES: { id: BackgroundKind; label: string; chipClass: string }[] = [
  { id: BackgroundKind.Dark, label: 'Dark', chipClass: 'bg-[#111111]' },
  { id: BackgroundKind.Light, label: 'Light', chipClass: 'bg-white' },
  { id: BackgroundKind.Checker, label: 'Check', chipClass: 'bg-checker' },
]

export function Sidebar({
  tab,
  onTabChange,
  mediaA,
  mediaB,
  onFiles,
  onClear,
  syncPan,
  syncCursor,
  onSyncPanChange,
  onSyncCursorChange,
  background,
  onBackgroundChange,
  stats,
}: SidebarProps) {
  const bothImages =
    mediaA?.kind === MediaKind.Image && mediaB?.kind === MediaKind.Image
  const eitherVideo =
    mediaA?.kind === MediaKind.Video || mediaB?.kind === MediaKind.Video
  const bothLoaded = !!mediaA && !!mediaB

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 pt-3">
          <SectionLabel>Media</SectionLabel>
          <div className="flex gap-1">
            <TabButton
              active={tab === MediaTab.Image}
              color="#4f8cff"
              onClick={() => onTabChange(MediaTab.Image)}
            >
              IMG
            </TabButton>
            <TabButton
              active={tab === MediaTab.Video}
              color="#f0a050"
              onClick={() => onTabChange(MediaTab.Video)}
            >
              VID
            </TabButton>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-3 pb-4">
          <MediaSlot
            slot={SlotId.A}
            media={mediaA}
            tab={tab}
            onFiles={(files) => onFiles(SlotId.A, files)}
            onClear={() => onClear(SlotId.A)}
          />
          <MediaSlot
            slot={SlotId.B}
            media={mediaB}
            tab={tab}
            onFiles={(files) => onFiles(SlotId.B, files)}
            onClear={() => onClear(SlotId.B)}
          />
        </div>

        <div className="border-t border-line px-3 py-3">
          <SectionLabel>Options</SectionLabel>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[12.5px] text-ink/90">Sync pan &amp; zoom</span>
            <Toggle checked={syncPan} onChange={onSyncPanChange} label="Sync pan and zoom" />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[12.5px] text-ink/90">Sync with cursor</span>
            <Toggle checked={syncCursor} onChange={onSyncCursorChange} label="Sync with cursor" />
          </div>

          <div className="pt-1.5">
            <span className="text-[12.5px] text-ink/90">Background</span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {BG_SWATCHES.map(({ id, label, chipClass }) => {
                const selected = background === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onBackgroundChange(id)}
                    className="flex h-[52px] flex-col items-center justify-center gap-1.5 rounded-md border transition-colors"
                    style={{
                      borderColor: selected ? '#4f8cff' : '#333333',
                      backgroundColor: selected ? '#1a2a40' : 'transparent',
                    }}
                  >
                    <span
                      className={`h-5 w-8 rounded-[4px] border border-white/10 ${chipClass}`}
                    />
                    <span
                      className="text-[10.5px]"
                      style={{ color: selected ? '#4f8cff' : '#999999' }}
                    >
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Similarity</SectionLabel>
          {stats && (
            <span className="text-[14px] font-semibold text-green">
              {stats.similarity.toFixed(1)}%
            </span>
          )}
        </div>

        {!bothLoaded ? (
          <p className="pt-1 text-[12px] leading-relaxed text-muted">
            Load both files to see stats.
          </p>
        ) : eitherVideo && !bothImages ? (
          <p className="pt-1 text-[12px] leading-relaxed text-muted">
            Similarity analysis is available for images only.
          </p>
        ) : stats ? (
          <div>
            <div className="h-[5px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-green transition-all"
                style={{ width: `${stats.similarity}%` }}
              />
            </div>
            <div className="space-y-2 pt-3 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted">Different pixels</span>
                <span className="text-accentB">{stats.diffPercent.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">PSNR</span>
                <span className="font-mono text-ink">
                  {stats.psnr > 50 ? '∞' : stats.psnr.toFixed(1)} dB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">SSIM</span>
                <span className="font-mono text-ink">{stats.ssim.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">MSE</span>
                <span className="font-mono text-ink">{stats.mse.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="pt-1 text-[12px] text-muted">Computing…</p>
        )}
      </div>
    </aside>
  )
}

import type { SVGProps, ReactNode } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  children: ReactNode
  filled?: boolean
}

function Icon({ size = 16, children, filled, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const PanelToggleIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="9" y1="4" x2="9" y2="20" />
  </Icon>
)

export const SideBySideIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </Icon>
)

export const SliderModeIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="15" y1="4" x2="15" y2="20" />
    <path d="M12 9v6M9.5 11.5 12 9l2.5 2.5M14.5 12.5 12 15l-2.5-2.5" />
  </Icon>
)

export const FadeIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </Icon>
)

export const FlickerIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Icon>
)

export const FitIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  </Icon>
)

export const ZoomInIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </Icon>
)

export const ZoomOutIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </Icon>
)

export const SwapIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M7 4 3.5 7.5 7 11" />
    <path d="M3.5 7.5H17" />
    <path d="m17 20 3.5-3.5L17 13" />
    <path d="M20.5 16.5H7" />
  </Icon>
)

export const FullscreenIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  </Icon>
)

export const UploadIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 16v2.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V16" />
  </Icon>
)

export const CloseIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </Icon>
)

export const PlayIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p} filled>
    <path d="M7 4.5v15l13-7.5z" />
  </Icon>
)

export const PauseIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p} filled>
    <rect x="6" y="4.5" width="4" height="15" rx="1" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" />
  </Icon>
)

export const StepBackIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p} filled>
    <path d="M18 5.5v13L8 12z" />
    <rect x="5" y="5" width="2.4" height="14" rx="1" />
  </Icon>
)

export const StepFwdIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p} filled>
    <path d="M6 5.5v13L16 12z" />
    <rect x="16.6" y="5" width="2.4" height="14" rx="1" />
  </Icon>
)

export const VolumeIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M11 5 6.5 8.5H3v7h3.5L11 19z" />
    <path d="M15.5 9a4 4 0 0 1 0 6" />
    <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
)

export const VolumeXIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M11 5 6.5 8.5H3v7h3.5L11 19z" />
    <line x1="21" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="21" y2="15" />
  </Icon>
)

/** Two stacked images with compare chevrons, used in the empty state. */
export const CompareImageIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p} strokeWidth={1.4}>
    <rect x="2.5" y="5" width="13" height="14" rx="2.5" />
    <path d="M8 10 6 12l2 2" />
    <rect x="8.5" y="5" width="13" height="14" rx="2.5" fill="#1e1e1e" />
    <path d="m16 10 2 2-2 2" />
  </Icon>
)

/** Compare chevrons for the slider handle. */
export const ChevronsIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p} strokeWidth={2.2}>
    <path d="m9 7-4 5 4 5" />
    <path d="m15 7 4 5-4 5" />
  </Icon>
)

/** Small chevrons for side-by-side divider. */
export const MiniChevronsIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p} strokeWidth={2.4}>
    <path d="m10 8-3 4 3 4" />
    <path d="m14 8 3 4-3 4" />
  </Icon>
)

export const FilmBadgeIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p} size={9} strokeWidth={2}>
    <rect x="2.5" y="4" width="19" height="16" rx="2" />
    <line x1="7" y1="4" x2="7" y2="20" />
    <line x1="17" y1="4" x2="17" y2="20" />
    <line x1="2.5" y1="9" x2="7" y2="9" />
    <line x1="2.5" y1="15" x2="7" y2="15" />
    <line x1="17" y1="9" x2="21.5" y2="9" />
    <line x1="17" y1="15" x2="21.5" y2="15" />
  </Icon>
)

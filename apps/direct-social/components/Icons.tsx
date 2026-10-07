type Props = { className?: string }

const base = (className = 'h-5 w-5') => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const PlayIcon = ({ className }: Props) => (
  <svg {...base(className)} fill='currentColor' stroke='none'>
    <path d='M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z' />
  </svg>
)
export const PauseIcon = ({ className }: Props) => (
  <svg {...base(className)} fill='currentColor' stroke='none'>
    <rect x='6' y='4' width='4' height='16' rx='1' />
    <rect x='14' y='4' width='4' height='16' rx='1' />
  </svg>
)
export const HeartIcon = ({ className, filled }: Props & { filled?: boolean }) => (
  <svg {...base(className)} fill={filled ? 'currentColor' : 'none'}>
    <path d='M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6a5 5 0 1 1 7.5 6.6Z' />
  </svg>
)
export const BookmarkIcon = ({ className, filled }: Props & { filled?: boolean }) => (
  <svg {...base(className)} fill={filled ? 'currentColor' : 'none'}>
    <path d='M6 3h12v18l-6-4-6 4V3Z' />
  </svg>
)
export const CommentIcon = ({ className }: Props) => (
  <svg {...base(className)}>
    <path d='M21 12a8 8 0 0 1-11.7 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z' />
  </svg>
)
export const MicIcon = ({ className }: Props) => (
  <svg {...base(className)}>
    <rect x='9' y='2' width='6' height='12' rx='3' />
    <path d='M5 10a7 7 0 0 0 14 0M12 17v5' />
  </svg>
)
export const ShareIcon = ({ className }: Props) => (
  <svg {...base(className)}>
    <path d='M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13' />
  </svg>
)
export const SearchIcon = ({ className }: Props) => (
  <svg {...base(className)}>
    <circle cx='11' cy='11' r='7' />
    <path d='m20 20-3.5-3.5' />
  </svg>
)
export const BellIcon = ({ className }: Props) => (
  <svg {...base(className)}>
    <path d='M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0' />
  </svg>
)
export const FlagIcon = ({ className }: Props) => (
  <svg {...base(className)}>
    <path d='M4 22V4m0 0h13l-2 4 2 4H4' />
  </svg>
)
export const BackIcon = ({ className }: Props) => (
  <svg {...base(className)}>
    <path d='M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5' />
    <text x='12' y='15.5' fontSize='7' textAnchor='middle' stroke='none' fill='currentColor'>
      15
    </text>
  </svg>
)
export const ForwardIcon = ({ className }: Props) => (
  <svg {...base(className)}>
    <path d='M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5' />
    <text x='12' y='15.5' fontSize='7' textAnchor='middle' stroke='none' fill='currentColor'>
      30
    </text>
  </svg>
)

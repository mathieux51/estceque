import type { User } from '@/lib/types'

const sizes = { sm: 'h-8 w-8 text-sm', md: 'h-10 w-10 text-base', lg: 'h-24 w-24 text-3xl' }

export default function Avatar({ user, size = 'md' }: { user: User; size?: keyof typeof sizes }) {
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt='' className={`${sizes[size]} shrink-0 rounded-full object-cover`} />
  }
  return (
    <span
      aria-hidden='true'
      className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-deep font-display text-white`}
    >
      {(user.displayName || user.handle).charAt(0).toUpperCase()}
    </span>
  )
}

/** The button shown in place of a player until the visitor asks to listen. */
export default function PlayButton({
  label,
  title,
  onClick,
}: {
  label: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex w-full items-center gap-3 rounded-lg border border-grey/40 bg-deep px-4 py-3 text-left transition-colors hover:border-white'
      aria-label={`Écouter : ${title}`}
    >
      <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand'>
        <svg
          viewBox='0 0 24 24'
          className='h-5 w-5'
          aria-hidden='true'
          fill='currentColor'
        >
          <path d='M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z' />
        </svg>
      </span>
      <span className='min-w-0 text-white'>{label}</span>
    </button>
  )
}

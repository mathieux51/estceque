// Cover shows a show's cover, or its initial on the brand colours.
export default function Cover({
  url,
  title,
  className = 'h-16 w-16',
}: {
  url: string | null
  title: string
  className?: string
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt='' className={`${className} shrink-0 rounded-lg object-cover`} />
  }
  return (
    <span
      aria-hidden='true'
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-lg border border-grey/40 bg-deep font-display text-2xl text-white`}
    >
      {title.charAt(0).toUpperCase()}
    </span>
  )
}

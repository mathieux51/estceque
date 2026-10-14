import Link from 'next/link'

export interface Example {
  label: string
  href: string
}

/** "À écouter : ..." followed by links to real productions. */
export default function Examples({ items }: { items: Example[] }) {
  return (
    <p className='text-sm'>
      À écouter :{' '}
      {items.map((item, i) => (
        <span key={item.href}>
          {i > 0 && ', '}
          <Link className='link' href={item.href}>
            {item.label}
          </Link>
        </span>
      ))}
    </p>
  )
}

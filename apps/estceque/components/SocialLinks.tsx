import { ExternalLink } from 'lucide-react'

/** Buttons to social profiles, opened in a new tab. */
export default function SocialLinks({
  links,
  label,
}: {
  links: { name: string; url: string }[]
  /** Accessible name of the group, e.g. "Réseaux sociaux de l'association". */
  label: string
}) {
  return (
    <ul className='flex flex-wrap gap-3' aria-label={label}>
      {links.map((link) => (
        <li key={link.url}>
          <a className='btn' href={link.url} target='_blank' rel='me noopener'>
            {link.name}
            <ExternalLink className='h-4 w-4' aria-hidden='true' />
          </a>
        </li>
      ))}
    </ul>
  )
}

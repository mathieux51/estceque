import Link from 'next/link'
import { AUDIENCES, type Project } from '@/lib/projects'

export default function ProjectCard({
  project,
  count,
}: {
  project: Project
  count: number
}) {
  return (
    <Link
      href={`/projets/${project.slug}/`}
      className='card flex flex-col gap-2 transition-colors hover:border-white'
    >
      <span className='text-xs uppercase tracking-wide text-warning'>
        {AUDIENCES[project.audience]} · {project.place}
      </span>
      <span className='font-display text-xl text-white'>{project.title}</span>
      <span className='text-sm'>{project.partner}</span>
      <span className='mt-auto pt-2 text-sm text-white'>
        {count} épisode{count > 1 ? 's' : ''} →
      </span>
    </Link>
  )
}

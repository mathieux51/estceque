import type { Metadata } from 'next'
import ProjectCard from '@/components/ProjectCard'
import { projectsWithEpisodes } from '@/lib/content'

const description =
  "Les projets radio et podcast de l'association avec les écoles, collèges, lycées, universités et structures sociales du Sud-Ouest : webradios, docu-fictions, podcasts de savoir."

export const metadata: Metadata = {
  title: 'Les projets',
  description,
  alternates: { canonical: '/projets/' },
  openGraph: { title: 'Les projets', description, url: '/projets/' },
}

export default function Projects() {
  const groups = projectsWithEpisodes()
  return (
    <div className='space-y-8'>
      <section className='space-y-3'>
        <h1 className='title text-4xl'>Les projets</h1>
        <p className='max-w-3xl'>{description}</p>
      </section>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {groups.map(({ project, episodes }) => (
          <ProjectCard
            key={project.slug}
            project={project}
            count={episodes.length}
          />
        ))}
      </div>
    </div>
  )
}

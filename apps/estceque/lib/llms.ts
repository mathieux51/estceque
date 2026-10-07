import { AUDIENCES } from './projects'
import {
  CONTACT_EMAIL,
  SITE_NAME,
  SITE_URL,
  episodes,
  formatDate,
  formatDuration,
  map,
  projectsWithEpisodes,
  shortTitle,
  show,
  summary,
} from './content'

// llms.txt (https://llmstxt.org): a plain summary of the site for AI
// assistants, in Markdown. The full version lists every episode.

function header(): string[] {
  return [
    `# ${SITE_NAME}`,
    '',
    `> ${show.paragraphs[0]}. Ateliers radio et podcast animés par Blandine Schmidt, docteure en Sciences de l'Information et de la Communication, chargée de projet de l'association et formatrice au CLEMI de l'académie de Bordeaux.`,
    '',
    `- Site : ${SITE_URL}/`,
    `- Contact : ${CONTACT_EMAIL}`,
    '- Référencée Pass Culture (Adage), pour les établissements scolaires.',
    `- Publics : ${Object.values(AUDIENCES).join(', ')}.`,
    `- Podcast : ${episodes.length} épisodes depuis ${episodes[episodes.length - 1].publishedAt.slice(0, 4)}, hébergés sur Ausha (${show.ausha}), flux RSS ${show.feed}`,
    '',
    '## Pages principales',
    '',
    `- [Ateliers radio et podcast avec Blandine Schmidt](${SITE_URL}/ateliers/) : déroulé d'un atelier, publics, exemples, questions fréquentes`,
    `- [Tous les podcasts](${SITE_URL}/podcasts/) : recherche par titre, établissement, ville, public ou année`,
    `- [Les projets](${SITE_URL}/projets/) : les épisodes regroupés par projet et par établissement`,
    `- [L'oreille voyageuse](${SITE_URL}/oreille-voyageuse/) : ${map.intro[1] ?? 'carte sonore plurilingue'}`,
    '',
    '## Projets',
    '',
    ...projectsWithEpisodes().map(
      ({ project, episodes: list }) =>
        `- [${project.title}](${SITE_URL}/projets/${project.slug}/) : ${project.partner}, ${project.place} (${AUDIENCES[project.audience]}, ${list.length} épisode${list.length > 1 ? 's' : ''}). ${project.summary}`
    ),
    '',
    '## Outils libres de l’association',
    '',
    '- [Direct Podcast](https://directpodcast.fr) : enregistrer sa voix en un clic dans le navigateur',
    '- [Direct Montage](https://directmontage.fr) : montage audio multipiste en ligne',
  ]
}

export function llmsText(): string {
  return [
    ...header(),
    '',
    '## Optional',
    '',
    `- [Liste complète des épisodes](${SITE_URL}/llms-full.txt)`,
    '',
  ].join('\n')
}

export function llmsFullText(): string {
  return [
    ...header(),
    '',
    '## Épisodes',
    '',
    ...episodes.map((episode) =>
      [
        `### [${shortTitle(episode)}](${SITE_URL}/podcasts/${episode.slug}/)`,
        '',
        `${episode.project.title} · ${episode.project.partner} · ${episode.project.place} · ${formatDate(episode.publishedAt)}${episode.durationSeconds ? ` · ${formatDuration(episode.durationSeconds)}` : ''}`,
        '',
        summary(episode.paragraphs, 600),
        '',
      ].join('\n')
    ),
  ].join('\n')
}

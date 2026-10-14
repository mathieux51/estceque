import { AUDIENCES } from './projects'
import {
  BLANDINE,
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
    `> Média associatif d'expression par le son, la radio et le podcast, implanté dans le Sud-Ouest de la France depuis 2007, intervenant en France et à l'étranger : studio de production sonore, accompagnement et réalisation de podcasts, ateliers d'Éducation aux Médias et à l'Information (EMI), studio de radio mobile et plateau radio live, ressources et outils pédagogiques. Interlocutrice : ${BLANDINE.name}, ${BLANDINE.role} (${BLANDINE.credentials.join(' ; ')}).`,
    '',
    `- Site : ${SITE_URL}/`,
    `- Contact : ${CONTACT_EMAIL}`,
    '- Référencée Adage Pass Culture, présente sur Chorus Pro.',
    `- Publics : ${Object.values(AUDIENCES).join(', ')}.`,
    `- Podcast : ${episodes.length} épisodes depuis ${episodes[episodes.length - 1].publishedAt.slice(0, 4)}, hébergés sur Ausha (${show.ausha}), flux RSS ${show.feed}`,
    '',
    '## Pages principales',
    '',
    `- [Espace scolaire : ateliers radio et podcast avec Blandine Schmidt](${SITE_URL}/espace-scolaire/) : formats, déroulé d'un atelier, publics, exemples, questions fréquentes`,
    `- [Espace pro & Recherche : le studio](${SITE_URL}/studio/) : accompagnement et production de podcasts pour les professionnels, les institutions et la recherche, identité sonore, plateau radio live`,
    `- [Espace pédagogique](${SITE_URL}/espace-pedagogique/) : outils gratuits Direct Podcast et Direct Montage`,
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

// The association's projects, used to group the podcast's episodes. Episodes
// are matched on their title, in this order; Ausha's season numbers do not
// follow the projects. Text shown to visitors is in French.

export type Audience =
  | 'ecole'
  | 'college'
  | 'lycee'
  | 'universite'
  | 'mediatheque'
  | 'social'
  | 'professionnels'

export const AUDIENCES: Record<Audience, string> = {
  ecole: 'École primaire',
  college: 'Collège',
  lycee: 'Lycée',
  universite: 'Université',
  mediatheque: 'Médiathèque',
  social: 'Structures sociales',
  professionnels: 'Professionnels',
}

export interface Project {
  slug: string
  title: string
  /** Where and with whom, shown under the title. */
  partner: string
  place: string
  audience: Audience
  summary: string
  match: RegExp
}

export const PROJECTS: Project[] = [
  {
    slug: 'radio-alternante',
    title: 'Radio Alternante',
    partner:
      'Master 2 Communication & générations, Université Bordeaux Montaigne',
    place: 'Bordeaux (33)',
    audience: 'universite',
    summary:
      "Les étudiantes en alternance du Master 2 Communication & générations racontent leur univers professionnel. Chaque saison naît d'un workshop radio animé par Blandine Schmidt.",
    match: /^Radio Alternante/i,
  },
  {
    slug: 'podcasts-du-savoir',
    title: 'Les podcasts du savoir',
    partner:
      'École doctorale Montaigne Humanités, Université Bordeaux Montaigne',
    place: 'Bordeaux (33)',
    audience: 'universite',
    summary:
      'Des doctorantes et doctorants racontent la thèse : méthode, financement, stress, enseignement, conférences. Ces podcasts sont réalisés pendant la formation « Atelier podcast - radio : production, diffusion et valorisation innovante du savoir dans un cadre scientifique ou pédagogique ».',
    match: /Un podcast d/i,
  },
  {
    slug: 'traversees',
    title: 'Traversées',
    partner: 'Université Bordeaux Montaigne',
    place: 'Bordeaux (33)',
    audience: 'universite',
    summary:
      'Une enquête sonore sur la transmission entre générations : traditions, nostalgie, authenticité et savoir-faire des territoires.',
    match: /^(TRAVERS[ÉE]ES|Jingle - Podcast Travers)/i,
  },
  {
    slug: 'correspondances-sonores',
    title: 'Correspondances sonores',
    partner:
      "Université Bordeaux Montaigne et collège Aliénor d'Aquitaine (Castillon-la-Bataille)",
    place: 'Gironde (33)',
    audience: 'universite',
    summary:
      "Des élèves et étudiant·e·s allophones de tous âges s'écrivent des lettres pour raconter leur parcours : ce qu'ils étaient, ce qu'ils sont devenus.",
    match: /^Correspondances sonores/i,
  },
  {
    slug: 'vignes-et-verites',
    title: 'Vignes & Vérités',
    partner: 'Filière viticole',
    place: 'France',
    audience: 'professionnels',
    summary:
      'Des professionnels de la vigne démêlent le vrai du faux : greffe, porte-greffes, traitement à l’eau chaude, sélection clonale ou massale.',
    match: /^VIGNES (ET|&) V[ÉE]RIT[ÉE]S/i,
  },
  {
    slug: 'frequences-migrantes',
    title: 'Fréquences migrantes',
    partner: 'Lycée des métiers Sud Gironde',
    place: 'Langon (33)',
    audience: 'lycee',
    summary:
      "Un podcast en 8 épisodes qui aborde l'histoire sous l'angle des parcours migratoires, à travers les témoignages de Seifullah, Josepha et Linda.",
    match: /Fr[ée]quences migrantes/i,
  },
  {
    slug: 'lycee-pablo-picasso',
    title: 'Docu-fictions du lycée Pablo Picasso',
    partner: 'Lycée professionnel Pablo Picasso',
    place: 'Périgueux (24)',
    audience: 'lycee',
    summary:
      "Fictions et docu-fictions écrites par les classes de bac pro et de CAP, souvent à partir des Archives départementales de la Dordogne : L'affaire Marie Védry, Périgueux à l'heure alsacienne, La révolte de Botrik, Rachilde, Georgina de Peyrebrune.",
    match:
      /(Botrik|Marie V[ée]dry|Rachilde|Georgina de Peyrebrune|heure alsacienne)/i,
  },
  {
    slug: 'la-voix-de-max',
    title: 'La voix de Max',
    partner: 'Collège Max Linder',
    place: 'Saint-Loubès (33)',
    audience: 'college',
    summary:
      'La webradio du collège : émissions en direct, reportages, brèves des éco-délégués, interviews de journalistes et de philosophes du XVIIIe siècle.',
    match: /^La voix de Max/i,
  },
  {
    slug: 'radio-alienor',
    title: 'Radio Aliénor',
    partner: "Collège Aliénor d'Aquitaine",
    place: 'Castillon-la-Bataille (33)',
    audience: 'college',
    summary:
      'Première émission de webradio scolaire du collège, produite et enregistrée en une journée, en conditions de direct.',
    match: /^Radio Ali[ée]nor/i,
  },
  {
    slug: 'radio-olympe-de-gouges',
    title: 'Radio Olympe de Gouges',
    partner: 'Collège Olympe de Gouges',
    place: 'Vélines (24)',
    audience: 'college',
    summary: "L'émission réalisée par les élèves du collège Olympe de Gouges.",
    match: /^Radio Olympe de Gouges/i,
  },
  {
    slug: 'radio-nautilus',
    title: 'Radio Nautilus',
    partner: 'École élémentaire Jules Verne',
    place: "Villenave d'Ornon (33)",
    audience: 'ecole',
    summary:
      "La webradio des élèves de l'école Jules Verne, enregistrée en conditions de direct.",
    match: /^Radio Nautilus/i,
  },
  {
    slug: 'super-bousier',
    title: 'Super Bousier contre l’impieratrice',
    partner:
      "Collège Chambéry (dispositif ULIS), avec l'auteur Christophe Léon",
    place: "Villenave d'Ornon (33)",
    audience: 'college',
    summary:
      "Un album sonore né de la résidence d'écriture « Lire, écrire pour l'environnement ».",
    match: /Super bousier/i,
  },
  {
    slug: 'bandes-annonces-litteraires',
    title: 'Bandes-annonces littéraires',
    partner: 'Médiathèque les Étoiles, atelier webradio Studio mobile',
    place: "Villenave d'Ornon (33)",
    audience: 'mediatheque',
    summary:
      'De jeunes lecteurs présentent leurs livres préférés sous forme de bandes-annonces radiophoniques.',
    match: /^Bande-annonce litt[ée]raire/i,
  },
  {
    slug: 'radio-des-sans-voix',
    title: 'La radio des sans voix',
    partner: 'Pension de famille Galilée de la Croix-Rouge',
    place: 'Bordeaux (33)',
    audience: 'social',
    summary:
      'Les résidents de la pension de famille prennent le micro : micros-trottoirs, souvenirs, objets fétiches et coups de cœur.',
    match: /(radio des sans voix|grigri|quoi de neuf de Sandrine|Galil[ée]e)/i,
  },
  {
    slug: 'radio-du-cafe-de-la-route',
    title: 'La radio du Café de la route',
    partner: 'Café de la route',
    place: "Villenave d'Ornon (33)",
    audience: 'social',
    summary:
      'Les habitués du café associatif s’initient à la radio et au podcast : coups de cœur, interviews et bandes-annonces.',
    match: /(caf[ée] de la route|coup de coeur)/i,
  },
]

export const OTHER_PROJECT: Project = {
  slug: 'autres-creations',
  title: 'Autres créations',
  partner: "Est-ce que t'entends ce que je vois ?",
  place: 'Sud-Ouest',
  audience: 'social',
  summary: "Les autres créations sonores de l'association.",
  match: /$^/,
}

export function projectFor(title: string): Project {
  return PROJECTS.find((project) => project.match.test(title)) ?? OTHER_PROJECT
}

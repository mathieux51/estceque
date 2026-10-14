# estceque.org: changes requested by the product manager

Source: Google Sheet "modification estceque.org" (read on 2026-10-14). Items
marked "En stand by" in the sheet (banner, part of "Les projets") are left
out. French text below is what visitors will read, copied from the sheet.

## Objective

Rework the home page around the association's offer (school, pro, research,
pedagogy, studio), add Blandine Schmidt as the contact person, show the Ausha
playlists, and polish the "L'oreille voyageuse" page.

## Progress

### Map page (`/oreille-voyageuse/`)

- [x] "Des voix, des histoires, des mondes à découvrir..." in bold
- [x] Link "Département d'Études de Français Langue Étrangère" to
      https://defle.u-bordeaux-montaigne.fr/fr/index.html
- [x] Link "Cité des Langues Étrangères, du Français et des Francophonies" to
      https://www.u-bordeaux-montaigne.fr/fr/formations/cleff-cite-des-langues.html
- [x] Replace the 📍 emoji with the Lucide "map-pin" icon (ISC licence, free
      to use)
- [x] "Pour écouter, il vous suffit de cliquer sur l'épingle puis sur
      lecture ▶️." in bold
- [x] White line at the top of the cover: explained (see Issues) and cropped
- [x] Map opens showing every continent (zoom out the embed's starting view)
- [x] Hide the base map switcher (layers icon) in the embed, as configured on
      Framacarte
- [x] Credit line becomes "Carte réalisée sur Framacarte" (remove ", fond de
      carte © les contributeurs OpenStreetMap")
- [x] "Les contes à écouter" becomes "LES CONTES À ÉCOUTER"
- [x] New box "UN PROJET PORTÉ PAR EST-CE QUE T'ENTENDS CE QUE JE VOIS ?"
      with the text from the sheet
- [x] "DEFLE - CLEFF" becomes "LE DEFLE À LA CLEFF DE L'UNIVERSITÉ BORDEAUX
      MONTAIGNE", with both links active

### Home page

- [x] Block 1, subtitle: "RADIO · PODCAST · ÉDUCATION AUX MÉDIAS ·
      RECHERCHES · PÉDAGOGIE"
- [x] Block 1, text: replace the two paragraphs with "Média associatif
      d'expression par le son, la radio et le podcast", the 5-item list
      (studio, accompagnement, EMI, radio mobile, ressources), "Implanté dans
      le Sud-Ouest de la France depuis 2007 / Intervention en France et à
      l'étranger", "Référencée Adage Pass Culture / Chorus Pro"
- [x] Block 1, 3 buttons:
  - [x] "Réserver un atelier radio - podcast" → Espace scolaire (the current
        Ateliers page, renamed)
  - [x] "Être accompagné pour produire son podcast" → new page "Espace pro &
        Recherche / Le studio"
  - [x] "Écouter un podcast" → the "Trouver un podcast" section
- [x] New section "Nous suivre sur les réseaux sociaux": Facebook and
      Instagram buttons
- [x] Block 2, new section "VOTRE INTERLOCUTRICE": Blandine Schmidt, chargée
      de projets, 4 credentials, "Contacter" button (mailto), her LinkedIn,
      Facebook and Instagram
- [x] Block 3, new section "NOTRE ÉCOSYSTÈME": 5 cards, each linking to its
      page (Espace scolaire, Espace pro, Espace recherche, Espace
      pédagogique, Le studio)
- [x] Block 4, "TROUVER UN PODCAST": show the 6 latest Ausha playlists as
      cards (same layout as the episode cards), without the "Lecteur Ausha"
      label. Feasible: the Ausha page lists 15 playlists
- [x] Remove the "Ateliers radio et podcast avec Blandine Schmidt" block from
      the home page
- [x] Block 5, "LES PROJETS" in capitals and bold, rest unchanged
- [x] Remove "Derniers épisodes"
- [x] Remove the second block marked "Derniers épisodes": read as the map
      section, still reached through the "Carte sonore" tab (see Decisions)

### Pages

- [x] Rename "Ateliers" to "Espace scolaire / Ateliers radio et podcast avec
      Blandine Schmidt"; move the home page's workshop block there, keep the
      current page content; redirect `/ateliers/` to the new address
- [x] New pages: Espace pro, Espace recherche, Espace pédagogique, Le studio
      (content needed, see Questions)
- [x] Header menu updated for the new pages
- [x] Structured data and `llms.txt` updated: Blandine Schmidt's credentials
      and profiles, the new pages

### Checks

- [x] Build, lint, Worker tests; desktop and phone screenshots for review
- [x] Deployed (2026-10-14)

## Issues

- White line at the top of the cover: the PDF's artwork stops 8 px (of
  2,250) short of the top edge. That band is transparent, and the conversion
  to JPEG filled it with white. It is cropped on the site (8 px off the top,
  4 px off each side, so the cover stays square); the source file could be
  corrected for other uses.
- The map's starting view: the embed forced zoom 3 and turned the base map
  switcher back on, overriding the map's own Framacarte settings (zoom 2,
  switcher hidden). The embed now follows those settings, and starts one
  zoom step out on screens narrower than 900 px so every continent fits.
- The sheet refers to two images ("comme sur l'image ci-contre", "l'icône
  ci-contre") that are not readable from the sheet's text. The map's starting
  view and the base map icon are clear enough to do without them.

## Questions for the product manager

Answered with the defaults below (see Decisions); to confirm with the
product manager.

1. Second "BLOC : Derniers épisodes": the sheet lists it twice, the second
   time with "garder l'accès par l'onglet en entête". Is that the map section
   ("L'oreille voyageuse, la carte sonore", header tab "Carte sonore") or the
   "Tout le podcast" player?
2. New pages: the button points to one page "Espace pro & Recherche / Le
   studio", while "Notre écosystème" lists separate pages (Espace pro, Espace
   recherche, Le studio). One page or three? And what content for each
   (texts, examples, prices or contact only)?
3. "Espace pédagogique": which tools and resources should it list? Direct
   Podcast and Direct Montage, plus others?
4. "Trouver un podcast": keep the search box and filters above the
   playlists, or only the playlists?
5. "Le studio": column C adds "Identité sonore - habillage sonore - jingle".
   Add these to the card's description?

## Decisions

- "UN PROJET PORTÉE PAR" is written "PORTÉ" (agrees with "projet").
- "Être accompagner" is written "Être accompagné".
- Q1: the second "Derniers épisodes" block is read as the map section
  ("L'oreille voyageuse, la carte sonore"): removed from the home page, still
  reached through the "Carte sonore" tab. "Tout le podcast" and "Contact"
  stay.
- Q2: one page, `/studio/` ("Espace pro & Recherche / Le studio"), with
  sections `#pro`, `#recherche` and `#studio`; the "Notre écosystème" cards
  link to these sections. Its content only uses the sheet's wording and
  existing productions as examples (Vignes & Vérités, Les podcasts du savoir,
  Traversées, L'oreille voyageuse, the Fréquences migrantes and Traversées
  jingles, the Radio Nautilus and Radio Aliénor live shows).
- Q3: `/espace-pedagogique/` lists Direct Podcast and Direct Montage.
- Q4: on the home page, "Trouver un podcast" shows the 6 latest playlists;
  the search over every episode stays on `/podcasts/`, linked under them.
- Q5: column C ("Identité sonore - habillage sonore - jingle") is in the
  "Le studio" card and on the studio page.
- "Ateliers" is now "Espace scolaire" at `/espace-scolaire/`; `/ateliers/`
  redirects there (301), tested in `worker/index.test.ts`.
- Playlists come from the show's Ausha page, which embeds them as JSON (there
  is no playlist feed); `npm run fetch` saves them to `data/playlists.json`,
  newest first, as Ausha orders them. The player plays a playlist with
  `playlistSlug`.
- "Lecteur Ausha" is removed from every player button, not only the
  playlists, for consistency.
- Social buttons are text buttons: Lucide no longer ships brand logos.
- Blandine Schmidt's credentials and profiles are in the site-wide
  structured data (Person, with the MICA lab) and in `llms.txt`.

## Next Steps

- Product manager: review the pages, confirm the answers above, and send
  content for the studio and pedagogy pages if it should go further.
- Items marked "En stand by" in the sheet (banner, projects).

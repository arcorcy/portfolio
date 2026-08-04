/**
 * The experience section, which is a browser window: one tab per experience,
 * school and work in one chronological run, oldest first.
 *
 * tabs
 *   kind        : 'work' | 'school' | 'freelance'. Groups the desktop windows:
 *                 employee time in the Chrome-like browser, the two schools in
 *                 an Apple Notes sidebar, the one freelance run in a terminal.
 *                 Three windows, each holding the tabs of one kind.
 *   app         : which macOS app the phone-sized window imitates, since below
 *                 lg every experience gets a window of its own instead. Chosen
 *                 for what that experience actually holds rather than for
 *                 variety: the one with a real testimonial is a mail thread, the
 *                 one that is a set of fields is a contact card. `kind` still
 *                 decides the desktop grouping, so the two schools stay on
 *                 'notes' and the freelance run on 'terminal'.
 *   place       : the company or school. Doubles as the tab label.
 *   role        : job title, or the diploma for a school.
 *   period      : as it should read on screen. `20XX` marks a placeholder.
 *   missions    : the kind of work, in a few words.
 *   url         : what the address bar shows, and where the site actually is.
 *   favicon     : the site's own icon, fetched from it and served from here so no
 *                 page load reaches out to anyone. null where the site has none:
 *                 École Estienne declares no icon and every usual path 404s.
 *   logo        : a slot for the real mark, still to come. The tab always shows
 *                 the favicon; the page shows the logo where there is one and
 *                 falls back to the favicon, then to the placeholder tile.
 *   description : the experience in Arthur's own words.
 *   quote       : the testimonial for that experience, or null. It lives in the
 *                 tab rather than in a deck of its own, so the words and the job
 *                 they belong to are read together.
 *
 * refusal : what the two dead window buttons say when pointed at. They are there
 *           to be tried, not to work.
 */

const PLACEHOLDER_PERIOD = '20XX — 20XX'
const PLACEHOLDER_MISSIONS = 'Missions to fill in'

/* Placeholder prose, saying what belongs in it rather than filling space: that
   is something to write against, and it cannot be mistaken for the real thing.
   One shared sentence rather than seven variations, for the same reason. */
const PLACEHOLDER_DESCRIPTION =
  'Placeholder copy, here so the window can be judged before the writing exists. A short paragraph belongs here on what the job actually was, what you were handed and what you left behind, in the words you would use with a colleague rather than with a jury.'

export const experience = {
  title: ['My designer journey'],
  refusal: "Don't you want to know about my experience ?",

  tabs: [
    {
      id: 'estienne',
      kind: 'school',
      app: 'notes',
      place: 'École Estienne',
      role: 'Licence Design Numérique - Interfaces',
      period: "2019 – 2022",
      missions: PLACEHOLDER_MISSIONS,
      url: 'https://www.ecole-estienne.paris/',
      logo: null,
      favicon: null,
      description: PLACEHOLDER_DESCRIPTION,
      quote: null,
    },
    {
      id: 'lisaa',
      kind: 'school',
      app: 'notes',
      place: 'LISAA Paris',
      role: 'Master Product Design',
      period: "2022 – 2024",
      missions: PLACEHOLDER_MISSIONS,
      url: 'https://www.lisaa.com/fr/ecole/arts-appliques-graphisme-paris',
      logo: null,
      favicon: '/favicons/lisaa.ico',
      description: PLACEHOLDER_DESCRIPTION,
      quote: null,
    },
    {
      id: 'outsight',
      kind: 'freelance',
      app: 'terminal',
      place: 'Outsight Studio',
      role: 'UI Designer Freelance',
      period: "2023",
      missions: PLACEHOLDER_MISSIONS,
      url: 'https://www.outsight.studio/',
      logo: null,
      favicon: '/favicons/outsight.png',
      description: PLACEHOLDER_DESCRIPTION,
      quote: null,
    },
    {
      id: 'wolfox',
      kind: 'work',
      app: 'safari',
      place: 'Wolfox Agency',
      role: 'Product Designer',
      period: "2022 – 2024",
      missions: PLACEHOLDER_MISSIONS,
      url: 'https://www.wolfox.studio/',
      logo: null,
      favicon: '/favicons/wolfox.png',
      description: PLACEHOLDER_DESCRIPTION,
      quote: null,
    },
    {
      id: 'ublo',
      kind: 'work',
      app: 'mail',
      place: 'Ublo Immo',
      role: 'Consultant Product designer',
      period: "June 2023 – August 2023",
      missions: PLACEHOLDER_MISSIONS,
      url: 'https://www.ublo.immo/',
      logo: null,
      favicon: '/favicons/ublo.png',
      description: PLACEHOLDER_DESCRIPTION,
      /* The only real quote on the site. Kept exactly as it was said, spelling
         and all: it is not Arthur's to tidy. Still to be sourced, and the client
         is not named yet. */
      quote: {
        text: "Chez Ublo.immo nous travaillons pour des utilisateurs dont les besoins nécessitent une analyse fine et précise de leur domaine d'expertise. Intégrer un talent de Wolfox en régie au sein de notre équipe design nous a apporté un nouveau regard. Ce talent Wolfox a su aborder nos problématiques dans toutes leurs nuances et proposer des résolutions simples et efficaces.",
        client: 'Client name',
      },
    },
    {
      id: 'mantu',
      kind: 'work',
      app: 'reminders',
      place: 'Agence Mantu',
      role: 'AI Product Designer',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: 'https://agence.mantu.com/',
      logo: null,
      favicon: '/favicons/mantu.png',
      description: PLACEHOLDER_DESCRIPTION,
      quote: {
        text: 'Placeholder quote. Replace with what they actually said: the raw sentence beats a polished summary.',
        client: 'Client name',
      },
    },
    {
      id: 'ceva',
      kind: 'work',
      app: 'contacts',
      place: 'CEVA Logistic',
      role: 'Consultant Product designer',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: 'https://www.cevalogistics.com/fr',
      logo: null,
      favicon: '/favicons/ceva.ico',
      description: PLACEHOLDER_DESCRIPTION,
      quote: {
        text: 'Placeholder quote. Replace with what they actually said: the raw sentence beats a polished summary.',
        client: 'Alexandre',
      },
    },
  ],
}

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
 *
 * next    : the button at the foot of the browser and of Notes, for whoever does
 *           not read a 11px tab strip as something to click. One label per window,
 *           and `restart` once the last entry is showing, since it loops.
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
  next: {
    work: 'Next job',
    school: 'Next school',
    restart: 'Back to the first',
  },

  tabs: [
    {
      id: 'estienne',
      kind: 'school',
      app: 'notes',
      place: 'École Estienne',
      role: 'Licence Design Numérique - Interfaces',
      period: "2019 – 2022",
      missions: 'UX-UI Design, Motion Design, 3D Modeling, Coding...',
      url: 'https://www.ecole-estienne.paris/',
      logo: '/favicons/logo-estienne.svg',
      favicon: null,
      description: 'Learning how to create digital experiences with sense including UX design, motion design through creative projects. I loved the creative part !',
      quote: null,
    },
    {
      id: 'lisaa',
      kind: 'school',
      app: 'notes',
      place: 'LISAA Paris',
      role: 'Master Product Design',
      period: "2022 – 2024",
      missions: 'Product Design, Design system, NoCode',
      url: 'https://www.lisaa.com/fr/ecole/arts-appliques-graphisme-paris',
      /* The first real mark of the seven. It is a portrait wordmark, 230 by 327,
         which the square slot handles on its own through object-contain. */
      logo: '/favicons/logo-lisaa.svg',
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
      missions: 'Freelance UI Design missions',
      url: 'https://www.outsight.studio/',
      logo: null,
      favicon: '/favicons/outsight.png',
      description: 'I‘ve worked on few project for UI Design supply with this greate team beside my studies.',
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
      missions: 'Product Design, Design system',
      url: 'https://www.ublo.immo/',
      logo: null,
      favicon: '/favicons/ublo.png',
      description: PLACEHOLDER_DESCRIPTION,
      quote: {
        text: "Chez Ublo.immo nous travaillons pour des utilisateurs dont les besoins nécessitent une analyse fine et précise de leur domaine d'expertise. Intégrer un talent de Wolfox en régie au sein de notre équipe design nous a apporté un nouveau regard. Ce talent Wolfox a su aborder nos problématiques dans toutes leurs nuances et proposer des résolutions simples et efficaces.",
        client: 'Éric Dugast, Head of Design',
      },
    },
    {
      id: 'mantu',
      kind: 'work',
      app: 'reminders',
      place: 'Agence Mantu',
      role: 'AI Product Designer',
      period: "2024 – Today",
      missions: 'Client products, Websites, AI training',
      url: 'https://agence.mantu.com/',
      logo: null,
      favicon: '/favicons/mantu.png',
      description:
        "Three hats, one desk. I design internal tools and showcase websites for our clients, and I'm the design team's AI Champion: I try the tools first, keep what works and get everyone else up to speed. I also train outside teams on design and AI, La Poste included.",
      quote: {
        text: 'Placeholder quote. Replace with what they actually said: the raw sentence beats a polished summary.',
        client: 'Client name',
      },
    },
    {
      id: 'ceva',
      kind: 'work',
      app: 'contacts',
      place: 'CEVA Logistics',
      role: 'Consultant Product Designer',
      period: "November 2025 – Today",
      missions: 'Product Design, Internal tool',
      url: 'https://www.cevalogistics.com/fr',
      logo: null,
      favicon: '/favicons/ceva.ico',
      description:
        "Still on it. I'm designing an internal tool with CEVA's Solution Experts, the team that builds the logistics answer behind each client deal. I sit with them, learn how they actually work, and turn that know-how into a product that saves them time instead of adding one more step.",
      quote: {
        text: 'Placeholder quote. Replace with what they actually said: the raw sentence beats a polished summary.',
        client: 'Alexandre',
      },
    },
  ],
}

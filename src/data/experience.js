/**
 * The experience section, which is a browser window: one tab per experience,
 * school and work in one chronological run, oldest first.
 *
 * tabs
 *   place       : the company or school. Doubles as the tab label.
 *   role        : job title, or the diploma for a school.
 *   period      : as it should read on screen. `20XX` marks a placeholder.
 *   missions    : the kind of work, in a few words.
 *   url         : what the address bar shows. null until the real one lands, and
 *                 the bar then says so rather than inventing a domain.
 *   logo        : a slot for the mark, used as the tab's favicon. null draws the
 *                 placeholder tile.
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
      place: 'École Estienne',
      role: 'Licence Design Numérique - Interfaces',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: null,
      logo: null,
      description: PLACEHOLDER_DESCRIPTION,
      quote: null,
    },
    {
      id: 'lisaa',
      place: 'LISAA Paris',
      role: 'Master Product Design',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: null,
      logo: null,
      description: PLACEHOLDER_DESCRIPTION,
      quote: null,
    },
    {
      id: 'outsight',
      place: 'Outsight Studio',
      role: 'UI Designer Freelance',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: null,
      logo: null,
      description: PLACEHOLDER_DESCRIPTION,
      quote: null,
    },
    {
      id: 'wolfox',
      place: 'Wolfox Agency',
      role: 'Product Designer',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: null,
      logo: null,
      description: PLACEHOLDER_DESCRIPTION,
      quote: null,
    },
    {
      id: 'ublo',
      place: 'Ublo Immo',
      role: 'Consultant Product designer',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: null,
      logo: null,
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
      place: 'Agence Mantu',
      role: 'AI Product Designer',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: null,
      logo: null,
      description: PLACEHOLDER_DESCRIPTION,
      quote: {
        text: 'Placeholder quote. Replace with what they actually said: the raw sentence beats a polished summary.',
        client: 'Client name',
      },
    },
    {
      id: 'ceva',
      place: 'CEVA Logistic',
      role: 'Consultant Product designer',
      period: PLACEHOLDER_PERIOD,
      missions: PLACEHOLDER_MISSIONS,
      url: null,
      logo: null,
      description: PLACEHOLDER_DESCRIPTION,
      quote: {
        text: 'Placeholder quote. Replace with what they actually said: the raw sentence beats a polished summary.',
        client: 'Alexandre',
      },
    },
  ],
}

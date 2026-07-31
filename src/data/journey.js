/**
 * The journey — school and work in one chronological run, oldest first, plus
 * the testimonials hanging off it.
 *
 * timeline
 *   place / role : what shows in the list.
 *   quote        : names an entry in `quotes`. Several experiences may point at
 *                  the same one. An entry with no quote leaves the deck where it
 *                  is rather than emptying it.
 *
 * quotes
 *   text     : the testimonial, as said. Not trimmed, not tidied.
 *   client   : who said it.
 *   company  : where they said it from.
 *   at       : the timeline id it belongs to, so the card can name the job.
 *   logo     : a slot. null draws the placeholder until the real mark arrives.
 *
 * The deck order is derived from the timeline, never written by hand: see
 * lib/journey.js. That way a quote shared by two experiences cannot fall out of
 * step with the list.
 */

export const journey = {
  title: ['My designer journey'],

  timeline: [
    { id: 'estienne', place: 'École Estienne', role: 'Licence Design Numérique - Interfaces' },
    { id: 'lisaa', place: 'LISAA Paris', role: 'Master Product Design' },
    { id: 'outsight', place: 'Outsight Studio', role: 'UI Designer Freelance' },
    { id: 'wolfox', place: 'Wolfox Agency', role: 'Product Designer' },
    { id: 'ublo', place: 'Ublo Immo', role: 'Consultant Product designer', quote: 'ublo' },
    { id: 'mantu', place: 'Agence Mantu', role: 'AI Product Designer', quote: 'mantu' },
    { id: 'ceva', place: 'CEVA Logistic', role: 'Consultant Product designer', quote: 'ceva' },
  ],

  quotes: {
    ublo: {
      text: "Chez Ublo.immo nous travaillons pour des utilisateurs dont les besoins nécessitent une analyse fine et précise de leur domaine d'expertise. Intégrer un talent de Wolfox en régie au sein de notre équipe design nous a apporté un nouveau regard. Ce talent Wolfox a su aborder nos problématiques dans toutes leurs nuances et proposer des résolutions simples et efficaces.",
      client: 'Client name',
      company: 'Ublo.immo',
      at: 'ublo',
      logo: null,
    },
    mantu: {
      text: 'Placeholder quote. Replace with what they actually said: the raw sentence beats a polished summary.',
      client: 'Client name',
      company: 'Agence Mantu',
      at: 'mantu',
      logo: null,
    },
    ceva: {
      text: 'Placeholder quote. Replace with what they actually said: the raw sentence beats a polished summary.',
      client: 'Alexandre',
      company: 'CEVA Logistic',
      at: 'ceva',
      logo: null,
    },
  },
}

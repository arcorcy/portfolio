/**
 * Testimonials — scattered cards the visitor can drag around.
 *
 * left / top : starting position as a percentage of the wrapper, taken from
 *              the mock. The cards are meant to look dropped, not aligned.
 * rot        : starting rotation in degrees.
 *
 * Two entries are still placeholders: Arthur has the real quotes to paste in.
 */

export const testimonials = [
  {
    id: 'suzuki',
    client: 'Suzuki',
    role: 'Client of Agence Mantu',
    quote:
      'If I cannot explain why something is that way in a single sentence, I have a preference, not a decision.',
    left: 10,
    top: 11,
    rot: 0,
  },
  {
    id: 'placeholder-manager',
    client: 'Client name',
    role: 'Mantu Agence Manager',
    quote:
      'Placeholder quote. Replace with what they actually said, the raw sentence beats a polished summary.',
    left: 48,
    top: 10,
    rot: -6,
  },
  {
    id: 'placeholder-colleague',
    client: 'Client name',
    role: 'Colleague',
    quote:
      'Placeholder quote. Replace with a colleague talking about what it is like to work with you.',
    left: 15,
    top: 49,
    rot: 6.5,
  },
  {
    id: 'ceva',
    client: 'CEVA Logistic',
    role: 'Alexandre, Client of Agence Mantu',
    quote:
      'The happy path is the easy 20%. People remember how a product behaves when things go sideways.',
    left: 58,
    top: 54,
    rot: 0,
  },
]

/**
 * The deck arithmetic behind the journey section. Pure, so the ordering can be
 * checked on its own: the whole point is that the cards can never fall out of
 * step with the timeline they hang off.
 */

/* The cards, in the order the timeline reaches them. Written down once here
   rather than by hand in the data, so a quote shared by two experiences appears
   once and keeps its place. */
export function deckOrder(timeline) {
  const seen = []
  for (const entry of timeline) {
    if (entry.quote && !seen.includes(entry.quote)) seen.push(entry.quote)
  }
  return seen
}

/* Which card is in front for each entry of the timeline.

   An entry with no quote holds the card the previous one put up, so a run of
   school years does not leave the deck empty. Before the first quote there is
   nothing to show yet: -1 means no card is in front, and every card sits one
   slot back, which is how the deck reads as "what is coming". */
export function deckIndexes(timeline, order = deckOrder(timeline)) {
  let current = -1
  return timeline.map((entry) => {
    if (entry.quote) current = order.indexOf(entry.quote)
    return current
  })
}

/* Where a card sits, given how far it is from the front.

   Behind: down and to the right, smaller, dimmer, and only the next two are
   worth showing. In front: square to the grid. Past: up and gone, which is the
   direction the whole deck travels. */
const SLOTS = [
  { x: 0, y: 0, rot: 0, scale: 1, opacity: 1 },
  { x: 5, y: 7, rot: 2.2, scale: 0.955, opacity: 0.5 },
  { x: 10, y: 14, rot: 4.4, scale: 0.91, opacity: 0.22 },
]

const GONE_UP = { x: -4, y: -78, rot: -3, scale: 0.94, opacity: 0 }

export function cardSlot(distance) {
  if (distance < 0) return GONE_UP
  if (distance < SLOTS.length) return SLOTS[distance]
  // Deeper than the stack shows: parked at the back, waiting its turn.
  return { ...SLOTS[SLOTS.length - 1], opacity: 0 }
}

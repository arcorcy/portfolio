/**
 * All the copy lives here. Change it here, not in the components.
 * Titles are arrays of lines: one entry per visual line.
 */

export const profile = {
  name: 'Arthur Corcy',
  role: 'AI Product Designer',
  company: 'Agence Mantu',
  location: 'Paris, France',
  email: 'ar.corcy@gmail.com',
  linkedin: 'https://www.linkedin.com/in/arthur-corcy/',
  year: '2026',
}

export const nav = [
  { id: 'work', label: 'Works' },
  { id: 'process', label: 'Design with AI' },
  { id: 'experience', label: 'Experiences' },
  { id: 'contact', label: 'Contact' },
]

export const hero = {
  /* Two lines. `accent` is the part sitting on the lime block, so the split
     lives here and not in the component. */
  greeting: "Hi, I'm Arthur",
  claim: { lead: "I'm an", accent: 'AI product designer*' },
  /* The footnote the asterisk points at. Rewritten from the mock, where the word
     order had slipped: "I design with powerful tools interfaces that solve
     problems" put the tools before the thing being designed. */
  note: '*I design interfaces with powerful tools to solve problems (and I make sure it looks good).',
}

export const work = {
  title: ["Things I've shipped"],
}

/*
 * The section is a pinned sequence: one step on screen at a time, its text on
 * the left, its arrangement of icons on the right. Scrolling moves from one
 * step to the next, so the four steps read as one continuous animation.
 *
 * icons — `id` is a key in Process.jsx's ART map. x/y place the centre of the
 *   card as a percentage of the square composition box, size is its side as a
 *   percentage of that box, rot is degrees. The numbers are deliberately
 *   uneven: scattered, but on a system.
 * links — [fromId, toId, bow]. An arc drawn between two cards of this step.
 *   bow is how far it bends, as a fraction of its own drawn length; the sign
 *   picks the side it bends towards.
 *
 * Braces mark the accented words, and they can wrap more than one. One per
 * paragraph: the accent is there so a term catches the eye on a first pass, and
 * five lit words in a paragraph catch nothing.
 */
export const process = {
  title: ['How I actually work with AI'],
  steps: [
    {
      id: 'everyday',
      paragraphs: [
        '{AI} runs through most of my day now, and it pulls its weight.',
      ],
      icons: [{ id: 'AI', x: 50, y: 50, size: 38, rot: -3 }],
      links: [],
    },
    {
      id: 'mcp',
      paragraphs: [
        'My AI tools plug straight into the workflow I already had. {Figma MCP} takes the repetitive passes off my hands, across whatever data I point it at.',
      ],
      icons: [
        { id: 'AI', x: 26, y: 57, size: 38, rot: -8 },
        { id: 'FIG', x: 75, y: 44, size: 38, rot: 7 },
        { id: 'HEART', x: 50, y: 16, size: 16, rot: -4 },
      ],
      links: [['AI', 'FIG', -0.2]],
    },
    {
      id: 'plugins',
      paragraphs: [
        "I also {vibe code} my own {plugins} when nothing off the shelf fits. The tool shouldn't decide what the work looks like, so I build the tool around the job instead.",
      ],
      icons: [
        { id: 'AI', x: 20, y: 25, size: 36, rot: 4 },
        { id: 'PLG', x: 38, y: 77, size: 36, rot: -3 },
        { id: 'FIG', x: 80, y: 50, size: 36, rot: 9 },
      ],
      links: [
        ['AI', 'PLG', 0.24],
        ['PLG', 'FIG', 0.24],
      ],
    },
    {
      id: 'testing',
      paragraphs: [
        "I'm completely sold on AI for {user testing}. It's quicker to put together than a Figma prototype, the motion is closer to the real thing, and you can wire it to live data when the test calls for it.",
        'The design still lives in Figma. AI just reaches in through {MCP} and makes it move.',
      ],
      icons: [
        { id: 'FIG', x: 22, y: 25, size: 37, rot: -8 },
        { id: 'AI', x: 76, y: 47, size: 36, rot: 5 },
        { id: 'TST', x: 30, y: 78, size: 34, rot: 3 },
      ],
      links: [
        ['FIG', 'AI', -0.22],
        ['AI', 'TST', -0.24],
      ],
    },
  ],
}

export const contact = {
  lead: ["Don't hesitate to contact me.", "I swear I don't let AI read my emails."],
  /* What the email button says once the address is on the clipboard. One word,
     because it is read at a glance in the second and a half before the address
     comes back, and because it is also what a screen reader announces. */
  copied: 'Copied',
}


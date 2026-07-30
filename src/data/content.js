/**
 * All the copy lives here. Change it here, not in the components.
 * Titles are arrays of lines: one entry per visual line.
 */

export const profile = {
  name: 'Arthur Corcy',
  role: 'AI Product Designer',
  company: 'ARNEO_',
  location: 'Paris, France',
  email: 'ar.corcy@gmail.com',
  linkedin: 'https://www.linkedin.com/in/arthur-corcy/',
  year: '2026',
}

export const nav = [
  { id: 'work', label: 'Works' },
  { id: 'process', label: 'How I work' },
  { id: 'experience', label: 'Experiences' },
  { id: 'story', label: 'Other stuffs' },
  { id: 'contact', label: 'Contact' },
]

export const hero = {
  lead: "I'm Arthur, AI Product Designer at ARNEO_. I design interfaces that solve a problem and make the solution look good.",
  cta: { label: 'See the work', href: '#work' },
}

export const work = {
  title: ['Things I have shipped'],
}

export const process = {
  title: ['How I actually work'],
  paragraphs: [
    "In my everyday work, AI has become a huge advantage in many aspects of my job.",
    "I'm deeply conviced of the use of AI for user testing : faster to animate than a Figma prototype, more accurate animations and connected data if needed. It's a total yes.",
    "But AI is also directly connected to my initial workflow : I use Figma MCP to achieve repetitive tasks. But also as plugins fully vibe coded that fills some specific needs. I don't shape the result by the product I use, I build the product specifically for my mission.",
    'Tokens, states, motion specs, contrast ratios, the unglamorous dialog nobody sketched. I write the system so a developer never has to guess what I meant, and I stay in the room until it is actually live. A design that ships badly is not a design that shipped.',
  ],
  /* Illustrations dropped into the empty half of each paragraph block, one per
     paragraph in order. `icon` is a key in Process.jsx's ART map. left/top are
     percentages of the block, rot is degrees, size is px on desktop. The
     numbers are deliberately uneven: scattered, but on a system. */
  marks: [
    { icon: 'AI', left: 70, top: 13, rot: -7, size: 156 },
    { icon: 'TST', left: 9, top: 21, rot: 6, size: 132 },
    { icon: 'FIG', left: 66, top: 9, rot: 9, size: 144 },
    { icon: 'PLG', left: 11, top: 24, rot: -10, size: 150 },
  ],
}

export const testimonials = {
  title: ['What my clients and', 'colleagues say'],
}

export const career = {
  workTitle: 'Where I have worked',
  eduTitle: 'And where I learned',
}

export const story = {
  title: ['I got here the long way'],
  paragraphs: [
    'I knew very early that I was meant to work in digital world. I started building small videogames with Unity or Construct at 14, then motion design 16. At 18 I was sure : I wana build digital products',
    'Outside of work I am always studying with passion software or apps to understand how they are built, why and for what goal. I occasionally do the same for hardware such as 8mm projectors. It goes back together roughly 80% of the time.',
  ],
  // Cards scattered next to the text. left/top are percentages of the
  // wrapper, rot is degrees.
  facts: [
    { k: 'Based in', v: 'Paris, France', left: 22, top: 26, rot: -4 },
    { k: 'Works in', v: 'French & English', left: 46, top: 38, rot: 16 },
  ],
}

export const oneMore = {
  title: ['One more thing'],
  placeholder: 'Waiting for content, keep this placeholder',
}

export const contact = {
  lead: ["Don't hesitate to contact me.", "I swear I don't let AI read my emails."],
}

export const experience = [
  {
    company: 'ARNEO_',
    role: 'Product Designer',
    period: 'Sept. 2024 — now',
    note: 'Product and interface design for client teams, with AI built into research, ideation and prototyping.',
  },
  {
    company: 'Wolfox',
    role: 'UI / Product Designer',
    period: '2022 — 2024',
    note: 'Web and product design across client projects. Started here as an intern in 2021 and stayed.',
  },
  {
    company: 'Ublo Immo',
    role: 'Product Designer',
    period: '2023',
    note: 'Interface work on a property management platform.',
  },
]

export const education = [
  { school: 'LISAA', degree: 'Digital design', period: 'Paris' },
  { school: 'École Estienne', degree: 'Digital graphic design, interface design', period: 'Paris' },
  { school: 'Lycée Saint Joseph LaSalle', degree: 'Applied arts', period: '' },
]

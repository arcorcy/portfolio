/**
 * Projects — rendered as a draggable deck in the Work section.
 * The deck shows one project at a time; the panel next to it carries the copy.
 *
 * title    : the one-sentence framing of what you did. Reads as a headline.
 * subtitle : one short qualifier (client, context, kind of work).
 * cover    : path under /public or an import. Empty string falls back to the
 *            generated placeholder.
 * link     : case study or live site. null hides the CTA.
 */

export const projects = [
  {
    id: 'figma-plugin',
    title:
      'How I helped my colleagues to accelerate their Figma project setup with a Figma Plugin',
    subtitle: 'Internal tool',
    cover: '',
    link: null,
  },
  {
    id: 'project-02',
    title: 'Placeholder project. Replace with the real one, framed as a sentence.',
    subtitle: 'Client name',
    cover: '',
    link: null,
  },
  {
    id: 'project-03',
    title: 'Placeholder project. Say what was broken before you touched it.',
    subtitle: 'Client name',
    cover: '',
    link: null,
  },
  {
    id: 'project-04',
    title: 'Placeholder project. A clear before and after beats a metric.',
    subtitle: 'Client name',
    cover: '',
    link: null,
  },
]

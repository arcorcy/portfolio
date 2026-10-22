/**
 * Projects — four windows on the Work section's stage, overlapping the way things
 * on a desk do. Pointing at one lifts it and pushes the other three back; the copy
 * turns up beside it. They can be picked up and carried.
 *
 * title    : the one-sentence framing of what you did. Reads as a headline.
 * subtitle : one short qualifier (client, context, kind of work).
 * cover    : path under /public or an import. Empty string falls back to the
 *            generated placeholder.
 * link     : case study or live site. null hides the CTA.
 * study    : the case study opened by clicking the card. Absent means the card
 *            is not clickable.
 *
 * Layout — the window sits on the stage, and where it sits is part of the design
 * rather than something the code works out:
 * label    : the short name the window's title bar carries. The long `title` is
 *            the headline beside the window, not a window title.
 * mat      : which colour the shot sits on inside its window, a key in Work.jsx's
 *            MAT map. One per project, not shared: each project's ground is its
 *            own, and the window's header stays paper regardless.
 * crop     : which corner of the shot survives the crop, a key in Work.jsx's CROP
 *            map. Optional, and 'top' is the default: the shot is fitted to the
 *            mat's box by width, so what the crop decides is where the leftover
 *            height comes off, and an interface keeps its header.
 * x / y    : the window's top left corner, as a percentage of the stage. Its top
 *            left and not its centre, unlike an experience window: those carry a
 *            height in the data, and there is no half width to give back here
 *            since every window is the same fixed width.
 *
 * No size and no chrome: every window is WINDOW_WIDTH wide with a macOS bar, and
 * they are all the same height, so the arrangement is two numbers per project.
 *
 * What to know before moving one, because it is the one thing that bites: the
 * width is in viewport units while these are percentages of the stage, and the
 * stage caps on viewport *height*, so a window is a larger share of the stage the
 * shorter the window gets. Measured, it goes from 49% x 60% at 1440x900 to
 * 54% x 67% at 1280x720. The arrangement therefore has to hold at the second of
 * those, not the first, which puts the ceiling at x 45 and y 32 rather than the
 * 51 and 40 the wide case would allow.
 */

/* The plugin's own interface, used twice: the card cover in Works and the banner
   at the top of the case study.

   A path under /public rather than an import, unlike the illustrations in
   src/img: a missing file is then a missing image instead of a build that will
   not run, which is what the slot is for while a screenshot is still coming. */
const variableGenerator = '/covers/variable-generator.png'

// Copy still to come for these three, so their cards carry a placeholder sentence.
const emeis = '/covers/emeis.png'
const ceva = '/covers/ceva.png'
const indesPilot = '/covers/indespilot.png'

// The canvas shot from Bowards' own homepage, so the two never show different products.
const bowards = '/covers/bowards.png'

/* A study that exists so the card opens and the page can be judged before the
   writing does. Shared on purpose rather than written twice: two identical
   placeholders read as provisional, two different ones read as copy.

   The sections say what belongs in them instead of filling space, which is
   something to write against and impossible to mistake for the real thing.
   Delete the call, not the text, when the copy arrives. */
function placeholderStudy(cover) {
  return {
    cover,
    sections: [
      {
        title: 'Placeholder. What was in the way before anyone opened Figma.',
        paragraphs: [
          'Placeholder copy, sitting here so the shape of the page can be judged before the writing exists. Two or three sentences belong here on the problem as it actually turned up, in the words you would use with a colleague rather than with a jury.',
        ],
      },
      {
        title: 'Placeholder. The decision you would defend.',
        paragraphs: [
          'Placeholder copy. One idea rather than a list of screens: the call that changed the outcome, and what it cost to make it.',
        ],
        figure: { cover: null, caption: 'Placeholder figure' },
      },
      {
        title: 'Placeholder. What came out of it.',
        paragraphs: [
          'Placeholder copy. What moved, with a number if there is one and without one if there is not.',
        ],
      },
    ],
  }
}

export const projects = [
  {
    id: 'figma-plugin',
    /* The case study, opened by clicking the card. `figure` is a slot: null
       draws the placeholder tile until the real screenshot arrives. Kept in
       French, as written: it is Arthur's copy and translating it is his call. */
    study: {
      cover: variableGenerator,
      sections: [
        {
          title:
            "Il faut lancer la UI du projet ****** avant midi mais on a pas encore commencé l'UI Kit et les variables !",
          paragraphs: [
            "Comme souvent en design, c'est le problème qui a permis de créer. Face à une deadline serrée j'ai dû revoir ma manière de travailler et chercher un moyen d'accélérer ma méthode. Je devais préparer un fichier pour le passage d'une DA, en créant toutes les variables de couleurs, de sizing, de fonts. D'habitude j'aurais appliqué les meilleures pratiques que je connais et les auraient appliquées manuellement pour créer chaque variable. Mais pas cette fois.",
          ],
        },
        {
          title: 'Un plugin pour les générer toutes…',
          paragraphs: [
            "En fait, au départ c'était 3 petits plugins fais maison supposés s'auto détruire après l'usage car spécifiques au projet. Mais en voyant la vitesse à laquelle Claude Code me permettait de faire des outils sur mesures; je me suis dis qu'il fallait creuser cette idée. J'ai réunis ces fonctionnalités primaires dans un prompt initial accompagné d'un brouillon parmi les plus élaborés n'ayant jamais existé :",
          ],
          figure: { cover: null, caption: 'Le brouillon initial' },
        },
        {
          title: 'Les premiers pas du plugin sur Figma',
          paragraphs: [
            "Ce plugin permet de mettre en place les variables de base d'un fichier Figma en quelques minutes (en prenant son temps) ce qui représente par rapport au temps de production manuel une réduction du temps d'environ 95%. Oui c'est chouette !",
            "J'ai poursuivi en ajoutant diverses fonctionnalités comme la génération de tokens sémantiques basiques, la gestion du multi-marque, l'option dark-mode, l'intégration des google font et font locales…",
            'Aujourd\'hui tout est réuni dans le plugin “Variable Generator - Agence Mantu” accessible par tous. La question de passer par le MCP directement dans Figma plutôt que par un plugin pour générer les variables est un sujet intéressant que j\'espère avoir le plaisir d\'évoquer avec vous.',
          ],
          figure: { cover: null, caption: 'Le plugin dans Figma' },
        },
      ],
    },
    title:
      'How I helped my colleagues to accelerate their Figma project setup with a Figma Plugin',
    subtitle: 'Internal tool',
    cover: variableGenerator,
    link: null,
    label: 'Variable Generator',
    mat: 'generator',
    x: 1,
    y: 1,
  },
  {
    id: 'project-02',
    study: placeholderStudy(emeis),
    title: 'Placeholder copy. The cover is the real one, the sentence is not yet.',
    subtitle: 'Client name',
    cover: emeis,
    link: null,
    label: 'emeis',
    mat: 'emeis',
    x: 47,
    y: 0,
  },
  {
    id: 'project-03',
    study: placeholderStudy(ceva),
    title: 'Placeholder copy. The cover is the real one, the sentence is not yet.',
    subtitle: 'Client name',
    cover: ceva,
    link: null,
    label: 'CEVA',
    mat: 'ceva',
    x: 3,
    y: 31,
  },
  {
    id: 'indes-pilot',
    study: placeholderStudy(indesPilot),
    title: 'Placeholder copy. The cover is the real one, the sentence is not yet.',
    subtitle: 'Client name',
    cover: indesPilot,
    link: null,
    label: 'Indés Pilot',
    mat: 'indes',
    /* Wider than the mat's 16/10, so object-cover crops its width, and the
       default crop centres that cut, which was landing half of it on the time
       slots down the left edge, the one column the shot cannot lose. left-top
       moves the whole cut to the right, into a table column rather than the
       sidebar. */
    crop: 'left-top',
    x: 45,
    y: 32,
  },
  {
    id: 'bowards',
    /* A first draft in English, written from the project's specs: Arthur's to
       rewrite. The figures are slots until the screenshots are cut to 16:10. */
    study: {
      cover: bowards,
      sections: [
        {
          title: 'It started as a test bench and refused to stay one.',
          paragraphs: [
            'Bowards began as the product I needed to put my design system under real pressure: routes, shared state, screens that talk to each other, everything a Storybook story never has to deal with. A test bench needs a subject, so I picked a problem I know by heart. A sitemap gets drawn once, at the start of a project, and nobody checks it against an actual user ever again.',
          ],
        },
        {
          title: 'Let agents walk the map before users do.',
          paragraphs: [
            'So the sitemap became a canvas, and the canvas got visitors. You describe a persona, give it a goal, and an AI agent walks your map through the Bowards MCP server, page by page, the way that person would.',
            'One walk proves nothing, so a run sends ten agents after the same goal. The report shows where they agree, where they hesitate and where they get lost.',
          ],
          figure: { cover: null, caption: 'A persona walking the map' },
        },
        {
          title: 'A designer in the driving seat, Claude Code at the keyboard.',
          paragraphs: [
            'Twenty seven specs, written before a line of code each time, and Claude Code doing the typing on top of my own design system. Nothing ships until I have handled it on screen: a feature once passed every test and still earned nine fixes the day I actually used it.',
            'Bowards is live in beta on bowards.app, with its own showcase site, an MCP server any agent can plug into and an admin back office to keep an eye on the costs.',
          ],
          figure: { cover: null, caption: 'The MCP server, plugged into Claude' },
        },
      ],
    },
    title: 'How I shipped a product where AI agents walk your sitemap',
    subtitle: 'Personal product',
    cover: bowards,
    link: 'https://bowards.app',
    label: 'Bowards',
    mat: 'bowards',
    x: 24,
    y: 16,
  },
]

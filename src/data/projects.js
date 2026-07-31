/**
 * Projects — scattered across the Work section as a loose constellation of
 * cards. Hovering one brings it forward and dims the rest; the copy appears
 * beside it. They float, drift with the scroll and can be dragged.
 *
 * title    : the one-sentence framing of what you did. Reads as a headline.
 * subtitle : one short qualifier (client, context, kind of work).
 * cover    : path under /public or an import. Empty string falls back to the
 *            generated placeholder.
 * link     : case study or live site. null hides the CTA.
 * study    : the case study opened by clicking the card. Absent means the card
 *            is not clickable.
 *
 * Layout — the card sits on a coloured mat, and where it sits is part of the
 * design rather than something the code works out:
 * mat      : a key in Work.jsx's MAT map, one colour token per project.
 * x / y    : centre of the card, as a percentage of the stage.
 * size     : its width, as a percentage of the stage width.
 * rot      : degrees. Uneven on purpose, dropped rather than aligned.
 * drift    : how far it travels vertically across the section's scroll, as a
 *            percentage of the card's own height. A percentage and not pixels
 *            on purpose: it keeps the travel proportional at every stage size,
 *            which is what makes the containment hold on a small laptop as
 *            well as a wide screen. The sign decides whether it leads or lags.
 */

export const projects = [
  {
    id: 'figma-plugin',
    /* The case study, opened by clicking the card. `figure` is a slot: null
       draws the placeholder tile until the real screenshot arrives. Kept in
       French, as written: it is Arthur's copy and translating it is his call. */
    study: {
      cover: null,
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
    cover: '',
    link: null,
    mat: 'pink',
    x: 25,
    y: 31,
    size: 40,
    rot: -7,
    drift: 6,
  },
  {
    id: 'project-02',
    title: 'Placeholder project. Replace with the real one, framed as a sentence.',
    subtitle: 'Client name',
    cover: '',
    link: null,
    mat: 'green',
    x: 74,
    y: 29,
    size: 38,
    rot: 4,
    drift: -6,
  },
  {
    id: 'project-03',
    title: 'Placeholder project. Say what was broken before you touched it.',
    subtitle: 'Client name',
    cover: '',
    link: null,
    mat: 'blue',
    x: 27,
    y: 70,
    size: 39,
    rot: 6,
    drift: -7,
  },
  {
    id: 'project-04',
    title: 'Placeholder project. A clear before and after beats a metric.',
    subtitle: 'Client name',
    cover: '',
    link: null,
    mat: 'sand',
    x: 73,
    y: 69.5,
    size: 41,
    rot: -5,
    drift: 6,
  },
]

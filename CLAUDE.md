# CLAUDE.md — Portfolio Arthur Corcy

Instructions pour toute session Claude Code sur ce dépôt. Lire `design.md` et `context.md` avant toute évolution visuelle ou de contenu.

## Commandes

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # doit passer avant de considérer une tâche terminée
npm run preview
```

Pas de tests unitaires. La vérification = `npm run build` sans erreur + relecture visuelle dans le navigateur. Si tu modifies du motion ou du layout, dis-le explicitement pour que je vérifie à l'écran.

## Stack

React 18, Vite 6, Tailwind CSS **v4** (config en CSS, pas de `tailwind.config.js`), Framer Motion 11. Aucune autre dépendance, et c'est volontaire : ne pas en ajouter sans me demander.

## Règles non négociables

1. **Le contenu ne vit jamais dans les composants.** Tout le texte est dans `src/data/content.js`, les projets dans `src/data/projects.js`. Un composant qui contient une phrase en dur est un bug.
2. **Les tokens de design vivent dans `src/index.css`** sous `@theme`. Pas de couleur, taille de police ou rayon en valeur arbitraire dans un composant si un token existe. Si un nouveau pattern est nécessaire, l'ajouter en token et documenter dans `design.md`.
3. **Un seul easing** : `EASE` exporté par `src/lib/motion.jsx` (`cubic-bezier(0.16, 1, 0.3, 1)`). Ne pas introduire d'autre courbe.
4. **Toute animation respecte `prefers-reduced-motion`** via `useReducedMotion()` de Framer Motion ou la media query déjà présente en fin de `index.css`.
5. **Pas de sur-titres décoratifs** au-dessus des h2, pas de badge « généré par IA ». Les titres portent seuls l'information.
6. **Aucune emphase dans les titres** : pas d'italique, pas de mot coloré, pas de casse spéciale. `Headline` ne fait que le masque de révélation. Pas de `uppercase` nulle part sur le site.
7. **Un seul accent plein** : le lime `#c8ff5e`, à deux endroits seulement (pastille de nav active, bouton email du footer). Le forest `#0a5f10` ne sert qu'aux intitulés de poste du parcours.
8. **Pas de `localStorage`, pas d'analytics, pas de tracking** sans me demander.

## Ton du contenu

Anglais. Expert, amical, légèrement décalé, innovant. Phrases courtes, rythme naturel, vocabulaire actuel sans familiarité. Interdits : jargon corporate (« excellence », « passion », « solution innovante »), métaphores qui demandent un décodage, ton plat et consensuel. Jamais d'emoji. Pas de tiret cadratin.

Test avant validation d'un texte : est-ce que ça sonne comme une conversation entre collègues, avec au moins une touche de décalage, sans un mot qui demande un effort ?

## Architecture

```
src/
  App.jsx                 ordre des sections, rien d'autre
  index.css               @theme (tokens), @utility (type scale), grain, reduced-motion
  lib/motion.jsx          Reveal, Headline, ScrollWords, Parallax, Magnetic, EASE
  data/content.js         tout le texte + la liste de nav
  data/projects.js        le deck projet (format documenté en tête)
  data/testimonials.js    les témoignages + leurs positions de départ
  components/             une section = un fichier
  img/                    placeholder.webp, profil.jpg, peace.svg (importés, pas dans public/)
```

Conventions : composants en PascalCase avec export default, extension `.jsx`, imports relatifs avec l'extension explicite (`./Nav.jsx`). Pas de barrel files.

## Zones sensibles

- `components/Nav.jsx` — le scrollspy dépend des `id` des sections, qui viennent de `nav` dans `content.js`. Ajouter une entrée de nav = ajouter l'`id` correspondant sur une section.
- `components/Work.jsx` — le deck : `order` est la source de vérité, `SLOTS` décrit la position de chaque profondeur. Le panneau de texte est keyé sur le projet du dessus, **sans `AnimatePresence`** : attendre une animation de sortie rendait les clics répétés sur les flèches poussifs.
- `components/Testimonials.jsx` — le drag est contraint par `dragConstraints` sur le conteneur, c'est ce qui garantit qu'une carte ne peut pas être perdue hors écran. Le flottement est sur un wrapper **interne** pour ne pas entrer en conflit avec les `x`/`y` écrits par le drag.
- `lib/motion.jsx` `ScrollWords` — un `useTransform` par mot, dans un sous-composant `Word`. Ne pas déplacer ces hooks dans une boucle du parent.
- `components/Cursor.jsx` — désactivé sur pointeur grossier et en reduced-motion. Les éléments interactifs déclarent `data-cursor="link|hover"` et optionnellement `data-cursor-label`.
- Rotations : passer par Framer (`initial`/`animate`) ou un `style` inline. `rotate-[var(--x)]` en Tailwind v4 ne produit rien.

## À faire (état au 29/07/2026)

- Remplacer les 3 projets placeholder dans `src/data/projects.js` et fournir les couvertures (le vrai projet Figma Plugin n'a pas encore de visuel).
- Remplacer les 2 témoignages placeholder dans `src/data/testimonials.js` par les vraies citations.
- Remplir « One more thing » ou supprimer la section.
- Relire `story.paragraphs` dans `content.js` : le texte est repris tel quel de la maquette et contient des coquilles (« in digital world », « I wana »).
- Faire vérifier les intitulés de poste, périodes et diplômes dans `content.js` (reconstitués, non sourcés).
- Le placeholder du hero est l'image Bliss de Windows XP : à remplacer avant toute mise en ligne publique.

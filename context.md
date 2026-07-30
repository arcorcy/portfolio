# Contexte projet — Portfolio Arthur Corcy (AI Product Designer)

À lire en premier pour reprendre le projet dans une nouvelle conversation.

## Qui, quoi

Arthur Corcy, AI Product Designer, Product Designer chez **ARNEO_** depuis sept. 2024. Le portfolio met en avant sa **manière de travailler** avec l'IA (cadrage, exploration, prototypage, production) autant que les projets.

## État au 29/07/2026

Refonte complète : on est passé du fichier `index.html` autoportant à un **projet React** (Vite + Tailwind v4 + Framer Motion). Voir `README.md` pour lancer et `design.md` pour le système visuel.

Décisions prises à cette étape :

- **Langue : anglais** pour tout le contenu du site (les références sont anglophones, ouverture internationale). Le tone of voice reste celui défini : expert, amical, légèrement décalé, innovant.
- **Motion débridé** : la règle « fade uniquement, jamais de translation » est levée. Scroll pinné, parallaxe, marquee, curseur custom, transitions au mot. Tout est conditionné à `prefers-reduced-motion`.
- **Fond blanc chaud** `#f7f6f1` au lieu du blanc pur, cards en blanc pur par-dessus.
- **Format** : site statique, pas de deck ni PDF.

## Refonte sur maquette Paper (29/07/2026, seconde passe)

Le site a été réaligné sur la maquette Paper `01KYPYBNWWXD6E9WPNJHHNX7VM` : contenus, ordre des blocs, aspect général et interactions viennent de là. La structure des composants, elle, est libre.

Ce qui a disparu à cette étape : le marquee de mots-clés, la section Principles (ses phrases ont été recyclées en témoignages), les polaroïds et le bloc citation de Story, le scroll pinné de Process, le grand titre du footer, et **toute forme d'emphase dans les titres** (plus d'italique ni de mot coloré, plus aucun `uppercase` sur le site).

## Structure des sections

1. `#top` Hero — nom + glyphe peace, accroche, un CTA, bloc visuel carré pivoté (6°) qui déborde sur la section suivante, parallaxe souris + scroll.
2. `#work` Works — « Things I have shipped ». Deck de cartes : flèches prev/next et jet de la carte du dessus. Le panneau de droite suit la carte de devant.
3. `#process` How I work — section sombre, 4 paragraphes alternés gauche/droite, révélation mot par mot pilotée par le scroll.
4. Testimonials — « What my clients and colleagues say ». 4 cartes en désordre, déplaçables, flottantes, contraintes au conteneur pour ne jamais sortir de l'écran.
5. `#experience` Experiences — « Where I have worked » + « And where I learned », cards à filet.
6. `#story` Other stuffs — « I got here the long way » + 2 cartes de faits posées de biais.
7. One more thing — emplacement réservé, en attente de contenu.
8. `#contact` Footer — accroche, email en pastille lime + copie presse-papier + LinkedIn, nom en très grand et très pâle, ligne légale.

## À faire / en attente

- **Vrais projets** → `src/data/projects.js` : le projet Figma Plugin est réel mais sans visuel, les 3 autres sont des placeholders.
- **Témoignages** → `src/data/testimonials.js` : Suzuki et CEVA Logistic sont réels, 2 cartes restent des placeholders explicites.
- **One more thing** : à remplir ou à supprimer.
- **Placeholder du hero** : c'est l'image Bliss de Windows XP, à remplacer avant toute mise en ligne publique.
- **Coquilles à relire** dans `story.paragraphs` (`content.js`), reprises telles quelles de la maquette : « in digital world », « I wana ».
- **À vérifier par Arthur** : les intitulés de poste et périodes dans `src/data/content.js` (`experience`, `education`) ont été reconstitués depuis le contexte, pas depuis l'export LinkedIn. Les diplômes exacts LISAA / École Estienne / Lycée Saint Joseph LaSalle sont à confirmer.

## Règles à respecter pour la suite

- Tout le contenu passe par `src/data/content.js` et `src/data/projects.js`, jamais en dur dans les composants.
- Pas de sur-titres décoratifs au-dessus des h2, pas de badge « généré par IA ».
- Un seul mot d'emphase par titre, via la syntaxe `{mot}`.
- Un seul accent plein : le lime, avec parcimonie.
- Toute nouvelle animation utilise l'easing `EASE` de `lib/motion.jsx` et respecte `prefers-reduced-motion`.
- Mettre `design.md` à jour dès qu'un nouveau pattern visuel est introduit.

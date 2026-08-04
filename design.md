# Design system — Portfolio Arthur Corcy (React 2026)

Les tokens vivent dans `src/index.css` sous `@theme` (Tailwind v4) : c'est la source de vérité, ce document explique les intentions. La référence visuelle est la maquette Paper `01KYPYBNWWXD6E9WPNJHHNX7VM` (artboard 1482px), reprise le 29/07/2026.

## Ordre des sections

1. **Hero** (`#top`) — nom + glyphe peace, accroche, un seul CTA, bloc visuel carré pivoté qui déborde sur la section suivante.
2. **Works** (`#work`) — « Things I have shipped ». Constellation de cartes en vrac : le survol met une carte en avant, éteint les autres à 10 % et affiche son texte à côté.
3. **How I work** (`#process`) — section sombre, 4 paragraphes alternés gauche/droite.
4. **Testimonials** — « What my clients and colleagues say ». Deck de cartes citation + panneau d'attribution, flèches et jet à la souris.
5. **Experiences** (`#experience`) — « Where I have worked » + « And where I learned ».
6. **Other stuffs** (`#story`) — « I got here the long way » + cartes de faits.
7. **One more thing** — emplacement réservé, en attente de contenu.
8. **Contact** (`#contact`) — footer sombre, **un écran plein**, centré : le titre en deux phrases, le bouton email et LinkedIn, rien d'autre. Le bouton email **copie l'adresse** et ne l'ouvre pas dans un client mail. La ligne légale est dans cet écran et non après, donc le footer fait exactement une hauteur d'écran.

La nav ne référence que 5 de ces sections : le hero, les témoignages et « One more thing » n'ont pas d'entrée.

## Navigation

Deux formes du même objet. Au-dessus de 768px, la barre complète : photo, cinq sections, pastille lime sur la section active. En dessous, deux pastilles côte à côte, photo + section courante + chevron d'un côté, Contact de l'autre, même style de pastille. Le seuil vient d'une mesure : la barre complète a besoin de 596px avec les libellés actuels.

## Gouttière

Une seule variable, `--gutter` dans `index.css`, appliquée par l'utilitaire `gutter` sur chaque section. Ne pas remettre de trio `px-5 sm:px-8 lg:px-12` dans un composant.

| Largeur d'écran | Gouttière |
| --- | --- |
| < 640px | 20px |
| 640 à 1023px | 40px |
| 1024 à 1279px | 80px |
| ≥ 1280px | **128px** |

Valeur fixe et non un pourcentage : les sections plafonnent déjà leur contenu à 1400px, donc au-delà de ~1660px de large c'est ce plafond qui fait la marge et un pourcentage ne ferait que grossir sans rien apporter. Mesuré à 1920px, la marge effective est de 260px alors que la gouttière vaut 128 : elle est un plancher, pas la marge finale. Le palier à 80px entre 1024 et 1280 existe parce qu'un saut direct de 40 à 128 y étranglait les mises en page à deux colonnes.

## Couleurs

```
--color-ink:     #010102   /* texte principal, sections sombres, nav */
--color-paper:   #f7f6f1   /* fond du site, blanc chaud */
--color-white:   #ffffff   /* fond des cards */
--color-mute:    #666666   /* texte secondaire */
--color-line:    #e7e7e7   /* filet des cards parcours */
--color-forest:  #0a5f10   /* intitulé de poste dans le parcours */
--color-lime:    #c8ff5e   /* accent plein : nav active, CTA email, mots-clés de How I work */
--color-fog:     #8c8c8c   /* fond du bloc visuel du hero */
--color-dim:     #d9d9e5   /* paragraphes de la section sombre */
```

Règle d'usage : **un seul accent plein**, le lime, et seulement à trois endroits (pastille de nav active, bouton email du footer, un mot-clé par paragraphe de How I work). Le forest ne sert qu'aux intitulés de poste. Tout le reste est ink / mute / white.

Le halo du footer n'est pas un cinquième endroit : c'est de la lumière et pas un aplat, il culmine à 13 % et s'est dissous bien avant d'atteindre un bord, donc il ne forme jamais de forme. Il est posé derrière le bouton email, ce qui le fait lire comme ce bouton allumé plutôt que comme une couleur de plus.

## Typographie

Manrope seule. Le display est en **poids 600**, pas 800 : la maquette lit serré et calme plutôt que lourd.

| Utilitaire | Taille | Poids | Usage |
|---|---|---|---|
| `display-xl` | `clamp(3rem, 6.9vw, 6.25rem)` | 600 | nom du hero |
| `display-lg` | `clamp(2.2rem, 4.65vw, 4.2rem)` | 600 | titres de section |
| `display-md` | `clamp(1.7rem, 2.9vw, 2.6rem)` | 600 | sous-sections (parcours) |
| `display-sm` | `clamp(1.35rem, 2.5vw, 2.25rem)` | 700 | paragraphes de la section sombre, titre de projet au survol, nom du client |

Texte courant : 1rem / `leading-[1.63]` / `text-mute`. Micro-labels : 11 à 14px, poids 700 à 800, casse normale.

**Aucune emphase, nulle part** (décision du 29/07) : pas d'italique, pas de mot coloré, pas de sur-titre. Les titres portent seuls l'information. Le composant `Headline` ne fait plus que le masque de révélation mot par mot.

## Alignement des titres

Centrés : Works, How I work, Testimonials. Alignés à gauche : Experiences, Other stuffs, One more thing. C'est la maquette, pas un accident.

## Panels, cards, rayons

- `rounded-panel` (28px) : bloc visuel du hero.
- `rounded-shot` (24px) : cartes du deck témoignage, passe-partout des cartes projet.
- `rounded-card` (20px) : cards parcours, cards de faits, bloc « One more thing ».
- `rounded-full` : nav, CTA, flèches du slider.

Cards blanches : `border border-line` (parcours, One more thing). Les cartes posées en désordre et le deck portent une ombre portée douce plutôt qu'un filet, renforcée sur la carte survolée.

Quatre passe-partout de projet, un par projet, uniquement derrière une couverture dans Works : `--color-mat-pink` `#f3cbf2`, `--color-mat-orange` `#ff9338`, `--color-mat-blue` `#a8dcf2`, `--color-mat-sand` `#d9dbd0`. Ce ne sont pas des accents et ils ne concurrencent pas le lime.

`--color-paper-deep` `#d9d7cc` : le papier descendu jusqu'à se lire comme éteint. Un seul usage, les deux boutons de la fenêtre Experience qui refusent d'agir. Ils sont posés sur du papier, donc la même couleur en plus foncé dit désactivé là où un gris neutre aurait dit autre matière.

## Motion

Easing unique : `cubic-bezier(0.16, 1, 0.3, 1)`, exporté comme `EASE`.

| Pattern | Où | Détail |
|---|---|---|
| Reveal | blocs de contenu | opacity + Y 26px + blur 8px, `once: true`, 0.9s |
| Headline mask | tous les titres sauf Contact | mot par mot, masque `overflow-hidden`, stagger 55ms |
| ScrollWords | How I work + titre de Contact | opacité 0.16 → 1 mot par mot, pilotée par la position de scroll (réversible au scroll inverse). Le titre de Contact est en deux lignes déclarées, l'indice des mots courant d'une ligne à l'autre pour que la lumière balaie dans l'ordre de lecture |
| Quadrillage | Works + How I work | 15 colonnes en desktop, plancher de cellule à 48px en dessous. Apparaît en fondu à l'arrivée de Works, disparaît avant la fin de How I work |
| Constellation | Works | survol : la carte monte à 1,04 et les autres tombent à 10 %. Le texte apparaît collé à la carte, du côté où il y a de la place, et la suit au drag. Dérive au scroll, flottement en boucle, drag contraint au plateau |
| Deck témoignage | Testimonials | flèches + jet de la carte du dessus au-delà de 110px, ressort vers le slot |
| Fenêtres Experience | Experiences | survol : la fenêtre grossit légèrement (scale 1.02). Drag libre contraint au champ, inertie freinée pour ne pas glisser loin au lâcher |
| Séquence épinglée | How I work | 4 étapes, une par écran de scroll. Le texte suit le scroll mot à mot puis part en fondu, la composition d'icônes se réarrange au ressort |
| Parallaxe | bloc visuel du hero | suit le curseur (±40/28px) et dérive au scroll |
| Magnetic | CTA | l'élément se penche vers le curseur |
| Curseur custom | desktop uniquement | `mix-blend-difference`, grossit sur `[data-cursor]` |
| Halo Contact | Contact | dégradé radial lime derrière le titre, pic à 13 %, respiration de 11 s. Découpé par sa propre boîte et non par un ancêtre du titre |
| Grain | global | overlay SVG animé, opacité 0.038 |

Au-dessus de 1024px, sur pointeur fin et hors reduced-motion, le curseur natif est masqué et le curseur dessiné le remplace. En dessous d'une seule de ces conditions il revient, parce que le curseur dessiné ne s'affiche pas.

Toutes les animations tombent à zéro sous `prefers-reduced-motion: reduce` : les decks et la constellation perdent le drag et se placent en dur, et How I work abandonne l'épinglage pour une suite de paragraphes.

## Dégradation mobile

- Deck témoignage : le geste reste (drag horizontal), les flèches restent.
- Works et How I work : sous 1024px, la constellation devient une bande horizontale à défilement par accroche (swipe ou flèches) avec le texte dessous, et la séquence épinglée une suite de paragraphes. Ni le survol ni la composition d'icônes n'ont de sens sur un téléphone.
- Experiences : sous 1024px, les trois fenêtres déplaçables cèdent la place à **sept petites fenêtres, une par expérience**, chacune imitant une app macOS différente : Notes pour les deux écoles, terminal pour le freelance, Safari, Mail, Reminders et Contacts pour les quatre postes. L'app est choisie pour ce que l'expérience contient et non pour varier : celle qui a un vrai témoignage est un fil de mail, celle qui n'est qu'un jeu de champs est une fiche de contact. Aucune n'est interactive, plus de barre d'onglets ni de flèches, et les trois pastilles de fenêtre sont toutes en `paper-deep`, la lime n'y ferait rien.
- Témoignages : le désordre et le drag disparaissent, on retombe sur une grille lisible de cards.
- Bloc visuel du hero : passe dans le flux, sous le CTA, sans parallaxe.
- Cards de faits (Other stuffs) : dans le flux, côte à côte.

## Écarts assumés par rapport à la maquette

- Le footer de la maquette empile une accroche, trois boutons, le nom en très grand et très pâle, puis une ligne légale sur trois colonnes. Il ne garde que l'accroche promue en titre, le bouton email et LinkedIn : c'est la dernière chose lue, elle doit demander une seule action et pas trois. Le nom géant, le bouton « Copy address » et la mention rôle · ville sont supprimés.
- Le bloc « One more thing » est carré et sans filet dans Paper : on lui met `rounded-card` + `border-line` pour qu'il lise comme un emplacement réservé et non comme un bug de rendu.
- « And where I learned » est en poids 500 dans Paper contre 600 pour « Where I have worked » : les deux sont alignés sur 600, l'écart ressemblait à une coquille.
- L'emphase vert-gris `#6F786E` sur « have shipped » est supprimée, comme toutes les emphases.

## Références de style

- La maquette Paper est la référence principale.
- danielsun.space — capsule de nav flottante avec item actif en pastille.

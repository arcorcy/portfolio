# Design system — Portfolio Arthur Corcy (React 2026)

Les tokens vivent dans `src/index.css` sous `@theme` (Tailwind v4) : c'est la source de vérité, ce document explique les intentions. La référence visuelle est la maquette Paper `01KYPYBNWWXD6E9WPNJHHNX7VM` (artboard 1482px), reprise le 29/07/2026.

## Ordre des sections

1. **Hero** (`#top`) — nom + glyphe peace, accroche, un seul CTA, bloc visuel carré pivoté qui déborde sur la section suivante.
2. **Works** (`#work`) — « Things I have shipped ». Deck de cartes + panneau de texte.
3. **How I work** (`#process`) — section sombre, 4 paragraphes alternés gauche/droite.
4. **Testimonials** — « What my clients and colleagues say ». Cartes en désordre, déplaçables.
5. **Experiences** (`#experience`) — « Where I have worked » + « And where I learned ».
6. **Other stuffs** (`#story`) — « I got here the long way » + cartes de faits.
7. **One more thing** — emplacement réservé, en attente de contenu.
8. **Contact** (`#contact`) — footer sombre.

La nav ne référence que 5 de ces sections : le hero, les témoignages et « One more thing » n'ont pas d'entrée.

## Couleurs

```
--color-ink:     #010102   /* texte principal, sections sombres, nav */
--color-paper:   #f7f6f1   /* fond du site, blanc chaud */
--color-white:   #ffffff   /* fond des cards */
--color-mute:    #666666   /* texte secondaire */
--color-line:    #e7e7e7   /* filet des cards parcours */
--color-forest:  #0a5f10   /* intitulé de poste dans le parcours */
--color-lime:    #c8ff5e   /* accent plein : nav active, CTA email */
--color-fog:     #8c8c8c   /* fond du bloc visuel du hero */
--color-dim:     #d9d9e5   /* paragraphes de la section sombre */
```

Règle d'usage : **un seul accent plein**, le lime, et seulement à deux endroits (pastille de nav active, bouton email du footer). Le forest ne sert qu'aux intitulés de poste. Tout le reste est ink / mute / white.

## Typographie

Manrope seule. Le display est en **poids 600**, pas 800 : la maquette lit serré et calme plutôt que lourd.

| Utilitaire | Taille | Poids | Usage |
|---|---|---|---|
| `display-xl` | `clamp(3rem, 6.9vw, 6.25rem)` | 600 | nom du hero |
| `display-lg` | `clamp(2.2rem, 4.65vw, 4.2rem)` | 600 | titres de section |
| `display-md` | `clamp(1.7rem, 2.9vw, 2.6rem)` | 600 | sous-sections (parcours) |
| `display-sm` | `clamp(1.35rem, 2.5vw, 2.25rem)` | 700 | paragraphes de la section sombre, titre de projet |

Texte courant : 1rem / `leading-[1.63]` / `text-mute`. Micro-labels : 11 à 14px, poids 700 à 800, casse normale.

**Aucune emphase, nulle part** (décision du 29/07) : pas d'italique, pas de mot coloré, pas de sur-titre. Les titres portent seuls l'information. Le composant `Headline` ne fait plus que le masque de révélation mot par mot.

## Alignement des titres

Centrés : Works, How I work, Testimonials. Alignés à gauche : Experiences, Other stuffs, One more thing. C'est la maquette, pas un accident.

## Panels, cards, rayons

- `rounded-panel` (28px) : bloc visuel du hero.
- `rounded-shot` (24px) : cartes du deck projet.
- `rounded-card` (20px) : témoignages, cards parcours, cards de faits, bloc « One more thing ».
- `rounded-full` : nav, CTA, flèches du slider.

Cards blanches : soit `ring-1 ring-ink/[0.07]` (témoignages), soit `border border-line` (parcours, One more thing). Les cartes posées en désordre portent une ombre portée douce plutôt qu'un filet.

## Motion

Easing unique : `cubic-bezier(0.16, 1, 0.3, 1)`, exporté comme `EASE`.

| Pattern | Où | Détail |
|---|---|---|
| Reveal | blocs de contenu | opacity + Y 26px + blur 8px, `once: true`, 0.9s |
| Headline mask | tous les titres | mot par mot, masque `overflow-hidden`, stagger 55ms |
| ScrollWords | section sombre | opacité 0.16 → 1 mot par mot, pilotée par la position de scroll (réversible au scroll inverse) |
| Deck projet | Works | flèches + jet de la carte du dessus au-delà de 110px, ressort vers le slot |
| Cartes flottantes | Testimonials | dérive lente en boucle, drag contraint au conteneur (`dragConstraints`) |
| Parallaxe | bloc visuel du hero | suit le curseur (±40/28px) et dérive au scroll |
| Magnetic | CTA | l'élément se penche vers le curseur |
| Curseur custom | desktop uniquement | `mix-blend-difference`, grossit sur `[data-cursor]` |
| Grain | global | overlay SVG animé, opacité 0.038 |

Toutes les animations tombent à zéro sous `prefers-reduced-motion: reduce` : le deck et les témoignages perdent le drag et se placent en dur.

## Dégradation mobile

- Deck projet : le geste reste (drag horizontal), les flèches restent.
- Témoignages : le désordre et le drag disparaissent, on retombe sur une grille lisible de cards.
- Bloc visuel du hero : passe dans le flux, sous le CTA, sans parallaxe.
- Cards de faits (Other stuffs) : dans le flux, côte à côte.

## Écarts assumés par rapport à la maquette

- Le bloc « One more thing » est carré et sans filet dans Paper : on lui met `rounded-card` + `border-line` pour qu'il lise comme un emplacement réservé et non comme un bug de rendu.
- « And where I learned » est en poids 500 dans Paper contre 600 pour « Where I have worked » : les deux sont alignés sur 600, l'écart ressemblait à une coquille.
- L'emphase vert-gris `#6F786E` sur « have shipped » est supprimée, comme toutes les emphases.

## Références de style

- La maquette Paper est la référence principale.
- danielsun.space — capsule de nav flottante avec item actif en pastille.

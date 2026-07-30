# Portfolio — Arthur Corcy, AI Product Designer

React + Vite + Tailwind v4 + Framer Motion. One page, heavy on motion, built so the content lives in data files and never in the components.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the build locally
```

Deploy: any static host. Netlify / Vercel → build command `npm run build`, publish directory `dist`.

## Where the content lives

| File | What's in it |
|---|---|
| `src/data/content.js` | All copy: hero, process steps, principles, story, experience, education, contact. |
| `src/data/projects.js` | The four project cards. Fields are documented at the top of the file. |

Nothing else needs editing to change the text. Headlines accept a `{word}` syntax: the braced word renders in italic + accent colour.

## Adding a real project

1. Drop the cover image in `public/covers/`.
2. In `src/data/projects.js`, set `cover: '/covers/your-file.webp'`.
3. Fill `title`, `client`, `year`, `role`, `summary`, `tags`, and `aiAngle` (set `aiAngle: null` to hide that line).
4. `featured: true` makes the card span the full grid width with a wider cover.

Cards with an empty `cover` fall back to a generated placeholder, so the grid never looks broken.

Portrait: drop a file at `public/portrait.jpg` and swap the placeholder block in `src/components/Hero.jsx` (it's commented).

## Structure

```
src/
  App.jsx                 section order
  index.css               design tokens (@theme) + keyframes + utilities
  lib/motion.jsx          Reveal, Headline, Parallax, Magnetic
  components/
    Cursor.jsx            custom cursor, reacts to data-cursor attributes
    Nav.jsx               floating pill + scrollspy + scroll progress bar
    Hero.jsx              display type, animated lime glyph, mouse parallax
    Marquee.jsx           keyword rail, pauses on hover
    Work.jsx              project grid
    Process.jsx           pinned 4-step scroll (desktop) / stacked (mobile)
    Principles.jsx        six opinion cards with lime wipe on hover
    Story.jsx             bio + parallax polaroids
    Career.jsx            experience & education
    Contact.jsx           footer, copy-to-clipboard email, name rail
```

## Motion conventions

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`, exported as `EASE` from `lib/motion.jsx`.
- Entrances: opacity + small Y lift + blur, `once: true`.
- Every animation respects `prefers-reduced-motion`; the custom cursor disables itself on touch devices.
- Add `data-cursor="link"` or `data-cursor="hover"` to make the cursor react. `data-cursor-label="View"` puts a word inside it.

## Interactive elements to know about

- Process step markers are buttons: clicking one scrolls to that step in the pinned track.
- Marquee pauses on hover.
- Email button copies to clipboard, falls back to `mailto:` if the clipboard API is blocked.

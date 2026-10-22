import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { EASE } from '../lib/motion.jsx'
import { onMat } from '../lib/contrast.js'
import Placeholder from './Placeholder.jsx'

/* The surface fades in over the case's inside, then the copy arrives. */
const FADE_IN = { duration: 0.35, ease: EASE }
const COPY_IN = { duration: 0.5, delay: 0.2, ease: EASE }

/* Closing does not retrace the way in: a circular mask closes on the middle of
   the screen until nothing is left. The surface itself never moves.

   An iris rather than a shrinking box, because a box cannot stay round on the
   way down: a full corner radius on a viewport-sized box is an ellipse, and
   keeping it circular while it shrinks would need the two axes to scale by
   different amounts at every instant, which they cannot do while also starting
   from full size. clip-path takes a single radius, so the shape is a true circle
   throughout and disappears by reaching zero rather than by fading. */
const SHUT = 0.32

/* Percentages on circle() resolve against sqrt((w² + h²) / 2), so 150% clears
   the corners of any viewport with room to spare. */
const IRIS_OPEN = '150%'
const IRIS_SHUT = '0%'

function Figure({ cover, caption, seed }) {
  return (
    <figure className="mt-10">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-shot">
        {cover ? (
          <img src={cover} alt={caption ?? ''} className="h-full w-full object-cover" />
        ) : (
          <Placeholder seed={seed} className="h-full w-full" />
        )}
      </div>
      {caption && <figcaption className="mt-3 text-sm text-mute">{caption}</figcaption>}
    </figure>
  )
}

/* The surface is the project's own mat, the colour of the inside of the DVD case
   the camera has just flown into, so the case reads as opening onto the study
   rather than being replaced by it.
   An inline var rather than a class: the mat key comes from the data, and a class
   built from it would be a template string Tailwind never sees. */
function surface(mat) {
  return mat ? `var(--color-mat-${mat})` : 'var(--color-paper)'
}

// Ink or white on the mat, whichever contrasts more (see lib/contrast.js).
function textOn(mat) {
  return `var(--color-${onMat(mat)})`
}

export default function Study({ project, onClose }) {
  const closer = useRef(null)
  const titleId = `study-${project.id}`

  /* Focus and Escape belong to the dialog, so they live and die with it. The
     scroll lock and the inert do not: those are held by Work, keyed on whether
     a study is meant to be open. Kept here, they would only be released once
     the exit animation finished, and an exit that never finished would leave
     the page frozen and unreachable. */
  useEffect(() => {
    const returnTo = document.activeElement
    closer.current?.focus()

    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      if (returnTo instanceof HTMLElement) returnTo.focus()
    }
  }, [onClose])

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
            /* overscroll-contain, or reaching the top of this panel hands the scroll
         on to the document, which rubber-bands and drags every fixed layer with
         it: the page shows through above the study. */
      className="fixed inset-0 z-[100] origin-top-left overflow-y-auto overscroll-contain"
      style={{
        clipPath: `circle(var(--iris) at 50% 50%)`,
        backgroundColor: surface(project.mat),
        color: textOn(project.mat),
      }}
      /* A fade in, not a grow: by the time it mounts, the DVD case has already
         flown into the camera and its inside fills the screen in the mat's colour,
         which is this surface's colour too, so the fade only brings the copy. */
      initial={{ opacity: 0, '--iris': IRIS_OPEN }}
      animate={{ opacity: 1, '--iris': IRIS_OPEN }}
      // Leaving, it goes because the mask reaches zero, not because it dims.
      exit={{ '--iris': IRIS_SHUT, transition: { duration: SHUT, ease: EASE } }}
      transition={FADE_IN}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.11 } }}
        transition={COPY_IN}
      >
        {/* The cover keeps the title company rather than opening the body: it
            fills the empty half of the coloured panel, and the body then starts
            on the writing. Its own proportions, no crop, since nothing here has
            to line up with anything.

            It runs off the bottom of the panel rather than sitting inside it, so
            it reads as sliding under the body instead of being parked in a
            corner. That is what the overflow-hidden here is for; the cut then
            falls exactly on the seam between the two surfaces.

            A grid rather than an absolute image, so a longer title can never run
            underneath it: the two columns cannot overlap whatever the copy does.

            Gone below lg rather than stacked. It says nothing the title does not,
            so on a phone it would only be a screen to scroll past before the
            first sentence. Decorative to the letter, hence aria-hidden. */}
        <div className="gutter grid min-h-[46svh] items-end gap-10 overflow-hidden pb-14 pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
          <div>
            {/* An opacity rather than text-ink/60, so it follows whichever of ink
                or white the mat picked. */}
            <p className="text-sm font-bold opacity-60">{project.subtitle}</p>
            <h1 id={titleId} className="display-md mt-4 max-w-[46rem]">
              {project.title}
            </h1>
          </div>

          {project.study.cover && (
            <img
              src={project.study.cover}
              alt=""
              aria-hidden="true"
              /* -14rem against a 36rem column: 3.5rem of it cancels the panel's
                 own bottom padding and the rest carries a third of the image past
                 the seam. Half the shot radius, written as half of it rather than
                 as 12px, so the two stay in step if the token moves: the full
                 radius is cut for a card the size of a thumbnail, and on an image
                 this wide the same corner reads as a bevel. */
              className="hidden w-full -rotate-3 rounded-[calc(var(--radius-shot)/2)] shadow-[0_28px_60px_-28px_rgba(1,1,2,0.3)] lg:-mb-[14rem] lg:block"
            />
          )}
        </div>

        {/* The body lifts off the coloured surface, the way the cover sat on the
            card's mat. */}
        <div className="min-h-svh rounded-t-[2rem] bg-paper pb-32 pt-16 text-ink">
          <div className="gutter">
            <div className="mx-auto max-w-[42rem]">
              {project.study.sections.map((section, i) => (
                <section key={i} className={i ? 'mt-20' : ''}>
                  {/* No cap of its own: the column is the measure. A 34rem cap
                      here broke the titles at 81% of the width the paragraphs
                      under them use, which reads as a title stuck rather than as
                      a shorter measure. */}
                  <h2 className="display-sm">{section.title}</h2>

                  {section.paragraphs.map((text, j) => (
                    <p
                      key={j}
                      className="mt-6 text-[1.0625rem] leading-[1.65] text-ink/80"
                    >
                      {text}
                    </p>
                  ))}

                  {section.figure && (
                    <Figure
                      cover={section.figure.cover}
                      caption={section.figure.caption}
                      seed={i + 1}
                    />
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.button
        ref={closer}
        type="button"
        onClick={onClose}
        aria-label="Close the case study"
        data-cursor="link"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        transition={COPY_IN}
        className="fixed right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white transition-colors duration-300 hover:bg-ink/80 sm:right-8 sm:top-8"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </motion.button>
    </motion.div>,
    document.body,
  )
}

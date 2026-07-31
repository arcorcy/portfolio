import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { EASE } from '../lib/motion.jsx'
import Placeholder from './Placeholder.jsx'

/* The surface grows from the card to the whole screen, then the copy arrives.
   A measured flip rather than a shared layout id: the card sits under four
   nested transforms, one of them a rotation, and layout animations read boxes
   that ancestor transforms have already moved. Measuring the card's rect on
   screen sidesteps all of it, since the rect already accounts for them. */
const GROW = { duration: 0.55, ease: EASE }
const COPY_IN = { duration: 0.5, delay: 0.4, ease: EASE }

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

/* Only the flat colour is on screen while the surface grows, so the uneven
   scale it takes on the way has nothing to distort. */
function flip(rect) {
  if (!rect) return { x: 0, y: 0, scaleX: 1, scaleY: 1 }
  return {
    x: rect.left,
    y: rect.top,
    scaleX: rect.width / window.innerWidth,
    scaleY: rect.height / window.innerHeight,
  }
}

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

export default function Study({ project, mat, from, onClose }) {
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
      className={`fixed inset-0 z-[100] origin-top-left overflow-y-auto overscroll-contain ${mat}`}
      style={{ clipPath: `circle(var(--iris) at 50% 50%)` }}
      initial={{ ...flip(from), borderRadius: 24, '--iris': IRIS_OPEN }}
      animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0, '--iris': IRIS_OPEN }}
      // No fade: it goes because the mask reaches zero, not because it dims.
      exit={{ '--iris': IRIS_SHUT, transition: { duration: SHUT, ease: EASE } }}
      transition={GROW}
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

            Gone below lg rather than stacked. It says nothing the title does not,
            so on a phone it would only be a screen to scroll past before the
            first sentence. Decorative to the letter, hence aria-hidden. */}
        <div className="gutter grid min-h-[46svh] items-end gap-10 pb-14 pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div>
            <p className="text-sm font-bold text-ink/60">{project.subtitle}</p>
            <h1 id={titleId} className="display-md mt-4 max-w-[46rem]">
              {project.title}
            </h1>
          </div>

          {project.study.cover && (
            <img
              src={project.study.cover}
              alt=""
              aria-hidden="true"
              /* Half the shot radius, written as half of it rather than as 12px,
                 so the two stay in step if the token moves. The full radius is
                 cut for a card the size of a thumbnail; here the image is the
                 width of a column and the same corner reads as a bevel. */
              className="hidden w-full rounded-[calc(var(--radius-shot)/2)] lg:block"
            />
          )}
        </div>

        {/* The body lifts off the coloured surface, the way the cover sat on the
            card's mat. */}
        <div className="min-h-svh rounded-t-[2rem] bg-paper pb-32 pt-16">
          <div className="gutter">
            <div className="mx-auto max-w-[42rem]">
              {project.study.sections.map((section, i) => (
                <section key={i} className={i ? 'mt-20' : ''}>
                  <h2 className="display-sm max-w-[34rem]">{section.title}</h2>

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

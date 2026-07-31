import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Headline, ScrollWords, EASE } from '../lib/motion.jsx'
import {
  BASE,
  arcPath,
  offset,
  paragraphRanges,
  resolveTracks,
  stepAt,
  stepTiming,
} from '../lib/sequence.js'
import { MeshLocked } from './Mesh.jsx'
import { process } from '../data/content.js'
import artAI from '../img/AI.svg'
import artFIG from '../img/FIG.svg'
import artPLG from '../img/PLG.svg'
import artTST from '../img/TST.svg'
import artHEART from '../img/heart.svg'

const ART = { AI: artAI, FIG: artFIG, PLG: artPLG, TST: artTST, HEART: artHEART }

const { steps } = process
const TRACKS = resolveTracks(steps)

// Scroll length of one step, in percent of the viewport height.
const PER_STEP = 90

const SPRING = { type: 'spring', stiffness: 120, damping: 16, mass: 0.9 }

/* ------------------------------------------------------------------
   Link arcs
   ------------------------------------------------------------------ */
function Links({ step, reduce, draw = false }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      {/* The pinned sequence has its first arcs on screen from the start, so it
          mounts them already drawn. A segment is mounted at the moment it should
          draw, which is the one case where the mount animation is wanted. */}
      <AnimatePresence initial={draw}>
        {step.links.map(([a, b, bow], i) => {
          const d = arcPath(
            step.icons.find((icon) => icon.id === a),
            step.icons.find((icon) => icon.id === b),
            bow,
          )
          if (!d) return null

          return (
            <motion.path
              key={`${step.id}-${i}`}
              d={d}
              fill="none"
              stroke="white"
              strokeWidth={0.9}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      // Drawn after the cards have set off, so the line reads
                      // as a consequence of them arriving.
                      pathLength: { duration: 0.6, delay: 0.3, ease: EASE },
                      opacity: { duration: 0.25, delay: 0.3 },
                    }
              }
            />
          )
        })}
      </AnimatePresence>
    </svg>
  )
}

/* ------------------------------------------------------------------
   Composition
   ------------------------------------------------------------------ */
/* One icon's place in a step, written as the transform that puts it there.

   `arriving` borrows the look of an icon that takes no part in a step, small
   and invisible: it is already the right state to come out of, so a segment's
   first arrangement needs no separate entrance of its own. */
function frameStyle(frame, arriving = false) {
  const shown = frame.visible && !arriving

  return {
    x: offset(frame.x),
    y: offset(frame.y),
    rotate: frame.rot,
    scale: (frame.size / BASE) * (shown ? 1 : 0.55),
    opacity: shown ? 1 : 0,
  }
}

function Icon({ track, active, from, lit, drift, index, reduce }) {
  const target = track.frames[active]
  /* frames[-1] is undefined, which is exactly what the first segment wants: no
     arrangement to come out of, so it arrives instead of rearranging. */
  const start = from == null ? null : (track.frames[from] ?? null)

  return (
    <motion.div
      className="absolute left-0 top-0 aspect-square"
      // No mount animation: whatever the icon is waiting at is a state to be in,
      // not something to animate into.
      initial={false}
      style={{ width: `${BASE}%` }}
      animate={lit ? frameStyle(target) : frameStyle(start ?? target, !start)}
      transition={
        reduce
          ? { duration: 0 }
          : // Only an arrival is staggered. A rearrangement moves as one, the way
            // it does in the pinned sequence.
            { ...SPRING, delay: lit && !start ? index * 0.07 : 0 }
      }
    >
      {/* The idle drift sits on its own layer so it never fights the transform
          the step layout writes above it. */}
      <motion.div
        className="h-full w-full"
        animate={drift ? { y: [0, -7, 0], rotate: [0, 1.4, 0] } : undefined}
        transition={{ duration: 8 + index * 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={ART[track.id]}
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
      </motion.div>
    </motion.div>
  )
}

/* 62svh, not 68: the title shares the pinned screen with the composition, and a
   short laptop has to fit both. A segment shares its screen with a paragraph
   instead, and gets the smaller of the two. */
const PINNED_SIZE = 'min(100%, 34rem, 62svh)'
const SEGMENT_SIZE = 'min(100%, 26rem, 44svh)'

/* A segment plays when it is centred in the view, not when its first pixels
   show. On a share of its own height it set off while the illustration was
   still a strip at the bottom edge and the eye was two lines into the
   paragraph above it.

   Pulling the observer's bottom edge up to the midline and asking for half the
   square says exactly that: half of it inside the top half of the screen puts
   its centre on the middle of the screen. Stated that way the moment is the
   same on every viewport and behind every length of paragraph, which a share
   of the square's height is not.

   It works because the square is at most 44svh, so it always fits in the half
   screen the observer is left with and can reach a ratio of one. Raise that cap
   past 50svh and the trigger stops firing at all. */
const SEGMENT_IN = { once: true, margin: '0px 0px -50% 0px', amount: 0.5 }

/* The pinned composition only uses this to know whether it is the layout on
   duty at this width, so a share of it is exactly the right question. */
const PINNED_IN = { once: true, amount: 0.4 }

/* The composition has two lives.

   In the pinned sequence it is a single composition that rearranges as `active`
   moves through the steps. In the flowed layout there is one per step, each a
   still, and `from` is the arrangement it plays out of when its block reaches
   the screen: a segment therefore shows the same move the pinned version makes
   at that boundary, rather than a frozen picture. */
function Composition({ active, from, segment = false, reduce, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, segment ? SEGMENT_IN : PINNED_IN)
  const lit = !segment || inView

  const entrance =
    reduce || segment
      ? // A segment needs no entrance of its own: its icons do the arriving.
        {}
      : {
          initial: { opacity: 0, scale: 0.92 },
          whileInView: { opacity: 1, scale: 1 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 1, ease: EASE },
        }

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className={`relative aspect-square ${className}`}
      style={{ width: segment ? SEGMENT_SIZE : PINNED_SIZE }}
      {...entrance}
    >
      {lit && <Links step={steps[active]} reduce={reduce} draw={segment} />}
      {TRACKS.map((track, i) => (
        <Icon
          key={track.id}
          track={track}
          active={active}
          from={segment ? from : null}
          lit={lit}
          /* The drift keeps a composition alive through the minutes the pinned
             panel is on screen. A segment is scrolled past, so it would only
             pull against the arrival. Hanging it off `inView` also means the
             layout that is display:none at this width never runs it. */
          drift={!segment && !reduce && inView}
          index={i}
          reduce={reduce}
        />
      ))}
    </motion.div>
  )
}

/* ------------------------------------------------------------------
   Text
   ------------------------------------------------------------------ */
function StepText({ step, index, count, progress }) {
  const timing = stepTiming(index, count, step.paragraphs)
  const opacity = useTransform(progress, timing.fade, timing.opacity)
  const y = useTransform(progress, timing.fade, timing.lift)
  const { ranges } = timing

  return (
    <div className="absolute inset-0 flex items-center">
      <motion.div style={{ opacity, y }} className="flex flex-col gap-6">
        {step.paragraphs.map((text, i) => (
          <ScrollWords
            key={i}
            text={text}
            progress={progress}
            range={ranges[i]}
            className="display-sm text-dim"
          />
        ))}
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Flowed step, below lg.

   The progress belongs to the block, not to each paragraph: two paragraphs of
   the same step sit 24px apart, so on their own positions they would light
   together. The block also claims most of a screen, which is what stops one
   step's reveal running into the next. The window spans from the block's top
   at 82% of the viewport to 38% of it, so 0.44 of a screen of travel against a
   pitch of at least 0.68: a step is always finished before the next begins.
   ------------------------------------------------------------------ */
function FlowStep({ step, index, reduce }) {
  const block = useRef(null)
  /* Anchored on the block's start, and the text sits at the block's start too:
     centring it inside the block put the whole window half a block out of step,
     so the words were already lighting while the text still touched the bottom
     edge, and the empty half of the block sat above it as a hole. */
  const { scrollYProgress } = useScroll({
    target: block,
    offset: ['start 0.7', 'start 0.3'],
  })
  const ranges = paragraphRanges(step.paragraphs)

  // The block's own arrival, matching the fade the pinned version gives a step.
  const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])
  const y = useTransform(scrollYProgress, [0, 0.1], [18, 0])

  return (
    <div
      ref={block}
      className="grid min-h-[52svh] items-start gap-10 py-6 lg:min-h-0 lg:grid-cols-2 lg:items-center lg:py-20"
    >
      {/* The transform is on the inside: moving the block itself would move the
          element the scroll is measured against. */}
      <motion.div
        style={reduce ? undefined : { opacity, y }}
        className="flex flex-col gap-6"
      >
        {step.paragraphs.map((text, j) => (
          <ScrollWords
            key={j}
            text={text}
            progress={scrollYProgress}
            range={ranges[j]}
            className="display-step max-w-[50rem] text-dim"
          />
        ))}
      </motion.div>

      {/* The illustration comes after the words it belongs to, so the section
          reads as a situation described and then shown. It is a grid item, so at
          lg (which only happens under reduced motion) it takes the second
          column instead of stacking under the text. */}
      <Composition
        active={index}
        from={index - 1}
        segment
        reduce={reduce}
        className="mx-auto lg:mx-0 lg:justify-self-end"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function Process() {
  const reduce = useReducedMotion()
  const track = useRef(null)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setActive(stepAt(p, steps.length))
  })

  return (
    <section id="process" className="relative bg-ink text-white">
      <MeshLocked />

      {/* The pinned sequence. One screen of height beyond the steps themselves:
          that is the screen the panel spends in view before it starts pinning.

          The title lives inside the pinned panel rather than above it. Sitting
          above, it scrolled away on its own through a screen of empty black
          before the first step arrived; inside, it turns up with the sequence
          and stays for the whole of it. */}
      <div
        ref={track}
        style={{ height: `calc(100svh + ${steps.length * PER_STEP}svh)` }}
        className={`relative z-10 ${reduce ? 'hidden' : 'hidden lg:block'}`}
      >
        <div className="gutter sticky top-0 flex h-svh flex-col justify-center gap-10 overflow-hidden">
          <Headline
            lines={process.title}
            className="display-lg mx-auto w-full max-w-[1400px] text-center"
          />

          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-2 items-center gap-12">
            <div className="relative min-h-[20rem]">
              {steps.map((step, i) => (
                <StepText
                  key={step.id}
                  step={step}
                  index={i}
                  count={steps.length}
                  progress={scrollYProgress}
                />
              ))}
            </div>

            <Composition active={active} reduce={reduce} className="justify-self-end" />
          </div>
        </div>
      </div>

      {/* Below lg, and whenever motion is turned down, the same steps read as a
          plain sequence: each step's text, then that step's arrangement. The
          composition cannot rearrange under a paragraph the way it does beside
          one, so it is cut into four stills, each played out of the one before
          it as its block arrives. */}
      <div
        className={`gutter relative z-10 mx-auto w-full max-w-[1400px] pb-24 pt-24 sm:pb-32 sm:pt-32 ${
          reduce ? '' : 'lg:hidden'
        }`}
      >
        <Headline lines={process.title} className="display-lg mb-16 text-center" />

        {steps.map((step, i) => (
          <FlowStep key={step.id} step={step} index={i} reduce={reduce} />
        ))}
      </div>
    </section>
  )
}

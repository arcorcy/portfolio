import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
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
function Links({ step, reduce }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <AnimatePresence initial={false}>
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
function Icon({ track, active, index, reduce }) {
  const frame = track.frames[active]

  return (
    <motion.div
      className="absolute left-0 top-0 aspect-square"
      style={{ width: `${BASE}%` }}
      // No mount animation: the first step's arrangement is the starting state,
      // not something to animate into.
      initial={false}
      animate={{
        x: offset(frame.x),
        y: offset(frame.y),
        rotate: frame.rot,
        scale: (frame.size / BASE) * (frame.visible ? 1 : 0.55),
        opacity: frame.visible ? 1 : 0,
      }}
      transition={reduce ? { duration: 0 } : SPRING}
    >
      {/* The idle drift sits on its own layer so it never fights the transform
          the step layout writes above it. */}
      <motion.div
        className="h-full w-full"
        animate={reduce ? undefined : { y: [0, -7, 0], rotate: [0, 1.4, 0] }}
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

function Composition({ active, reduce, className = '' }) {
  const entrance = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: 0.92 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 1, ease: EASE },
      }

  return (
    <motion.div
      aria-hidden="true"
      className={`relative aspect-square ${className}`}
      // 62svh, not 68: the title now shares the pinned screen with it, and a
      // short laptop has to fit both.
      style={{ width: 'min(100%, 34rem, 62svh)' }}
      {...entrance}
    >
      <Links step={steps[active]} reduce={reduce} />
      {TRACKS.map((track, i) => (
        <Icon key={track.id} track={track} active={active} index={i} reduce={reduce} />
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

      {reduce && <Composition active={index} reduce className="hidden justify-self-end lg:block" />}
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
          plain sequence of paragraphs. The composition needs room to move that a
          phone does not have, so it only comes back on a wide screen. */}
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

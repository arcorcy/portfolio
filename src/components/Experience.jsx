import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { Headline, EASE } from '../lib/motion.jsx'
import { experience } from '../data/experience.js'
import Placeholder from './Placeholder.jsx'

const { tabs, refusal } = experience

/* Half the shot radius. A browser frame at this size wants a tighter corner than
   a card does, and it is the same halving the case study cover uses. */
const FRAME_RADIUS = 'rounded-[calc(var(--radius-shot)/2)]'

/* Full screen borrows the case studies' timing exactly, since it is the same
   move: the surface grows first and the content arrives once it has stopped. */
const GROW = { duration: 0.55, ease: EASE }
const COPY_IN = { duration: 0.45, delay: 0.35, ease: EASE }
const SHUT = { duration: 0.12 }

/* The refusal tip is placed from the button's own box rather than guessed at.
   TIP_HEIGHT is not a guess either: it is this tip's own box, one line of text-sm
   at 20px on 2 x 0.5rem of padding. EDGE is what it keeps off the viewport. */
const TIP_HEIGHT = 36
const TIP_GAP = 12
const EDGE = 8

/* ------------------------------------------------------------------
   The window buttons. One of the three works.
   ------------------------------------------------------------------ */
const DOTS = [
  { id: 'close', label: 'Close the window', className: 'bg-[#ff5f57]' },
  { id: 'minimize', label: 'Minimize the window', className: 'bg-[#febc2e]' },
  { id: 'expand', label: 'Open the window full screen', className: 'bg-[#28c840]' },
]

function Dots({ onExpand, onRefuse, onRest }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {DOTS.map((dot) => {
        const works = dot.id === 'expand'

        return (
          <button
            key={dot.id}
            type="button"
            aria-label={dot.label}
            /* The two that refuse say so rather than pretending: aria-disabled
               keeps them reachable, so the tip can answer a keyboard too. */
            aria-disabled={works ? undefined : true}
            data-cursor={works ? 'link' : 'hover'}
            onClick={works ? onExpand : undefined}
            onMouseEnter={works ? undefined : onRefuse}
            onFocus={works ? undefined : onRefuse}
            onMouseLeave={works ? undefined : onRest}
            onBlur={works ? undefined : onRest}
            className={`h-3 w-3 rounded-full transition-transform duration-300 hover:scale-110 ${dot.className}`}
          />
        )
      })}
    </div>
  )
}

function Tip({ tip }) {
  const above = tip.side === 'above'

  return (
    <motion.p
      /* fixed and outside the window: the frame clips its own corners, and above
         a button sitting in the chrome is above the window itself. */
      className="pointer-events-none fixed z-[110] whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm text-white"
      style={{
        left: tip.x,
        top: tip.y,
        x: above ? '-50%' : 0,
        y: above ? '-100%' : '-50%',
      }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {refusal}
    </motion.p>
  )
}

/* Above the button where there is room for it, beside it where there is not. */
function useRefusalTip() {
  const [tip, setTip] = useState(null)

  function onRefuse(event) {
    const box = event.currentTarget.getBoundingClientRect()
    const above = box.top >= TIP_HEIGHT + TIP_GAP + EDGE

    setTip({
      side: above ? 'above' : 'beside',
      x: above ? box.left + box.width / 2 : box.right + TIP_GAP,
      y: above ? box.top - TIP_GAP : box.top + box.height / 2,
    })
  }

  return { tip, onRefuse, onRest: () => setTip(null) }
}

/* ------------------------------------------------------------------
   Chrome
   ------------------------------------------------------------------ */
function Favicon({ tab, className = '' }) {
  if (!tab.logo) return <Placeholder seed={tabs.indexOf(tab)} className={className} />
  return <img src={tab.logo} alt="" className={`${className} object-contain`} />
}

function Tabs({ active, onSelect }) {
  return (
    <div
      /* The strip scrolls rather than shrinking the tabs: seven labels of
         different lengths cannot all be squeezed and stay readable. */
      className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(i)}
          aria-current={i === active ? 'page' : undefined}
          data-cursor="link"
          className={`flex shrink-0 items-center gap-2 rounded-t-[10px] px-3 py-2 text-sm transition-colors duration-300 ${
            i === active ? 'bg-white text-ink' : 'text-mute hover:text-ink'
          }`}
        >
          <Favicon tab={tab} className="h-4 w-4 shrink-0 rounded-[3px]" />
          <span className="whitespace-nowrap">{tab.place}</span>
        </button>
      ))}
    </div>
  )
}

function Bar({ tab }) {
  return (
    <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
      <span className="h-2 w-2 shrink-0 rounded-full bg-line" aria-hidden="true" />
      <p className="truncate text-sm text-mute">
        {tab.url ?? <span className="italic">url to fill in</span>}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------
   The page inside the tab
   ------------------------------------------------------------------ */
function Page({ tab }) {
  return (
    <div className="mx-auto w-full max-w-[42rem] px-6 py-10 sm:px-10">
      <div className="flex items-center gap-4">
        <Favicon tab={tab} className="h-11 w-11 shrink-0 rounded-[10px]" />
        <div className="min-w-0">
          <h3 className="display-sm truncate">{tab.place}</h3>
          <p className="text-base text-mute">{tab.role}</p>
        </div>
      </div>

      <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-4 text-sm">
        <div>
          <dt className="text-mute">Period</dt>
          <dd className="mt-1 font-bold">{tab.period}</dd>
        </div>
        <div>
          <dt className="text-mute">Missions</dt>
          <dd className="mt-1 font-bold">{tab.missions}</dd>
        </div>
      </dl>

      <p className="mt-8 text-[1.0625rem] leading-[1.65] text-ink/80">{tab.description}</p>

      {tab.quote && (
        <figure className={`mt-8 bg-paper p-6 ${FRAME_RADIUS}`}>
          <blockquote className="text-[1.0625rem] leading-[1.65] text-ink/80">
            {tab.quote.text}
          </blockquote>
          <figcaption className="mt-4 text-sm font-bold">
            {tab.quote.client}
            <span className="font-normal text-mute"> — {tab.place}</span>
          </figcaption>
        </figure>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------
   The window itself, used both in the flow and full screen
   ------------------------------------------------------------------ */
function Frame({ active, onSelect, onExpand, tip, onRefuse, onRest, expanded = false }) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-line bg-paper ${
        expanded ? '' : FRAME_RADIUS
      }`}
    >
      {/* Full screen keeps the top right clear: the strip is flex-1, so it runs to
          the frame's edge, which is exactly where the close button sits. */}
      <div className={`flex items-end gap-4 px-4 pt-3 ${expanded ? 'pr-20 sm:pr-24' : ''}`}>
        <Dots onExpand={onExpand} onRefuse={onRefuse} onRest={onRest} />
        <Tabs active={active} onSelect={onSelect} />
      </div>

      <Bar tab={tabs[active]} />

      {/* The page scrolls inside the window, not the window inside the page. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
        <Page tab={tabs[active]} />
      </div>

      <AnimatePresence>{tip && <Tip tip={tip} />}</AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------
   Below lg: no chrome at all, just the experiences in order.

   A browser window is a desktop object: the tabs, the address bar and the drag
   all need room a phone does not have, and squeezed into 350px the joke stops
   being one. The content is the same, read straight down.
   ------------------------------------------------------------------ */
function Flat() {
  return (
    <div className="relative z-10 mt-14 lg:hidden">
      {tabs.map((tab, i) => (
        <article key={tab.id} className={i ? 'mt-14' : ''}>
          <Page tab={tab} />
        </article>
      ))}
    </div>
  )
}

/* Where the surface grows from, as the transform that puts a full screen box back
   onto the window it came from. The same measured flip the case studies use: the
   window sits under a drag transform, which a layout animation cannot see. */
function flip(rect) {
  if (!rect) return { x: 0, y: 0, scaleX: 1, scaleY: 1 }
  return {
    x: rect.left,
    y: rect.top,
    scaleX: rect.width / window.innerWidth,
    scaleY: rect.height / window.innerHeight,
  }
}

/* ------------------------------------------------------------------ */
export default function Experience() {
  const reduce = useReducedMotion()
  const field = useRef(null)
  const frame = useRef(null)
  const closer = useRef(null)
  const [active, setActive] = useState(0)
  /* The drag writes into values of our own rather than ones Framer keeps to
     itself. Not a preference: given a ref for its constraints, Framer resolves
     them against the page and, without external values to rebase onto, it read
     the window as out of bounds and snapped it 154px up onto the field's top edge
     the moment it mounted. The project cards were already doing this. */
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  // The rect is caught at the click, not recomputed: it is where the window was
  // when it was opened, drag included.
  const [from, setFrom] = useState(null)
  const flow = useRefusalTip()
  const full = useRefusalTip()

  const expanded = from !== null

  /* Held here rather than in the overlay, and keyed on intent: AnimatePresence
     keeps the overlay mounted until its exit finishes, so an exit interrupted
     halfway would otherwise leave the page locked and unreachable. */
  useEffect(() => {
    if (!expanded) return undefined
    const root = document.getElementById('root')
    const html = document.documentElement
    const wasOverflow = html.style.overflow
    const wasPadding = html.style.paddingRight
    const bar = window.innerWidth - html.clientWidth

    html.style.overflow = 'hidden'
    if (bar > 0) html.style.paddingRight = `${bar}px`
    root?.setAttribute('inert', '')

    return () => {
      html.style.overflow = wasOverflow
      html.style.paddingRight = wasPadding
      root?.removeAttribute('inert')
    }
  }, [expanded])

  useEffect(() => {
    if (!expanded) return undefined
    closer.current?.focus()

    function onKey(e) {
      if (e.key === 'Escape') setFrom(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  function onExpand() {
    setFrom(frame.current?.getBoundingClientRect() ?? null)
  }

  return (
    <section
      id="experience"
      /* overflow-x-clip for the same reason as Works: dragElastic lets the window
         be pulled past the field, and clip keeps that from ever reaching the
         document as a scrollbar without making a scroll container of the section.
         relative, because the field hangs off this box. */
      className="gutter relative flex min-h-svh flex-col justify-center overflow-x-clip py-24 lg:py-16"
    >
      {/* How far the window may be carried: the section, kept off its own edge.
          No rotation on this one, unlike the project cards, so the box the drag
          constrains is the box the eye sees and 1.5rem is only breathing room. */}
      <div ref={field} aria-hidden="true" className="pointer-events-none absolute inset-6" />

      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <Headline lines={experience.title} className="display-lg text-center" />
      </div>

      <motion.div
        ref={frame}
        /* The window is the draggable thing, so the drag lives on the wrapper and
           the frame inside it never has to know. */
        drag={!reduce}
        dragConstraints={field}
        dragElastic={0.16}
        dragMomentum={false}
        style={{ x: dragX, y: dragY }}
        data-cursor="hover"
        /* 34rem is the height it wants; the calc is the height it can have. The
           section owes 16rem to everything above the window, 8rem of padding top
           and bottom at lg plus the title and the gap, so on a 720px laptop the
           window takes 464px and the section still fits one screen. */
        className={`relative z-10 mx-auto mt-10 hidden h-[min(34rem,calc(100svh-16rem))] w-full max-w-[68rem] cursor-grab shadow-[0_28px_60px_-28px_rgba(1,1,2,0.3)] active:cursor-grabbing lg:block ${FRAME_RADIUS}`}
      >
        <Frame
          active={active}
          onSelect={setActive}
          onExpand={onExpand}
          tip={flow.tip}
          onRefuse={flow.onRefuse}
          onRest={flow.onRest}
        />
      </motion.div>

      <Flat />

      {createPortal(
        <AnimatePresence>
          {expanded && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Experience, full screen"
              className="fixed inset-0 z-[100] origin-top-left"
              initial={reduce ? { opacity: 0 } : flip(from)}
              animate={reduce ? { opacity: 1 } : { x: 0, y: 0, scaleX: 1, scaleY: 1 }}
              exit={reduce ? { opacity: 0 } : flip(from)}
              transition={reduce ? { duration: 0.2 } : GROW}
            >
              <motion.div
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: SHUT }}
                transition={COPY_IN}
              >
                <Frame
                  expanded
                  active={active}
                  onSelect={setActive}
                  onExpand={undefined}
                  tip={full.tip}
                  onRefuse={full.onRefuse}
                  onRest={full.onRest}
                />
              </motion.div>

              <motion.button
                ref={closer}
                type="button"
                onClick={() => setFrom(null)}
                aria-label="Leave full screen"
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
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}

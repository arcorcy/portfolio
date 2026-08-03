import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion'
import { Headline, EASE } from '../lib/motion.jsx'
import { stepAt } from '../lib/sequence.js'
import { experience } from '../data/experience.js'
import Placeholder from './Placeholder.jsx'

const { tabs, refusal } = experience

/* Half the shot radius. A browser frame at this size wants a tighter corner than
   a card does, and it is the same halving the case study cover uses. */
const FRAME_RADIUS = 'rounded-[calc(var(--radius-shot)/2)]'

/* Scroll length of one tab, in percent of the viewport height. 60svh puts a tab
   change roughly five wheel notches apart on a 900px screen: deliberate rather
   than twitchy, and the same pitch the seven-entry section it replaces used. */
const PER_TAB = 60

/* Full screen borrows the case studies' timing exactly, since it is the same
   move: the surface grows first and the content arrives once it has stopped. */
const GROW = { duration: 0.55, ease: EASE }
const COPY_IN = { duration: 0.45, delay: 0.35, ease: EASE }
const SHUT = { duration: 0.12 }

/* The refusal tip is placed from the button's own box rather than guessed at.
   TIP_HEIGHT is not a guess either: it is this tip's own box, one line of text-sm
   at 20px on 2 x 0.5rem of padding, measured at 34px. EDGE is what it keeps off
   the viewport. */
const TIP_HEIGHT = 36
const TIP_GAP = 12
const EDGE = 8

/* ------------------------------------------------------------------
   The window buttons. One of the three works.

   The one that works is the one with colour: the lime, as everywhere else on the
   site. The two that refuse are paper a shade deeper, so they read as switched
   off rather than as a different kind of button.
   ------------------------------------------------------------------ */
const DOTS = [
  { id: 'close', label: 'Close the window', className: 'bg-paper-deep' },
  { id: 'minimize', label: 'Minimize the window', className: 'bg-paper-deep' },
  { id: 'expand', label: 'Open the window full screen', className: 'bg-lime' },
]

function Dots({ onExpand, onRefuse, onRest }) {
  return (
    /* self-center, not the row's items-end: the tabs are flush with the bottom of
       the strip, the way a browser's are, and the dots sitting on that same line
       ended up straddling the address bar's border. */
    <div className="flex shrink-0 items-center gap-2 self-center">
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
            className={`h-3.5 w-3.5 rounded-full transition-transform duration-300 hover:scale-110 ${dot.className}`}
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

/* The tab always shows the site's own icon. The page prefers the real mark once
   there is one, since a 16px favicon blown up to 44px is a soft square. Either
   way, no mark means the placeholder tile rather than a hole. */
function Mark({ tab, prefer = 'favicon', className = '' }) {
  const src = prefer === 'logo' ? (tab.logo ?? tab.favicon) : tab.favicon
  if (!src) return <Placeholder seed={tabs.indexOf(tab)} className={className} />
  return <img src={src} alt="" className={`${className} object-contain`} />
}

function Tabs({ active, onSelect }) {
  return (
    /* The strip does not scroll: the tabs share the width and their labels are cut
       instead, which is what a browser does. min-w-0 on the button is what lets
       flex shrink it past its text, and on the label is what lets truncate bite. */
    <div className="flex min-w-0 flex-1 gap-1">
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(i)}
          aria-current={i === active ? 'page' : undefined}
          data-cursor="link"
          title={tab.place}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-t-[10px] px-3 py-2 text-sm transition-colors duration-300 ${
            i === active ? 'bg-white text-ink' : 'text-mute hover:text-ink'
          }`}
        >
          <Mark tab={tab} className="h-4 w-4 shrink-0 rounded-[3px]" />
          <span className="min-w-0 truncate">{tab.place}</span>
        </button>
      ))}
    </div>
  )
}

function Chevron({ dir }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={dir === 'prev' ? 'M10 3.5L5.5 8l4.5 4.5' : 'M6 3.5L10.5 8 6 12.5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* The two arrows a browser puts left of its address bar. Here they step the tab
   rather than the history, and they grey out at the ends the way back does with
   nothing behind it. */
function Steps({ active, onSelect }) {
  const moves = [
    { dir: 'prev', to: active - 1, label: 'Previous experience' },
    { dir: 'next', to: active + 1, label: 'Next experience' },
  ]

  return (
    <div className="flex shrink-0 items-center gap-1">
      {moves.map((move) => {
        const dead = move.to < 0 || move.to > tabs.length - 1

        return (
          <button
            key={move.dir}
            type="button"
            onClick={() => onSelect(move.to)}
            disabled={dead}
            aria-label={move.label}
            data-cursor={dead ? 'hover' : 'link'}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300 ${
              dead ? 'text-paper-deep' : 'text-mute hover:bg-paper hover:text-ink'
            }`}
          >
            <Chevron dir={move.dir} />
          </button>
        )
      })}
    </div>
  )
}

function Bar({ tab, active, onSelect }) {
  return (
    <div className="flex items-center gap-3 border-b border-line bg-white px-3 py-2">
      <Steps active={active} onSelect={onSelect} />
      <p className="truncate text-sm text-mute">
        {tab.url ?? <span className="italic">url to fill in</span>}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------
   The page inside the tab
   ------------------------------------------------------------------ */
/* Two columns from md up, one below.

   The window is 1088px wide and the reading measure is 42rem, so a single column
   left half of it empty and stacked the quote under a paragraph, which is what
   made the page taller than the window and forced a scrollbar inside it. Side by
   side, the tallest tab is about half as tall and the width earns its keep. */
function Page({ tab }) {
  return (
    <div
      /* Two columns only where there is a second thing to put in one. Four of the
         seven tabs have no quote, and a grid held open for them left half the
         window blank; centred on its own measure it reads as a page that simply
         does not need the width. */
      className={`px-6 py-8 sm:px-10 ${
        tab.quote
          ? 'grid gap-x-12 gap-y-8 md:grid-cols-2 md:items-start'
          : 'mx-auto max-w-[42rem]'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-4">
          <Mark tab={tab} prefer="logo" className="h-11 w-11 shrink-0 rounded-[10px]" />
          <div className="min-w-0">
            <h3 className="display-sm truncate">{tab.place}</h3>
            <p className="text-base text-mute">{tab.role}</p>
          </div>
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-4 text-sm">
          <div>
            <dt className="text-mute">Period</dt>
            <dd className="mt-1 font-bold">{tab.period}</dd>
          </div>
          <div>
            <dt className="text-mute">Missions</dt>
            <dd className="mt-1 font-bold">{tab.missions}</dd>
          </div>
        </dl>

        <p className="mt-6 text-[1.0625rem] leading-[1.65] text-ink/80">{tab.description}</p>
      </div>

      {tab.quote && (
        <figure className={`min-w-0 bg-paper p-6 ${FRAME_RADIUS}`}>
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

      <Bar tab={tabs[active]} active={active} onSelect={onSelect} />

      {/* No scrolling inside the window, and nothing to scroll to: a scroll
          container here swallows the wheel and stalls the page, which is the one
          thing a pinned section cannot afford. The window is sized to hold the
          tallest tab instead, and overflow-hidden is the guarantee that a longer
          one would be cut rather than quietly trap the wheel again. */}
      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        <Page tab={tabs[active]} />
      </div>

      <AnimatePresence>{tip && <Tip tip={tip} />}</AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------
   Below lg, and whenever motion is turned down: no chrome at all, just the
   experiences in order.

   A browser window is a desktop object: the tabs, the address bar and the drag
   all need room a phone does not have, and squeezed into 350px the joke stops
   being one. Pinning it would be worse still, since the whole point of the pin is
   that a tab changes under a pointer that is not going anywhere.
   ------------------------------------------------------------------ */
function Flat({ reduce }) {
  return (
    <div
      className={`gutter relative z-10 mx-auto w-full max-w-[1400px] py-24 sm:py-32 ${
        reduce ? '' : 'lg:hidden'
      }`}
    >
      <Headline lines={experience.title} className="display-lg text-center" />

      {tabs.map((tab) => (
        <article key={tab.id} className="mt-14">
          <Page tab={tab} />
        </article>
      ))}
    </div>
  )
}

/* How far the window may be carried, as pixel offsets from where it sits.

   An object and not a ref, unlike everywhere else in this codebase, because the
   box it must stay inside is `sticky`. Given a ref, Framer resolves constraints
   against page boxes measured once; a sticky panel's page box moves as it pins,
   so those go stale and it clamps the window against them, which is what dragged
   it 50px off its own position at mount.

   Offsets inside the field have no such problem: offsetLeft and clientWidth are
   both read from the field's padding box, so the pair is true at any scroll
   position. Nothing is subtracted here: the field is already the limit, bled out
   of the gutter to 1.5rem off the screen, and it starts below the heading, so the
   window can neither leave the screen nor cover the title. Zero is inside the
   range by construction, since the window sits inside the field, so nothing can
   snap. */
function bounds(field, frame) {
  return {
    left: -frame.offsetLeft,
    right: field.clientWidth - frame.offsetLeft - frame.offsetWidth,
    top: -frame.offsetTop,
    bottom: field.clientHeight - frame.offsetTop - frame.offsetHeight,
  }
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
  const track = useRef(null)
  const field = useRef(null)
  const frame = useRef(null)
  const closer = useRef(null)
  const [active, setActive] = useState(0)
  // The rect is caught at the click, not recomputed: it is where the window was
  // when it was opened, drag included.
  const [from, setFrom] = useState(null)
  /* Not a preference: given a ref for its constraints Framer resolves them against
     the page, and without external values to rebase onto it read the window as out
     of bounds and snapped it onto the field's top edge at mount, over the title.
     The project cards were already doing this. */
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const [room, setRoom] = useState(null)
  const flow = useRefusalTip()
  const full = useRefusalTip()

  const expanded = from !== null

  /* The scroll owns which tab is up, and nothing else writes it while the section
     is on screen. That is the whole reason a click has to scroll rather than set:
     an active tab held as its own state would be overwritten by the next frame. */
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!expanded) setActive(stepAt(p, tabs.length))
  })

  /* Read on the way out of full screen, where the page has been locked and the
     scroll no longer agrees with the tab that is up. A ref because the release
     happens in an effect teardown, which would otherwise close over a stale one. */
  const shown = useRef(0)
  shown.current = active

  /* The scroll position that puts tab i up: the middle of its own band. stepAt
     leads by 12% of a band, and half a band is well clear of that, so the middle
     lands on i and not on its neighbour. */
  function bandTop(i) {
    const el = track.current
    if (!el) return null
    const run = el.offsetHeight - window.innerHeight
    const top = el.getBoundingClientRect().top + window.scrollY
    return top + ((i + 0.5) / tabs.length) * run
  }

  function onSelect(i) {
    if (i < 0 || i > tabs.length - 1) return
    if (expanded) {
      setActive(i)
      return
    }
    const to = bandTop(i)
    if (to === null) return
    window.scrollTo({ top: to, behavior: reduce ? 'auto' : 'smooth' })
  }

  /* Measured off the field, not the page. The observer catches the field being
     resized by the viewport, the listener catches the frames the observer cannot
     deliver in a document that is not painting. */
  useEffect(() => {
    const p = field.current
    const w = frame.current
    if (!p || !w) return undefined

    const measure = () => setRoom(bounds(p, w))
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(p)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

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

      /* Put the page where the tab that is up belongs, or the first scroll after
         coming back would snap to whichever tab the old position pointed at. */
      const to = bandTop(shown.current)
      if (to !== null) window.scrollTo({ top: to, behavior: 'auto' })
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
    <section id="experience" className="relative">
      {/* The pinned run. One screen of height beyond the tabs themselves: that is
          the screen the panel spends in view before it starts pinning. */}
      <div
        ref={track}
        style={{ height: `calc(100svh + ${tabs.length * PER_TAB}svh)` }}
        className={reduce ? 'hidden' : 'hidden lg:block'}
      >
        {/* overflow-x-clip on the panel and not on the section: the panel is the
            sticky element, so clipping it cannot interfere with its own pinning,
            and its box is the screen, which is exactly what the window must not
            leave. clip rather than hidden, which would make a scroll container of
            it and break the pin outright. */}
        <div className="gutter sticky top-0 flex h-svh flex-col justify-center overflow-x-clip">
          <Headline
            lines={experience.title}
            className="display-lg mx-auto w-full max-w-[1400px] text-center"
          />

          {/* The room the window has, which is what the panel has left once the
              title has had its share. A flex item below the heading rather than a
              box pinned to the panel: the window then cannot be dragged over the
              title, with nothing measured and nothing to keep in step with a title
              that changes height. The negative margin is what lets it out of the
              gutter, landing its edges 1.5rem off the screen at any breakpoint. */}
          <div
            ref={field}
            className="relative mx-[calc(1.5rem-var(--gutter))] mt-8 flex flex-1 items-center justify-center"
          >
            <motion.div
              ref={frame}
              /* The window is the draggable thing, so the drag lives on the wrapper
                 and the frame inside it never has to know. */
              drag
              dragConstraints={room ?? false}
              dragElastic={0.16}
              dragMomentum={false}
              style={{ x: dragX, y: dragY }}
              data-cursor="hover"
              /* 40rem is the height it wants, and the field minus 3rem is all it
                 can have. Taken from the field rather than from the viewport, so
                 the title and the gap are already deducted: on a 720px laptop the
                 window is 580px against the 528 a viewport-based cap allowed.

                 The 3rem is not spare room, it is the vertical play: at 100% the
                 window filled the field exactly and dragging it up or down did
                 nothing, which reads as broken rather than as bounded. It costs
                 48px on the shortest screen, where the tallest tab still has 89px
                 of headroom inside the window. */
              className={`h-[min(40rem,calc(100%-3rem))] w-full max-w-[68rem] cursor-grab shadow-[0_28px_60px_-28px_rgba(1,1,2,0.3)] active:cursor-grabbing ${FRAME_RADIUS}`}
            >
              <Frame
                active={active}
                onSelect={onSelect}
                onExpand={onExpand}
                tip={flow.tip}
                onRefuse={flow.onRefuse}
                onRest={flow.onRest}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <Flat reduce={reduce} />

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
                  onSelect={onSelect}
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

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { Headline, EASE } from '../lib/motion.jsx'
import { experience } from '../data/experience.js'
import Placeholder from './Placeholder.jsx'

const { tabs, refusal } = experience

/* The three kinds split the run into three windows, each its own list, each its
   own small app: the employee years in a browser, the two schools in a Notes
   sidebar, the one freelance stint in a terminal. Nothing else reads `tabs`
   directly below this point. */
const workTabs = tabs.filter((tab) => tab.kind === 'work')
const schoolTabs = tabs.filter((tab) => tab.kind === 'school')
const freelanceTab = tabs.find((tab) => tab.kind === 'freelance')

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
    <div className="flex shrink-0 items-center gap-1.5 self-center">
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

/* Above the button where there is room for it, beside it where there is not.
   Shared by the three in-flow windows: only one dot can be pointed at a time,
   so one instance of this is enough for all of them. */
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
   Chrome shared by more than one kind of window
   ------------------------------------------------------------------ */

/* Every window shows the site's own icon. The page prefers the real mark once
   there is one, since a 16px favicon blown up is a soft square. Either way, no
   mark means the placeholder tile rather than a hole. */
function Mark({ tab, prefer = 'favicon', className = '' }) {
  const src = prefer === 'logo' ? (tab.logo ?? tab.favicon) : tab.favicon
  if (!src) return <Placeholder seed={tabs.indexOf(tab)} className={className} />
  return <img src={src} alt="" className={`${className} object-contain`} />
}

function Chevron({ dir }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

/* The two arrows a browser puts left of its address bar, reused for Notes' own
   pair. length is the list being stepped, since Notes steps two and the browser
   steps four rather than the same seven every window used to share. dark is the
   terminal's palette, unused here since the terminal has nothing to step. */
function Steps({ length, active, onSelect, dark = false }) {
  const moves = [
    { dir: 'prev', to: active - 1, label: 'Previous' },
    { dir: 'next', to: active + 1, label: 'Next' },
  ]

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {moves.map((move) => {
        const dead = move.to < 0 || move.to > length - 1

        return (
          <button
            key={move.dir}
            type="button"
            onClick={() => onSelect(move.to)}
            disabled={dead}
            aria-label={move.label}
            data-cursor={dead ? 'hover' : 'link'}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300 ${
              dead
                ? dark
                  ? 'text-white/20'
                  : 'text-paper-deep'
                : dark
                  ? 'text-white/60 hover:bg-white/10 hover:text-white'
                  : 'text-mute hover:bg-paper hover:text-ink'
            }`}
          >
            <Chevron dir={move.dir} />
          </button>
        )
      })}
    </div>
  )
}

/* The reading measure inside every window: header, a period/missions row, a
   short paragraph, the testimonial where there is one. compact is what the two
   smaller windows and their smaller type ask for; line-clamp is the guarantee
   that a longer real paragraph, later, still cannot force a scrollbar the
   windows are built to never have. */
function Page({ tab, compact = false }) {
  return (
    <div className={compact ? 'px-4 py-4' : 'px-6 py-8 sm:px-10'}>
      <div className="flex items-center gap-3">
        <Mark
          tab={tab}
          prefer="logo"
          className={compact ? 'h-9 w-9 shrink-0 rounded-[8px]' : 'h-11 w-11 shrink-0 rounded-[10px]'}
        />
        <div className="min-w-0">
          <h3 className={compact ? 'truncate text-[0.95rem] font-bold' : 'display-sm truncate'}>
            {tab.place}
          </h3>
          <p className={compact ? 'truncate text-xs text-mute' : 'text-base text-mute'}>{tab.role}</p>
        </div>
      </div>

      <dl
        className={`flex flex-wrap border-y border-line ${
          compact ? 'mt-3 gap-x-6 gap-y-1 py-2 text-xs' : 'mt-6 gap-x-10 gap-y-4 py-4 text-sm'
        }`}
      >
        <div>
          <dt className="text-mute">Period</dt>
          <dd className="mt-0.5 font-bold">{tab.period}</dd>
        </div>
        <div>
          <dt className="text-mute">Missions</dt>
          <dd className="mt-0.5 font-bold">{tab.missions}</dd>
        </div>
      </dl>

      <p
        className={`text-ink/80 ${
          compact ? 'mt-3 line-clamp-3 text-sm leading-[1.5]' : 'mt-6 text-[1.0625rem] leading-[1.65]'
        }`}
      >
        {tab.description}
      </p>

      {tab.quote && (
        <figure className={`bg-paper ${FRAME_RADIUS} ${compact ? 'mt-3 p-3' : 'mt-6 p-6'}`}>
          <blockquote
            className={`text-ink/80 ${compact ? 'line-clamp-3 text-sm leading-[1.5]' : 'text-[1.0625rem] leading-[1.65]'}`}
          >
            {tab.quote.text}
          </blockquote>
          <figcaption className={`font-bold ${compact ? 'mt-2 text-xs' : 'mt-4 text-sm'}`}>
            {tab.quote.client}
            <span className="font-normal text-mute"> — {tab.place}</span>
          </figcaption>
        </figure>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------
   The browser: the employee years, one tab each.
   ------------------------------------------------------------------ */
function Tabs({ active, onSelect }) {
  return (
    /* The strip does not scroll: the tabs share the width and their labels are cut
       instead, which is what a browser does. min-w-0 on the button is what lets
       flex shrink it past its text, and on the label is what lets truncate bite. */
    <div className="flex min-w-0 flex-1 gap-1">
      {workTabs.map((tab, i) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(i)}
          aria-current={i === active ? 'page' : undefined}
          data-cursor="link"
          title={tab.place}
          className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-t-[8px] px-2.5 py-1.5 text-xs transition-colors duration-300 ${
            i === active ? 'bg-white text-ink' : 'text-mute hover:text-ink'
          }`}
        >
          <Mark tab={tab} className="h-3.5 w-3.5 shrink-0 rounded-[3px]" />
          <span className="min-w-0 truncate">{tab.place}</span>
        </button>
      ))}
    </div>
  )
}

function Bar({ tab, active, onSelect }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-white px-2.5 py-1.5">
      <Steps length={workTabs.length} active={active} onSelect={onSelect} />
      <p className="truncate text-xs text-mute">
        {tab.url ?? <span className="italic">url to fill in</span>}
      </p>
    </div>
  )
}

function BrowserFrame({ active, onSelect, onExpand, tip, onRefuse, onRest, expanded = false }) {
  const tab = workTabs[active]

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-line bg-paper ${
        expanded ? '' : FRAME_RADIUS
      }`}
    >
      <div className={`flex items-end gap-3 px-3 pt-2.5 ${expanded ? 'pr-20 sm:pr-24' : ''}`}>
        <Dots onExpand={onExpand} onRefuse={onRefuse} onRest={onRest} />
        <Tabs active={active} onSelect={onSelect} />
      </div>

      <Bar tab={tab} active={active} onSelect={onSelect} />

      {/* No scrolling inside the window, and nothing to scroll to: a scroll
          container here swallows the wheel, and Page's line-clamp is what keeps
          the content itself from ever needing one. */}
      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        <Page tab={tab} compact />
      </div>

      <AnimatePresence>{tip && <Tip tip={tip} />}</AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------
   The notes: the two schools, a note list rather than a tab strip.
   ------------------------------------------------------------------ */
function NotesFrame({ active, onSelect, onExpand, tip, onRefuse, onRest, expanded = false }) {
  const tab = schoolTabs[active]

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-line bg-paper ${
        expanded ? '' : FRAME_RADIUS
      }`}
    >
      <div className={`flex items-end gap-3 px-3 pt-2.5 ${expanded ? 'pr-20 sm:pr-24' : ''}`}>
        <Dots onExpand={onExpand} onRefuse={onRefuse} onRest={onRest} />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 pb-1.5">
          <p className="truncate text-xs font-bold text-mute">Notes</p>
          <Steps length={schoolTabs.length} active={active} onSelect={onSelect} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ul className="w-28 shrink-0 overflow-hidden border-r border-line bg-paper-deep/25 py-1 sm:w-32">
          {schoolTabs.map((note, i) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                data-cursor="link"
                className={`block w-full px-2.5 py-2 text-left transition-colors duration-300 ${
                  i === active ? 'bg-white' : 'hover:bg-white/60'
                }`}
              >
                <p className="truncate text-xs font-bold text-ink">{note.place}</p>
                <p className="truncate text-[10px] text-mute">{note.role}</p>
              </button>
            </li>
          ))}
        </ul>
        <div className="min-h-0 flex-1 overflow-hidden bg-white">
          <Page tab={tab} compact />
        </div>
      </div>

      <AnimatePresence>{tip && <Tip tip={tip} />}</AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------
   The terminal: the one freelance run, nothing to step through.
   ------------------------------------------------------------------ */
function TerminalShell({ tab }) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden px-4 py-3 font-mono text-xs leading-[1.55] text-dim">
      <p className="text-white/40">$ whoami --role</p>
      <p className="mt-1 text-lime">
        {tab.role} <span className="text-white/40">@ {tab.place}</span>
      </p>

      <p className="mt-3 text-white/40">$ cat period.txt missions.txt</p>
      <p className="mt-1">{tab.period}</p>
      <p className="mt-1">{tab.missions}</p>

      <p className="mt-3 text-white/40">$ cat about.md</p>
      <p className="mt-1 line-clamp-4 text-white/80">{tab.description}</p>

      <p className="mt-3 text-lime">
        $ <span className="animate-pulse">▮</span>
      </p>
    </div>
  )
}

function TerminalFrame({ onExpand, tip, onRefuse, onRest, expanded = false }) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-ink ${
        expanded ? '' : FRAME_RADIUS
      }`}
    >
      <div className={`flex items-end gap-3 px-3 pt-2.5 ${expanded ? 'pr-20 sm:pr-24' : ''}`}>
        <Dots onExpand={onExpand} onRefuse={onRefuse} onRest={onRest} />
        <p className="min-w-0 flex-1 truncate pb-1.5 text-xs font-bold text-white/60">zsh</p>
      </div>

      <TerminalShell tab={freelanceTab} />

      <AnimatePresence>{tip && <Tip tip={tip} />}</AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------
   Below lg, and whenever motion is turned down: no chrome at all, just the
   experiences in order.

   Three desktop-object windows are exactly what a phone has no room for, and
   nothing here depends on which app each one imitates, so all seven tabs read
   the same way once the chrome is gone.
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

/* Where the surface grows from, as the transform that puts a full screen box
   back onto the window it came from. The same measured flip the case studies
   use: the window sits under a drag transform, which a layout animation
   cannot see. */
function flip(rect) {
  if (!rect) return { x: 0, y: 0, scaleX: 1, scaleY: 1 }
  return {
    x: rect.left,
    y: rect.top,
    scaleX: rect.width / window.innerWidth,
    scaleY: rect.height / window.innerHeight,
  }
}

/* How far a window may be carried, as pixel offsets from where it sits.

   An object rather than the field ref, even though this section no longer
   scrolls: given a ref, Framer measures the field's page box once at mount and
   three windows placed by percentage of that same box came out clamped into a
   cluster around its centre, each pushed 20 to 250px off the spot its left/top
   actually says. offsetLeft and clientWidth, read after layout has settled, do
   not have that problem, and this is the same fix the old sticky window used. */
function bounds(field, win) {
  return {
    left: -win.offsetLeft,
    right: field.clientWidth - win.offsetLeft - win.offsetWidth,
    top: -win.offsetTop,
    bottom: field.clientHeight - win.offsetTop - win.offsetHeight,
  }
}

/* One window, positioned by the percentage point its centre sits at and pulled
   back by half its own fixed size to land there: the same anchoring Work's
   cards use, kept off the drag layer's x/y so the two transforms never fight.
   zIndex is the resting order, owned by the parent: whichever window was last
   dragged, of any of the three, sits above the other two until another is. */
function Window({ spec, room, zIndex, onFront, onExpand, tip, onRefuse, onRest }) {
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)

  return (
    <motion.div
      ref={spec.ref}
      drag
      dragConstraints={room ?? false}
      dragElastic={0.16}
      dragMomentum
      onDragStart={onFront}
      data-cursor="hover"
      style={{
        left: spec.left,
        top: spec.top,
        width: spec.width,
        height: spec.height,
        marginLeft: `calc(${spec.width} * -0.5)`,
        marginTop: `calc(${spec.height} * -0.5)`,
        zIndex,
        x: dragX,
        y: dragY,
      }}
      className={`absolute cursor-grab shadow-[0_28px_60px_-28px_rgba(1,1,2,0.3)] active:cursor-grabbing ${FRAME_RADIUS}`}
    >
      {spec.render({ onExpand, tip, onRefuse, onRest })}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
export default function Experience() {
  const reduce = useReducedMotion()
  const field = useRef(null)
  const browserBox = useRef(null)
  const notesBox = useRef(null)
  const terminalBox = useRef(null)
  const closer = useRef(null)

  const [browserActive, setBrowserActive] = useState(0)
  const [notesActive, setNotesActive] = useState(0)
  /* Resting order of the three windows. Starts as the default arrangement
     (browser in front, terminal in the middle, notes at the back); whichever
     one is dragged, of any of the three, is brought above the other two and
     stays there once let go, until another one is dragged. */
  const [zOrder, setZOrder] = useState({ work: 30, freelance: 20, school: 10 })
  const topZ = useRef(30)

  function bringToFront(kind) {
    topZ.current += 1
    setZOrder((order) => ({ ...order, [kind]: topZ.current }))
  }

  // Which window is full screen, or none. The rect it grows from is caught at
  // the click, not recomputed: it is where that window was when it was opened,
  // drag included.
  const [openKind, setOpenKind] = useState(null)
  const [from, setFrom] = useState(null)
  const [room, setRoom] = useState({})

  const flow = useRefusalTip()
  const full = useRefusalTip()

  const expanded = openKind !== null

  function onExpand(kind, ref) {
    setFrom(ref.current?.getBoundingClientRect() ?? null)
    setOpenKind(kind)
  }

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
      if (e.key === 'Escape') setOpenKind(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  /* Percentages of the field for the centre of each window, pulled back by half
     its own fixed size to land there: the field's own size still decides how
     much room there is to drag in, but the arrangement itself does not depend
     on it. A little overlap between the three is deliberate, not a defect. */
  const windows = [
    {
      kind: 'work',
      ref: browserBox,
      // Front of the other two by default, and lower right: this is the one
      // the eye lands on first.
      left: '70%',
      top: '58%',
      width: '40.25rem',
      height: '34.5rem',
      render: (props) => <BrowserFrame active={browserActive} onSelect={setBrowserActive} {...props} />,
    },
    {
      kind: 'school',
      ref: notesBox,
      // Back of the stack by default, lower left.
      left: '24%',
      top: '62%',
      width: '33.5rem',
      height: '27.5rem',
      render: (props) => <NotesFrame active={notesActive} onSelect={setNotesActive} {...props} />,
    },
    {
      kind: 'freelance',
      ref: terminalBox,
      // Between the other two by default, upper centre.
      left: '46%',
      top: '34%',
      width: '34.5rem',
      height: '23rem',
      render: (props) => <TerminalFrame {...props} />,
    },
  ]

  /* Measured off the field, not the page: the field being resized by the
     viewport is what the observer catches, and the listener catches the
     frames a document that is not painting cannot deliver to it. */
  useEffect(() => {
    const f = field.current
    if (!f) return undefined

    function measure() {
      const next = {}
      windows.forEach((w) => {
        const el = w.ref.current
        if (el) next[w.kind] = bounds(f, el)
      })
      setRoom(next)
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(f)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section
      id="experience"
      /* overflow-x-clip and no justify-center, the same reasons Work's section
         has neither: a drag may overshoot the field on its elastic, and a
         flex-1 field would defeat justify-content before it ever ran, so the
         gap above the title is py-24 lg:py-16 doing the whole job on its own. */
      className="gutter relative flex min-h-svh flex-col overflow-x-clip py-24 lg:py-16"
    >
      <Headline
        lines={experience.title}
        className="display-lg mx-auto w-full max-w-[1400px] text-center"
      />

      {/* The room the windows have. A flex item after the heading rather than a
          box pinned to the section: no window can be dragged over the title,
          with nothing measured and nothing to keep in step with a title that
          changes height. The negative margin lets it out of the gutter, landing
          its edges 1.5rem off the screen at any breakpoint. */}
      <div
        ref={field}
        className={`relative mx-[calc(1.5rem-var(--gutter))] mt-8 flex-1 ${
          reduce ? 'hidden' : 'hidden lg:block'
        }`}
      >
        {windows.map((spec) => (
          <Window
            key={spec.kind}
            spec={spec}
            room={room[spec.kind]}
            zIndex={zOrder[spec.kind]}
            onFront={() => bringToFront(spec.kind)}
            onExpand={() => onExpand(spec.kind, spec.ref)}
            tip={flow.tip}
            onRefuse={flow.onRefuse}
            onRest={flow.onRest}
          />
        ))}
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
                {openKind === 'work' && (
                  <BrowserFrame
                    expanded
                    active={browserActive}
                    onSelect={setBrowserActive}
                    tip={full.tip}
                    onRefuse={full.onRefuse}
                    onRest={full.onRest}
                  />
                )}
                {openKind === 'school' && (
                  <NotesFrame
                    expanded
                    active={notesActive}
                    onSelect={setNotesActive}
                    tip={full.tip}
                    onRefuse={full.onRefuse}
                    onRest={full.onRest}
                  />
                )}
                {openKind === 'freelance' && (
                  <TerminalFrame expanded tip={full.tip} onRefuse={full.onRefuse} onRest={full.onRest} />
                )}
              </motion.div>

              <motion.button
                ref={closer}
                type="button"
                onClick={() => setOpenKind(null)}
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

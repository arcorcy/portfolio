import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { Headline, EASE } from '../lib/motion.jsx'
import { Dots, Draggable, Tip, bounds, useRefusalTip, useStack, FRAME_RADIUS } from './Window.jsx'
import { work } from '../data/content.js'
import { projects } from '../data/projects.js'
import Arrow from './Arrow.jsx'
import Placeholder from './Placeholder.jsx'
import Study from './Study.jsx'

// How far a window is pushed back while another one holds the attention.
const DIMMED = 0.1

/* The resting stack, in the order the data lists them, so the last project starts
   on top. Whichever window is picked up goes above the rest and stays there. */
const REST_ORDER = Object.fromEntries(projects.map((project, i) => [project.id, 10 + i]))

/* The strip has no pointer to answer, so its frames are handed a tip that does
   nothing rather than a live one: the buttons are still drawn, and still refuse. */
const INERT_TIP = { onRefuse: undefined, onRest: undefined }

/* At least 24px between a window and its copy, and the measurement that counts is
   against the frame's edge. */
const COPY_GAP = 44
const COPY_WIDTH = 82

/* The copy is anchored past the window's right edge and slides to the left side
   when it needs to. The whole distance is the window, the copy and both gaps, and
   it can be written without measuring anything: the copy is COPY_WIDTH percent of
   the window, so the window is that ratio's inverse in units of the copy. Only
   the two gaps are pixels, which is why the travel ends up as a calc. */
const FLIP_SPAN = 100 + (100 / COPY_WIDTH) * 100

function flipX(t) {
  return `calc(${(-FLIP_SPAN * t).toFixed(3)}% - ${(2 * COPY_GAP * t).toFixed(1)}px)`
}

/* The side swap is a spring rather than a piece of state, so it slides instead of
   jumping and no render happens while a window crosses the middle. */
const FLIP = { stiffness: 130, damping: 20, mass: 0.9 }

/* ------------------------------------------------------------------
   The title, which starts life as a teaser at the foot of the hero: it
   turns up three seconds in to invite the scroll, then grows and rises
   into its own place as the page moves.

   The same element throughout, never a copy. Its finished state is simply
   no transform at all, which is why it lands exactly where it belongs
   without the destination ever being measured: only its resting centre
   is, and that is read off a wrapper the transform never touches, since
   measuring the moving element would feed its own offset back in.
   ------------------------------------------------------------------ */
const TEASER_DELAY = 3000
const TEASER_AT = 0.92 // where it waits in the viewport, top down
const LAND_AT = 0.3 // where the growth finishes, same scale
const TEASER_SCALE = 0.3

/* The nudge under the teaser. Sized for the scale it is drawn at, not the one
   it is written at: inside the shrinking wrapper, 64px reads as 19px. */
function Nudge({ opacity }) {
  return (
    <motion.svg
      width="40"
      height="64"
      viewBox="0 0 40 64"
      fill="none"
      aria-hidden="true"
      /* Out of the flow, so the space it needs is never charged to the layout
         it leaves behind. pointer-events-none because at rest it is an
         invisible 40x64 box sitting over the top of the strip. */
      className="pointer-events-none absolute left-1/2 top-full mt-5 text-ink"
      // The centring translate goes through Framer, which owns the transform.
      style={{ opacity, x: '-50%' }}
    >
      <path
        d="M20 4C12 18 28 32 20 48"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12 40.5L20 50l8-9.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  )
}

function Teaser({ reduce }) {
  const home = useRef(null)
  const [geometry, setGeometry] = useState(null)
  const [shown, setShown] = useState(reduce)
  /* The link only exists while the teaser is still a teaser. Past that the href
     is dropped rather than the clicks blocked: an anchor with no href is not a
     link at all, so nothing is focusable or announced, and the heading stays
     selectable. Blocking pointer events would have taken that away too. */
  const [live, setLive] = useState(!reduce)
  const { scrollY } = useScroll()

  useLayoutEffect(() => {
    if (reduce) return undefined

    function measure() {
      const el = home.current
      if (!el) return
      const vh = window.innerHeight
      // The centre, not the top: a scale about the centre leaves it put, so
      // the aim holds whatever size the teaser is drawn at.
      const centre = el.getBoundingClientRect().top + el.offsetHeight / 2 + window.scrollY
      const over = Math.max(1, centre - LAND_AT * vh)
      setGeometry({ from: TEASER_AT * vh - centre, over })
      // Settled here too, not only on scroll: a resize moves the threshold, and
      // waiting for the next scroll to notice would leave it stale.
      setLive(window.scrollY < over)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [reduce])

  /* Three seconds, or the first scroll, whichever comes first: someone who
     scrolls straight away should not be left waiting for a teaser. The same
     listener settles the link, off the browser's own scroll events rather than
     off the animated scroll value: whether a link exists is state, not motion,
     and it should not depend on a frame having been rendered. */
  useEffect(() => {
    if (reduce) return undefined

    const timer = setTimeout(() => setShown(true), TEASER_DELAY)

    function onScroll() {
      setShown(true)
      if (geometry) setLive(window.scrollY < geometry.over)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [reduce, geometry])

  function progress(v) {
    if (!geometry) return 1
    const t = Math.min(1, Math.max(0, v / geometry.over))
    return 1 - (1 - t) ** 3
  }

  const y = useTransform(scrollY, (v) => (geometry ? geometry.from * (1 - progress(v)) : 0))
  const scale = useTransform(scrollY, (v) => TEASER_SCALE + (1 - TEASER_SCALE) * progress(v))
  // The nudge belongs to the teaser, so it leaves as the title takes its size.
  const nudge = useTransform(scrollY, (v) => (geometry ? 1 - progress(v) : 0))

  return (
    <div ref={home}>
      <motion.div
        style={reduce ? undefined : { y, scale }}
        /* Spelled out rather than left to animate on its own: without an
           explicit initial, the first opacity is only written on the first
           frame, so the title can flash at full strength before its turn. */
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        {/* relative for the nudge, which hangs off the bottom of the title
            rather than sitting under it in the flow: it belongs to the hero and
            fades out for good, and 84px of dead space between the title and the
            cards is what it left behind once it had gone. */}
        <a
          href={live ? '#work' : undefined}
          data-cursor={live ? 'link' : undefined}
          className="relative block"
        >
          {/* The exit measures the title's own travel, so nothing has to be
              passed in and it cannot end up hung on the section's progress, where
              the title had left the screen long before the range began. */}
          <Headline lines={work.title} className="display-lg text-center" shown={shown} exit />
          {!reduce && <Nudge opacity={nudge} />}
        </a>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------
   The frame a shot is shown in.

   Two of the four shots already open on a header of their own, the Figma plugin
   dialog on Figma's and the CEVA file on a macOS one, so those are framed with
   nothing but a rounded corner: drawing a second header over them would be two
   headers deep. The other two get one drawn here, which is what `chrome` in the
   data picks.

   The shot is never cropped. Its own proportions decide the window's height,
   which is why nothing here sets one and why the data no longer carries a mat, a
   crop or a zoom: the frame is the container now.
   ------------------------------------------------------------------ */
function MacBar({ project, tip }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line bg-paper px-3 py-2.5">
      <Dots onRefuse={tip.onRefuse} onRest={tip.onRest} />
      <p className="min-w-0 flex-1 truncate text-xs font-bold text-mute">
        {project.label ?? project.subtitle}
      </p>
    </div>
  )
}

function BrowserBar({ project, tip }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line bg-paper px-3 py-2.5">
      <Dots onRefuse={tip.onRefuse} onRest={tip.onRest} />
      <div className="flex min-w-0 flex-1 rounded-full bg-white px-2.5 py-1">
        <p className="min-w-0 truncate text-[11px] text-mute">
          {project.url ?? <span className="italic">url to fill in</span>}
        </p>
      </div>
    </div>
  )
}

const CHROME = { macos: MacBar, browser: BrowserBar }

function Frame({ project, index, tip, lifted }) {
  const Bar = CHROME[project.chrome]

  return (
    <div
      /* Two shadows, and the gap between them is the point: just enough at rest
         to tell which window is over which, then a real lift under the one being
         pointed at. */
      className={`overflow-hidden border border-line bg-white transition-shadow duration-500 ${FRAME_RADIUS} ${
        lifted
          ? 'shadow-[0_20px_48px_-24px_rgba(1,1,2,0.22)]'
          : 'shadow-[0_8px_22px_-14px_rgba(1,1,2,0.1)]'
      }`}
    >
      {Bar && <Bar project={project} tip={tip} />}
      {project.cover ? (
        <img
          src={project.cover}
          alt={project.title}
          /* block, so no baseline gap under it, and no height: the shot keeps its
             own proportions and the window takes them. */
          className="block w-full"
          draggable={false}
        />
      ) : (
        <Placeholder seed={index} className="aspect-[16/10] w-full" />
      )}
    </div>
  )
}

function Copy({ project, className = '' }) {
  return (
    <div className={className}>
      <h3 className="display-sm">{project.title}</h3>
      <p className="mt-3 text-base text-mute">{project.subtitle}</p>
    </div>
  )
}

/* ------------------------------------------------------------------
   One window on the stage.

   The behaviour is the shared one, the same as the experiences: dragged inside the
   field, a little momentum, a small lift under the pointer, and it stays on top
   once it has been picked up. Nothing rotates, floats or drifts with the scroll
   any more, and there is no lean on a throw: a window is an object on a desk.

   Anchored by its top left rather than its centre, unlike an experience window.
   Those have a height in the data; these take theirs from a shot that is never
   cropped, so there is no half-height to give back and nothing to measure.

   The copy is a child of the drag layer and sits just beside the window, so it
   travels with it and the link between the two is never in doubt. It stays out of
   the hover layer: text that scales is text nobody reads.
   ------------------------------------------------------------------ */
function Card({ project, index, field, spot, room, active, dim, onEnter, onLeave, onOpen, tip, z, onFront }) {
  const ref = useRef(null)
  // A drag ends in a click too. Framer only fires onDragStart past its
  // threshold, so this stays false for a plain press.
  const dragged = useRef(false)
  const geometry = useRef(null)
  const settled = useRef(project.x + project.size / 2 <= 50 ? 'right' : 'left')

  const flip = useSpring(settled.current === 'right' ? 0 : 1, FLIP)
  const copyX = useTransform(flip, flipX)
  // A dip through the middle of the crossing, where the copy passes the window.
  const crossing = useTransform(flip, [0, 0.5, 1], [1, 0.45, 1])

  /* Which side the copy sits on is decided against the middle of the field, and
     rechecked while the window is dragged: carry a left one over to the right and
     its copy moves round rather than running off the edge. Measured once per
     drag, not once per frame. */
  function onDragStart() {
    onFront()
    dragged.current = true
    if (!ref.current || !field.current) return
    const win = ref.current.getBoundingClientRect()
    const box = field.current.getBoundingClientRect()
    geometry.current = { centre: win.left + win.width / 2, middle: box.left + box.width / 2 }
  }

  function pick(next) {
    if (next === settled.current) return
    settled.current = next
    flip.set(next === 'right' ? 0 : 1)
  }

  function onDrag(_, info) {
    if (!geometry.current) return
    pick(info.offset.x + geometry.current.centre <= geometry.current.middle ? 'right' : 'left')
  }

  /* The window keeps gliding after it is released and onDrag has stopped firing,
     so one thrown across the middle would keep its copy on the old side.
     Measured again once the glide has settled. */
  function onDragTransitionEnd() {
    if (!ref.current || !field.current) return
    const win = ref.current.getBoundingClientRect()
    const box = field.current.getBoundingClientRect()
    pick(win.left + win.width / 2 <= box.left + box.width / 2 ? 'right' : 'left')
  }

  return (
    <Draggable
      innerRef={(el) => {
        ref.current = el
        spot(el)
      }}
      anchor="topLeft"
      left={`${project.x}%`}
      top={`${project.y}%`}
      width={`${project.size}%`}
      room={room}
      zIndex={active ? 500 : z}
      onFront={onFront}
      onEnter={onEnter}
      onLeave={onLeave}
      onDrag={onDrag}
      onDragStart={onDragStart}
      onDragTransitionEnd={onDragTransitionEnd}
      cursor={project.study ? 'link' : 'hover'}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false
          return
        }
        if (project.study && ref.current) onOpen(project, ref.current.getBoundingClientRect())
      }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: dim ? DIMMED : 1 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <Frame project={project} index={index} tip={tip} lifted={active} />
      </motion.div>

      {/* One anchor, just past the window's right edge, and a single translation
          that carries the copy round to the left when it crosses the middle. Two
          competing anchors could not be animated between. */}
      <motion.div
        className="pointer-events-none absolute"
        style={{
          left: '100%',
          top: '50%',
          marginLeft: COPY_GAP,
          width: `${COPY_WIDTH}%`,
          x: copyX,
          y: '-50%',
          opacity: crossing,
        }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <Copy project={project} />
        </motion.div>
      </motion.div>
    </Draggable>
  )
}

/* ------------------------------------------------------------------
   Below lg: the cards in a row you can swipe, or step through with the
   arrows, and the copy underneath.
   ------------------------------------------------------------------ */
function Strip({ onOpen }) {
  const strip = useRef(null)
  const [at, setAt] = useState(0)

  // Nearest card to the middle of the viewport, measured off the real
  // elements so the gap and the edge padding cannot throw the count off.
  function onScroll() {
    const el = strip.current
    if (!el) return
    const middle = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let closest = Infinity
    Array.from(el.children).forEach((child, i) => {
      const distance = Math.abs(child.offsetLeft + child.offsetWidth / 2 - middle)
      if (distance < closest) {
        closest = distance
        best = i
      }
    })
    setAt(best)
  }

  function step(delta) {
    const el = strip.current
    const child = el?.children[at + delta]
    if (!child) return
    el.scrollTo({
      left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2,
      behavior: 'smooth',
    })
  }

  return (
    <div className="mt-12 lg:hidden">
      <div
        ref={strip}
        onScroll={onScroll}
        className="mx-[calc(var(--gutter)*-1)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project, i) => (
          <div key={project.id} className="w-[84%] shrink-0 snap-center sm:w-[62%]">
            <div
              onClick={(e) => {
                if (project.study) onOpen(project, e.currentTarget.getBoundingClientRect())
              }}
            >
              {/* The same frame as on the stage, and no fixed ratio: the shot
                  keeps its own proportions here too. tip is inert on a phone,
                  where nothing is pointed at, so the buttons are drawn and go
                  nowhere. */}
              <Frame project={project} index={i} tip={INERT_TIP} lifted={i === at} />
            </div>
          </div>
        ))}
      </div>

      {/* Reserved height: the titles run from one to four lines, and the arrows
          below them should not jump every time the strip moves on. */}
      <div className="mt-10 min-h-[8.5rem]">
        <motion.div
          key={projects[at].id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Copy project={projects[at]} />
        </motion.div>
      </div>

      <div className="mt-6 flex gap-2">
        <Arrow dir="prev" onClick={() => step(-1)} label="Previous project" />
        <Arrow dir="next" onClick={() => step(1)} label="Next project" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function Work() {
  const reduce = useReducedMotion()
  const section = useRef(null)
  // Where the windows live, and how far they may go. Two different boxes.
  const stage = useRef(null)
  const field = useRef(null)
  const [hovered, setHovered] = useState(null)
  // The rect the surface grows from is captured at the click, not recomputed:
  // it is where the window was when it was pressed.
  const [study, setStudy] = useState(null)
  const { order, bringToFront } = useStack(REST_ORDER)
  // One element per window, for the observer that measures how far each may go.
  const spots = useRef(new Map())
  const tip = useRefusalTip()
  const [room, setRoom] = useState({})

  function open(project, from) {
    setStudy({ project, from })
  }

  /* The page behind is sealed for exactly as long as a study is meant to be
     open: no scrolling, and inert takes it out of the tab order and the
     accessibility tree in one attribute, which a z-index alone would not do.
     Released the moment the study closes rather than when its exit animation
     ends, so a stalled animation can never strand the page. */
  useEffect(() => {
    if (!study) return undefined

    const root = document.getElementById('root')
    const html = document.documentElement

    /* Locked on html, not on body. When html is `overflow: visible`, the body's
       own overflow does not propagate to the viewport, so hiding it there locks
       nothing: the page keeps scrolling behind the study. The gutter is paid
       back as padding so a platform with classic scrollbars does not jump. */
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
  }, [study])

  const { scrollYProgress } = useScroll({
    target: section,
    offset: ['start end', 'end start'],
  })

  /* Measured off the field, not off the page: the field being resized by the
     viewport is what the observer catches, and the listener catches the frames a
     document that is not painting cannot deliver to it. */
  useEffect(() => {
    const box = field.current
    if (!box) return undefined

    function measure() {
      const next = {}
      spots.current.forEach((el, id) => {
        if (el) next[id] = bounds(box, el)
      })
      setRoom(next)
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(box)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section
      id="work"
      ref={section}
      /* The gap before the dark section lives on the Mesh wrapper, not here: the
         grid has to cover it, and a margin would fall outside the wrapper.

         overflow-x-clip, not hidden: a card may be pulled past the field by
         dragElastic, and clip stops that from ever reaching the document as a
         horizontal scrollbar without turning the section into a scroll container,
         which hidden would do. relative, because the field hangs off this box.

         No justify-center: the field below is flex-1, and flex-grow claims any
         leftover space before justify-content sees it, so centering the pair had
         nothing left to distribute. The gap above the teaser is the padding doing
         the whole job on its own, so it is written out: lg:pt-32 to match the
         other sections, which all give their title 128px and left this one at 64
         nearly touching the nav. */
      className="gutter relative flex min-h-svh flex-col overflow-x-clip py-24 lg:pb-16 lg:pt-32"
    >
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <Teaser reduce={reduce} />
      </div>

      {/* How far a card may travel, which is no longer where it lives.

          The stage is the arrangement: the card positions are percentages of it.
          The field is the room, and it takes what the section has left once the
          title has had its share, so a card can be carried out over the margin to
          the edge of the screen but never over the heading. That is why it is a
          flex item below the title rather than a box pinned to the section: no
          measuring, and it cannot fall out of step with a title that changes
          height.

          The negative margin is what lets it out of the gutter: 2.75rem minus the
          gutter, so its edges land 2.75rem off the screen whatever the breakpoint
          has made the gutter.

          2.75rem, because the drag box is not what the eye sees: the card is
          rotated and, while pointed at, scaled. Measured against the real data at
          the 1400px the stage caps at, the corner of the widest card passes its own
          box by 28px at rest after a throw, by 40px while it is also being pointed
          at, and by 58px at the peak of the lean mid-throw. 2.75rem clears the
          first two, which are the states a card sits in.

          The third is what overflow-x-clip on the section is for, along with the
          overshoot dragElastic allows: both are transient, and the point of the
          clip is only that neither can ever reach the document as a scrollbar. */}
      <div
        ref={field}
        className="relative z-10 mx-[calc(2.75rem-var(--gutter))] mt-6 hidden flex-1 items-center justify-center lg:flex"
      >
        {/* The stage. A fixed ratio, capped so the whole constellation always
            fits one screen: the positions in the data are percentages of this
            box, so they hold their arrangement at any size. */}
        <div
          ref={stage}
          className="relative aspect-[16/9] w-full max-w-[min(124svh,1400px)]"
        >
          {projects.map((project, i) => (
            <Card
              key={project.id}
              project={project}
              index={i}
              field={field}
              spot={(el) => spots.current.set(project.id, el)}
              room={room[project.id]}
              active={hovered === project.id}
              dim={hovered !== null && hovered !== project.id}
              onEnter={() => setHovered(project.id)}
              onLeave={() => setHovered(null)}
              onOpen={open}
              tip={tip}
              z={order[project.id]}
              onFront={() => bringToFront(project.id)}
            />
          ))}
        </div>

        <AnimatePresence>{tip.tip && <Tip tip={tip.tip}>{work.refusal}</Tip>}</AnimatePresence>
      </div>

      {/* Outside the field, which is hidden below lg: the strip is the only thing
          on screen at those widths. The margin lives on the strip itself, not on a
          wrapper, since a wrapper keeps its margin on a wide screen even once its
          content is hidden, and the section stopped fitting one viewport by
          exactly that much. */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <Strip onOpen={open} />
      </div>

      <AnimatePresence>
        {study && (
          <Study
            key={study.project.id}
            project={study.project}
            from={study.from}
            onClose={() => setStudy(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

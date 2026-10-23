import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Headline, EASE, PINNED_EXIT } from '../lib/motion.jsx'
import { work } from '../data/content.js'
import { projects } from '../data/projects.js'
import Study from './Study.jsx'

/* The ring is WebGL, Three.js and all: loaded on its own so the hero does not
   wait for it. */
const Ring = lazy(() => import('./Ring.jsx'))

/* Scroll length of one project, in svh. The track is one screen for the panel
   plus this much per step between two projects, and each step turns the ring
   by one case. */
const PER_PROJECT = 80

/* The scroll is segmented: one wheel gesture is one project. STEP is how long
   the page takes to travel to the next case. QUIET is the silence a gesture
   has to end on before the next one counts: a trackpad keeps firing its
   inertia for most of a second after the fingers lift, and without it one
   swipe would run through every project. NUDGE is the smallest delta that
   counts as a gesture, under which a trackpad's resting jitter would step.

   Silence alone is not enough to find where a gesture starts: someone swiping
   again before the last swipe's inertia has died out never leaves a gap, and
   every swipe after the first was swallowed. Inertia only ever decays, so a
   delta that jumps above the one before it (RISE, from at least RISE_FROM) or
   flips direction is a new swipe too. RISE_GAP is the least time between two
   swipes found that way, so a mouse wheel whose deltas accelerate as it spins
   does not read as a burst of gestures. */
const STEP = 0.9
const QUIET = 180
const NUDGE = 4
const RISE = 1.3
const RISE_FROM = 8
const RISE_GAP = 250

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
      /* Where the title rests on the page, worked out as if its panel were not
         pinned: the section's own top, which never sticks, plus how far down the
         panel the title sits, which sticking does not change. Read straight off
         the title's box, a load or a resize landing mid-pin measured the stuck
         position and threw the teaser hundreds of pixels off.

         The centre, not the top: a scale about the centre leaves it put, so the
         aim holds whatever size the teaser is drawn at. */
      const section = el.closest('section')
      const panel = section.firstElementChild
      const centre =
        section.getBoundingClientRect().top +
        window.scrollY +
        (el.getBoundingClientRect().top - panel.getBoundingClientRect().top) +
        el.offsetHeight / 2
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
          <Headline
            lines={work.title}
            className="display-lg text-center"
            shown={shown}
            exit
            /* It rests pinned in the panel on a wide screen, so it needs the
               window that opens above where it rests. */
            exitOffset={PINNED_EXIT}
          />
          {!reduce && <Nudge opacity={nudge} />}
        </a>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Stepping, one project per wheel gesture, while the panel is pinned.

   The scroll owns which case is in front, and nothing else writes it, which is
   why every way of moving (a wheel gesture, a click on a case at the side, a
   keyboard focus) scrolls the page to that case's spot rather than setting
   state the next frame would undo.
   ------------------------------------------------------------------ */
function useSteps(track, progress, last) {
  /* Animated by hand and not with behavior: 'smooth', to know exactly when it
     lands and to ease it with the site's one curve. Each frame's scroll is
     spelled out as instant: html carries scroll-behavior: smooth, under which a
     bare scrollTo starts a native glide of its own, restarted every frame. */
  const travel = useRef(null)
  // The case the page is travelling to, which is where a swipe landing mid-travel counts from.
  const dest = useRef(0)
  /* The wheel gesture under way: when its last event came, how big and which
     way it went, when it began, and whether it was handed back to the page. */
  const gesture = useRef({ at: 0, size: 0, sign: 0, start: 0, free: false })

  function go(i) {
    const box = track.current
    if (!box || i < 0 || i > last) return
    dest.current = i
    const top = box.getBoundingClientRect().top + window.scrollY
    const run = box.offsetHeight - window.innerHeight
    travel.current?.stop()
    travel.current = animate(window.scrollY, top + (i / Math.max(1, last)) * run, {
      duration: STEP,
      ease: EASE,
      onUpdate: (v) => window.scrollTo({ top: v, behavior: 'instant' }),
      onComplete: () => {
        travel.current = null
      },
    })
  }

  /* One gesture, one project. Only while the panel is pinned, and only when
     there is a case to go to in that direction: past the first or the last,
     the wheel is handed back to the page and the section scrolls away as any
     other would, for the rest of that gesture. Everything else a gesture sends
     after its first event is swallowed, which is what makes it stop on the
     case instead of sliding through. */
  useEffect(() => {
    function onWheel(e) {
      const box = track.current
      if (!box) return
      /* A study is portalled to the body, so its wheel still bubbles up to
         window, and the panel behind it is still pinned: without this the
         gesture was swallowed here and the study could not scroll at all. */
      if (e.target instanceof Element && e.target.closest('[role="dialog"]')) return

      const now = performance.now()
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      const size = Math.abs(delta)
      const sign = Math.sign(delta)
      const g = gesture.current
      const fresh =
        now - g.at >= QUIET ||
        (now - g.start >= RISE_GAP &&
          ((sign !== 0 && sign !== g.sign) || (size >= RISE_FROM && size > g.size * RISE)))
      g.at = now
      g.size = size
      if (sign) g.sign = sign
      if (fresh) g.start = now

      const rect = box.getBoundingClientRect()
      if (rect.top > 1 || rect.bottom < window.innerHeight - 1) {
        // A gesture that carries the page into the pin stops there.
        g.free = false
        return
      }

      if (!fresh || size < NUDGE) {
        if (!g.free) e.preventDefault()
        return
      }

      let to
      if (travel.current) {
        to = dest.current + sign
      } else {
        const f = progress.get() * last
        to = sign > 0 ? Math.floor(f + 0.05) + 1 : Math.ceil(f - 0.05) - 1
      }
      if (to < 0 || to > last) {
        g.free = !travel.current
        if (!g.free) e.preventDefault()
        return
      }

      g.free = false
      e.preventDefault()
      go(to)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      travel.current?.stop()
    }
  }, [])

  return go
}

/* ------------------------------------------------------------------
   Turning the ring by hand: a horizontal drag anywhere on the stage.

   The scroll still owns which case is in front, so a drag scrolls the page,
   DRAG_PER_CASE of the screen's width per case, and the ring follows it the way
   it follows the wheel. Letting go lands on a case: the one the drag was
   heading for once it has gone LAND_AFTER of the way there, else back.

   A drag is only a drag past DRAG_FROM pixels. Under that it is a click and is
   left alone, which is why the pointer is captured only then: captured from the
   first press, the canvas below would never hear the click that opens a case.
   ------------------------------------------------------------------ */
const DRAG_PER_CASE = 0.3
const DRAG_FROM = 6
const LAND_AFTER = 0.2

function useDrag(track, progress, last, go, off) {
  const drag = useRef(null)
  // Whether the gesture that just ended was a drag, read by the click after it.
  const dragged = useRef(false)

  function run() {
    const box = track.current
    return box ? box.offsetHeight - window.innerHeight : 0
  }

  function onPointerDown(e) {
    if (off || (e.pointerType === 'mouse' && e.button !== 0)) return
    dragged.current = false
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: window.scrollY, on: false }
  }

  function onPointerMove(e) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!d.on) {
      // A vertical move on a phone is the page's scroll, not a drag.
      if (Math.abs(dx) < DRAG_FROM || Math.abs(dx) < Math.abs(e.clientY - d.y)) return
      d.on = true
      dragged.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const box = track.current
    const top = box.getBoundingClientRect().top + window.scrollY
    const perCase = run() / Math.max(1, last)
    const y = d.from - (dx / (window.innerWidth * DRAG_PER_CASE)) * perCase
    window.scrollTo({ top: Math.min(top + run(), Math.max(top, y)), behavior: 'instant' })
  }

  function onPointerUp(e) {
    const d = drag.current
    drag.current = null
    if (!d?.on) return
    const f = progress.get() * last
    const dx = e.clientX - d.x
    go(dx < 0 ? Math.ceil(f - LAND_AFTER) : Math.floor(f + LAND_AFTER))
  }

  return {
    dragged,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}

/* ------------------------------------------------------------------
   The title of the case in front, at the foot of the screen like a film's
   subtitle: white on a dark band per line, so it reads over whatever the ring
   puts behind it. The kind of project goes first in brackets, the way subtitles
   for the hard of hearing set a sound apart from speech.
   ------------------------------------------------------------------ */
function Subtitle({ project, hidden }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-[7svh] z-10 flex justify-center px-[var(--gutter)]"
    >
      <AnimatePresence mode="wait">
        {!hidden && (
          <motion.p
            key={project.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="max-w-[44rem] text-center text-[clamp(1.05rem,1.7vw,1.5rem)] font-semibold leading-[1.75] text-white"
          >
            {/* box-decoration-break: clone gives each wrapped line its own band,
                which is what makes it read as a subtitle and not as a label. */}
            <span className="rounded-[4px] bg-ink/85 px-[0.4em] py-[0.12em] [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
              <span className="opacity-70">[{project.subtitle}]</span> {project.title}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function Work() {
  const reduce = useReducedMotion()
  const section = useRef(null)
  const last = projects.length - 1
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const go = useSteps(section, scrollYProgress, last)
  const [active, setActive] = useState(0)
  /* Two steps to opening: `opened` is the case on its way into the camera, and
     `study` the copy that fades in once it has arrived. */
  const [opened, setOpened] = useState(null)
  const [study, setStudy] = useState(null)
  const onScreen = useInView(section, { margin: '20% 0px' })
  const { dragged, handlers } = useDrag(section, scrollYProgress, last, go, Boolean(opened))

  useMotionValueEvent(scrollYProgress, 'change', (p) =>
    setActive(Math.min(last, Math.max(0, Math.round(p * last)))),
  )

  /* A case at the side comes to the front first; the one in front opens. */
  function pick(id) {
    const i = projects.findIndex((p) => p.id === id)
    // The release of a drag also lands on a case as a click: it is not one.
    if (i < 0 || opened || dragged.current) return
    if (i !== active) return go(i)
    if (projects[i].study) setOpened(id)
  }

  function close() {
    setStudy(null)
    setOpened(null)
  }

  /* The page behind is sealed for exactly as long as a case is opening or a
     study is open: no scrolling, which would turn the ring under the camera,
     and inert takes it out of the tab order and the accessibility tree in one
     attribute. Released the moment the study closes rather than when its exit
     animation ends, so a stalled animation can never strand the page. */
  const sealed = Boolean(opened || study)
  useEffect(() => {
    if (!sealed) return undefined

    const root = document.getElementById('root')
    const html = document.documentElement

    /* Locked on html, not on body. When html is `overflow: visible`, the body's
       own overflow does not propagate to the viewport, so hiding it there locks
       nothing. The gutter is paid back as padding so a platform with classic
       scrollbars does not jump. */
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
  }, [sealed])

  return (
    <section
      id="work"
      ref={section}
      /* The track: one screen for the panel plus PER_PROJECT per step, at every
         width. The gap before the dark section lives on the Mesh wrapper. */
      className="relative h-[var(--track)]"
      style={{ '--track': `${100 + last * PER_PROJECT}svh` }}
    >
      {/* overflow-clip, not hidden: hidden would make the panel a scroll
          container, which useScroll would take for the one the title lives in.
          z-10 on the panel itself, since sticky makes it a stacking context and
          the grid, painted after the section, would otherwise go over it. */}
      <div className="sticky top-0 z-10 h-svh overflow-clip">
        <div className="absolute inset-0 cursor-grab select-none active:cursor-grabbing" {...handlers}>
          <Suspense fallback={null}>
            <Ring
              projects={projects}
              position={scrollYProgress}
              opened={opened}
              reduce={reduce}
              running={onScreen && !study}
              onPick={pick}
              onDived={(id) => setStudy(projects.find((p) => p.id === id) ?? null)}
            />
          </Suspense>
        </div>

        <div className="gutter pointer-events-none relative z-10 mx-auto w-full max-w-[1400px] pt-24 [&_a]:pointer-events-auto">
          <Teaser reduce={reduce} />
        </div>

        <Subtitle project={projects[active]} hidden={Boolean(opened)} />

        {/* The keyboard's and the screen reader's way in: one button per case.
            Focusing one brings its case to the front, so a sighted keyboard user
            sees where they are. */}
        <ul className="sr-only">
          {projects.map((project, i) =>
            project.study ? (
              <li key={project.id}>
                <button
                  type="button"
                  onFocus={() => go(i)}
                  onClick={() => setOpened(project.id)}
                >
                  {work.open} {project.title}
                </button>
              </li>
            ) : null,
          )}
        </ul>
      </div>

      <AnimatePresence>
        {study && <Study key={study.id} project={study} onClose={close} />}
      </AnimatePresence>
    </section>
  )
}

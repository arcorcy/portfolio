import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
import { Headline, EASE } from '../lib/motion.jsx'
import { work } from '../data/content.js'
import { projects } from '../data/projects.js'
import Arrow from './Arrow.jsx'
import Placeholder from './Placeholder.jsx'
import Study from './Study.jsx'

/* One colour token per project. Written out as whole class names so Tailwind
   sees them: a template string would generate nothing. */
const MAT = {
  pink: 'bg-mat-pink',
  orange: 'bg-mat-orange',
  blue: 'bg-mat-blue',
  sand: 'bg-mat-sand',
}

// How far a card is pushed back while another one holds the attention.
const DIMMED = 0.1

/* At least 24px between a card and its copy, asked for explicitly, and the
   measurement that counts is against the card's leaning edge rather than its
   bounding box. The copy is up to 244px tall and centred on the card, so a
   7 degree tilt pulls the edge some 15px closer at one end of that block than
   at the middle: the offset has to pay for the tilt as well as the 24px. */
const COPY_GAP = 44
const COPY_WIDTH = 82

/* The copy is anchored past the card's right edge and slides to the left side
   when it needs to. The whole distance is the card, the copy and both gaps, and
   it can be written without measuring anything: the copy is COPY_WIDTH percent
   of the card, so the card is that ratio's inverse in units of the copy. Only
   the two gaps are pixels, which is why the travel ends up as a calc. */
const FLIP_SPAN = 100 + (100 / COPY_WIDTH) * 100

function flipX(t) {
  return `calc(${(-FLIP_SPAN * t).toFixed(3)}% - ${(2 * COPY_GAP * t).toFixed(1)}px)`
}

/* The physics. Nothing here is a real simulation: a spring on the position
   gives the lag and the small overshoot that read as weight, and mapping how
   fast a card is travelling onto a rotation gives the tilt of something being
   carried or thrown. Both are clamped, because a fast flick should lean, not
   spin. */
const GLIDE = { stiffness: 55, damping: 16, mass: 0.9 }
const LEAN = { stiffness: 120, damping: 13, mass: 0.7 }
const THROW = { power: 0.3, timeConstant: 340, bounceStiffness: 170, bounceDamping: 22 }
const SETTLE = { stiffness: 70, damping: 17, mass: 1.1 }
const FLIP = { stiffness: 130, damping: 20, mass: 0.9 }

// Degrees of lean per unit of speed: px/s while dragging, percent/s on scroll.
const DRAG_LEAN = 0.0055
const DRAG_LEAN_MAX = 9
const SCROLL_LEAN = 0.08
const SCROLL_LEAN_MAX = 4

/* How much of a throw a card keeps once it stops. The resting angle is not a
   constant: move a card and it comes to rest a little further left or right
   than it started, the way a real object would. Clamped so a card that gets
   pushed around all afternoon still reads as the same card. */
const KEPT_LEAN = 0.0022
const KEPT_LEAN_MAX = 4.5

function clamp(v, limit) {
  return Math.max(-limit, Math.min(limit, v))
}

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
          <Headline lines={work.title} className="display-lg text-center" shown={shown} />
          {!reduce && <Nudge opacity={nudge} />}
        </a>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------
   The card itself: a cover on a coloured mat, cropped flush at the
   bottom so it reads as a window rather than a framed picture.
   ------------------------------------------------------------------ */
function Cover({ project, index, lifted }) {
  return (
    <div
      /* Two shadows, and the gap between them is the point: just enough at rest
         to tell which card is over which, then a real lift under the one being
         pointed at. Both alpha and blur roughly double on hover, so the change
         reads as the card coming up rather than as the shadow getting darker. */
      className={`h-full w-full overflow-hidden rounded-shot px-[6%] pt-[6%] transition-shadow duration-500 ${
        MAT[project.mat]
      } ${
        lifted
          ? 'shadow-[0_20px_48px_-24px_rgba(1,1,2,0.22)]'
          : 'shadow-[0_8px_22px_-14px_rgba(1,1,2,0.1)]'
      }`}
    >
      <div className="h-full w-full overflow-hidden rounded-t-[10px] bg-white">
        {project.cover ? (
          <img
            src={project.cover}
            alt={project.title}
            className="h-full w-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <Placeholder seed={index} className="h-full w-full" />
        )}
      </div>
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
   One scattered card. Four nested layers, each the single owner of its
   transform: the drag, the scroll drift, the idle float, then the hover
   state. Sharing a layer is what makes these fight each other.

   The copy is a child of the drag layer and sits just beside the card, so
   it travels with it and the link between the two is never in doubt. It
   stays outside the drift, float and hover layers: text that bobs and
   scales is text nobody reads.
   ------------------------------------------------------------------ */
function Card({ project, index, field, progress, active, dim, onEnter, onLeave, onOpen, reduce }) {
  const ref = useRef(null)
  /* The innermost layer is the one to measure: the drag layer's box is the
     card's untransformed footprint, while the rotation and the drift live on
     children, so only this rect is what the eye actually sees. */
  const visual = useRef(null)
  // A drag ends in a click too. Framer only fires onDragStart past its
  // threshold, so this stays false for a plain press.
  const dragged = useRef(false)
  const geometry = useRef(null)
  const settled = useRef(project.x <= 50 ? 'right' : 'left')
  /* A card being dragged has to sit above every other one. Hover alone was not
     enough: move fast and the pointer leaves the card, which drops it back into
     the pile mid-throw. */
  const [held, setHeld] = useState(false)

  /* The drag writes into these rather than into values Framer keeps to itself,
     which is what lets the lean below read how fast the card is moving. */
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)

  /* Percentages, not pixels: a percentage translation resolves against the
     card's own height, so the drift and the float both stay in proportion at
     any stage size. That is what keeps a card inside the section on a small
     laptop, where a fixed pixel travel would be half again as large.

     Kept numeric all the way through the spring, because velocity cannot be
     read off a value that is already a string, and only turned into a
     percentage at the last step. */
  const driftTo = useTransform(progress, [0, 1], [project.drift, -project.drift])
  const drifting = useSpring(driftTo, GLIDE)
  const drift = useTransform(drifting, (v) => `${v}%`)

  const carried = useSpring(
    useTransform(useVelocity(dragX), (v) => clamp(v * DRAG_LEAN, DRAG_LEAN_MAX)),
    LEAN,
  )
  const scrolled = useTransform(useVelocity(drifting), (v) =>
    clamp(v * SCROLL_LEAN, SCROLL_LEAN_MAX),
  )
  /* What the card keeps of the last throw, on top of its starting angle. The
     target is tracked separately because a spring reports where it currently
     is, not where it is heading, and clamping against a value still in flight
     would let a card thrown again mid-settle drift past the limit. */
  const kept = useSpring(0, SETTLE)
  const keptTo = useRef(0)
  const lean = useTransform([carried, scrolled, kept], ([a, b, c]) => a + b + c)

  /* The side the copy sits on is a spring between two ends rather than a piece
     of state, so the swap slides instead of jumping and no render happens while
     a card is being dragged across the middle. */
  const flip = useSpring(settled.current === 'right' ? 0 : 1, FLIP)
  const copyX = useTransform(flip, flipX)
  // A dip through the middle of the crossing, where the copy passes the card.
  const crossing = useTransform(flip, [0, 0.5, 1], [1, 0.45, 1])

  /* Which side the copy sits on is decided against the middle of the field, and
     rechecked while the card is dragged: carry a left card over to the right and
     its copy moves round rather than running off the edge. Measured once per
     drag, not once per frame. */
  function onDragStart() {
    setHeld(true)
    dragged.current = true
    if (!ref.current || !field.current) return
    const card = ref.current.getBoundingClientRect()
    const box = field.current.getBoundingClientRect()
    geometry.current = { centre: card.left + card.width / 2, middle: box.left + box.width / 2 }
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

  function onDragEnd(_, info) {
    keptTo.current = clamp(keptTo.current + info.velocity.x * KEPT_LEAN, KEPT_LEAN_MAX)
    kept.set(keptTo.current)
  }

  /* The card keeps gliding after it is released, and onDrag has stopped firing
     by then, so a card thrown across the middle would keep the copy on its old
     side. Measured again once the glide has settled. */
  function onDragTransitionEnd() {
    setHeld(false)
    if (!ref.current || !field.current) return
    const card = ref.current.getBoundingClientRect()
    const box = field.current.getBoundingClientRect()
    pick(card.left + card.width / 2 <= box.left + box.width / 2 ? 'right' : 'left')
  }

  return (
    <motion.div
      ref={ref}
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        left: `${project.x}%`,
        top: `${project.y}%`,
        width: `${project.size}%`,
        /* The data places a card by its centre, so it gives half of itself
           back. Margin percentages both resolve against the containing
           block's width, which is the stage: half the width is size/2, and
           half the height is size/2 divided by the 17/10 ratio. */
        marginLeft: `${-project.size / 2}%`,
        marginTop: `${-project.size / 3.4}%`,
        zIndex: held ? 50 : active ? 40 : 10 + index,
        x: dragX,
        y: dragY,
      }}
      /* dragConstraints on the field is the guarantee, momentum included: throw a
         card and it carries, then settles back inside rather than being lost off
         screen. The field is not the card's containing block, which is the stage,
         and does not need to be: Framer measures the page box of whatever ref it
         is given and compares it with the card's own. */
      drag={!reduce}
      dragConstraints={field}
      dragElastic={0.16}
      dragMomentum={!reduce}
      dragTransition={THROW}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onDragTransitionEnd={onDragTransitionEnd}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false
          return
        }
        if (project.study && visual.current) onOpen(project, visual.current.getBoundingClientRect())
      }}
      data-cursor={project.study ? 'link' : 'hover'}
    >
      {/* Position and lean share this layer: they are different properties, so
          neither overwrites the other, and both belong to the same idea of the
          card having weight. */}
      <motion.div style={reduce ? undefined : { y: drift, rotate: lean }}>
        <motion.div
          animate={
            reduce
              ? undefined
              : { y: ['0%', '-4%', '0%'], rotate: [0, project.rot > 0 ? 1.2 : -1.2, 0] }
          }
          transition={{ duration: 9 + index * 1.7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            ref={visual}
            className="aspect-[17/10]"
            initial={false}
            animate={{
              rotate: project.rot,
              scale: active ? 1.04 : 1,
              opacity: dim ? DIMMED : 1,
            }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <Cover project={project} index={index} lifted={active} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* One anchor, just past the card's right edge, and a single translation
          that carries the copy round to the left when the card crosses the
          middle. Two competing anchors could not be animated between. */}
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
    </motion.div>
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
              className="aspect-[17/10]"
              onClick={(e) => {
                if (project.study) onOpen(project, e.currentTarget.getBoundingClientRect())
              }}
            >
              <Cover project={project} index={i} lifted={i === at} />
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
  // Where the cards live, and how far they may go. Two different boxes.
  const stage = useRef(null)
  const field = useRef(null)
  const [hovered, setHovered] = useState(null)
  // The rect the surface grows from is captured at the click, not recomputed:
  // it is where the card was when it was pressed.
  const [study, setStudy] = useState(null)

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

  return (
    <section
      id="work"
      ref={section}
      /* The gap before the dark section lives on the Mesh wrapper, not here: the
         grid has to cover it, and a margin would fall outside the wrapper.

         overflow-x-clip, not hidden: a card may be pulled past the field by
         dragElastic, and clip stops that from ever reaching the document as a
         horizontal scrollbar without turning the section into a scroll container,
         which hidden would do. relative, because the field hangs off this box. */
      className="gutter relative flex min-h-svh flex-col justify-center overflow-x-clip py-24 lg:py-16"
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
              progress={scrollYProgress}
              active={hovered === project.id}
              dim={hovered !== null && hovered !== project.id}
              onEnter={() => setHovered(project.id)}
              onLeave={() => setHovered(null)}
              onOpen={open}
              reduce={reduce}
            />
          ))}
        </div>
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
            mat={MAT[study.project.mat]}
            from={study.from}
            onClose={() => setStudy(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

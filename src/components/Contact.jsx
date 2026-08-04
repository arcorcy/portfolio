import { useRef } from 'react'
import { motion, useReducedMotion, useScroll } from 'framer-motion'
import { ScrollWords, Magnetic, EASE } from '../lib/motion.jsx'
import { contact, profile } from '../data/content.js'

const OUTLINE =
  'inline-flex items-center rounded-full border border-white/25 px-7 py-4 text-sm font-bold text-white transition-colors duration-300 hover:border-white hover:bg-white/5'

/* Lime light behind the heading, and light is the point: it peaks at 13% and has
   dissolved long before it reaches an edge, so it never becomes a shape. That is
   why it is not a fifth place the accent turns up, and why it sits behind the
   email button rather than anywhere else, where it reads as that one button being
   lit rather than as a colour of its own.

   The token and not a literal, through color-mix: the lime has one definition. */
const HALO =
  'radial-gradient(closest-side, color-mix(in srgb, var(--color-lime) 13%, transparent), transparent 72%)'

/* A slow breath, on the same easeInOut the Work cards float with: EASE is the
   easing for something arriving somewhere, and nothing here ever arrives. Eleven
   seconds is long enough that the halo never appears to move while it is read. */
const BREATH = { duration: 11, repeat: Infinity, ease: 'easeInOut' }

/* The words are lit by the footer's own arrival: from its top edge at 90% of the
   screen to its top edge at 10%, which is 0.8 of a screen of travel and all of
   it reachable, since the footer is the last screen and scrolling it in is the
   end of the page. LIT stops the light a little short of that so the sentence is
   whole before the scroll runs out.

   Driven from here rather than by ScrollWords' own useScroll, because that is
   what the two sections already lighting words this way do, and it is the path
   with mileage on it.

   The arithmetic, since the footer is the last screen and running out of scroll
   would leave the sentence half lit: the footer is one screen tall and its own
   document top is therefore the last scroll position, so progress reaches 1 with
   90px of scrolling still to spare, and the last word finishes at 0.85 of that,
   198px before the end. It only gets safer on a shorter viewport, where the
   footer is taller than a screen and the whole travel arrives sooner. */
const LIT = [0, 0.85]

export default function Contact() {
  const reduce = useReducedMotion()
  const footer = useRef(null)
  const { scrollYProgress } = useScroll({
    target: footer,
    offset: ['start 0.9', 'start 0.1'],
  })

  return (
    /* One screen, and the legal line inside it rather than after it, so the
       footer is exactly a screen tall and not a screen plus a strip.

       The pitch is centred inside a flex-1 child rather than by justify-center on
       the footer itself: that is the trap Work and Experience both fell into, a
       growing child consuming the free space before justify-content has anything
       left to distribute. Centring inside the child that grows cannot go wrong. */
    <footer
      id="contact"
      ref={footer}
      className="gutter flex min-h-svh flex-col bg-ink text-white"
    >
      <div className="relative flex flex-1 flex-col items-center justify-center py-24 text-center">
        {/* The halo carries its own clip, in a box beside the heading rather than
            around it. An overflow on any ancestor of the heading is read by
            useScroll as the scroll container the heading lives in, and a
            container that never scrolls leaves the word progress at zero for
            good: measured, the whole reveal stayed at 0.16 with the clip on the
            footer. So the clip goes where it cannot be mistaken for one. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
          <motion.div
            className="absolute left-1/2 top-1/2 aspect-square w-[44rem] max-w-full"
            style={{ background: HALO, x: '-50%', y: '-50%' }}
            animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
            transition={BREATH}
          />
        </div>

        {/* Word by word on the scroll rather than a mask on arrival, the way the
            other dark section reads. It also means the wrapping these two long
            sentences do on a laptop costs nothing: with no mask there is no band
            for a wrapped word to be seen on early. */}
        <ScrollWords
          as="h2"
          lines={contact.lead}
          progress={scrollYProgress}
          range={LIT}
          className="display-lg relative z-10 mx-auto max-w-[18em]"
        />

        <div className="relative z-10 mt-14 flex flex-wrap items-center justify-center gap-3">
          <Magnetic strength={0.2}>
            <a
              href={`mailto:${profile.email}`}
              data-cursor="link"
              className="inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03]"
            >
              {profile.email}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M3 11L11 3M11 3H5M11 3V9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </Magnetic>

          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            className={OUTLINE}
          >
            LinkedIn
          </a>
        </div>
      </div>

      {/* The legal line, and nothing else. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 border-t border-white/10 py-6 text-[11px] font-semibold text-white/40">
        <span>
          ©{profile.year} {profile.name}
        </span>
        <motion.a
          href="#top"
          data-cursor="link"
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="link-swipe text-white"
        >
          Back to top
        </motion.a>
      </div>
    </footer>
  )
}

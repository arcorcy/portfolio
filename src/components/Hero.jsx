import { Fragment } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE, HIDDEN_Y } from '../lib/motion.jsx'
import { hero } from '../data/content.js'
import profileImg from '../img/profil.jpg'

/* The lime block gets its height from the line height, not from padding on the
   span: the height is then the line box itself, so stacked blocks meet without a
   seam and a single one can never be taller than its line. 1.3 also spaces the
   lines the way the mock does. */
const CLAIM_LEADING = 'leading-[1.3]'

/* A line, which is only a line: no clipping here.

   The mask is per word, not per line. A mask on the line only holds while the
   line holds exactly one visual line, and the claim now wraps on a phone: its
   first words would park inside their own line's box, right on top of the words
   below, and be read before their turn. A word cannot wrap, so a mask on the
   word survives any wrap without knowing where it happens. */
function Line({ children, className = '' }) {
  return <span className={`block ${className}`}>{children}</span>
}

/* The window a word rises through.

   clip-path rather than overflow: overflow on an inline-block moves its baseline
   to the bottom margin edge, which would lift every word off the strut and take
   the line's spacing with it. The clip does the same job and leaves layout
   alone, which also means it can open as wide as it likes.

   0.22em under the box for the descenders, which fall 0.255em below a baseline
   that sits 0.14em inside the box. 1.5em over it because the portrait stands
   taller than the line it sits on, and the old mask was cutting its crown. */
const CLIP = 'inset(-1.5em -0.25em -0.22em -0.25em)'

function Word({ children, delay, reduce, className = '' }) {
  return (
    <span className="inline-block" style={{ clipPath: CLIP }}>
      <motion.span
        className={`inline-block whitespace-pre ${className}`}
        initial={{ y: reduce ? 0 : HIDDEN_Y, opacity: reduce ? 0 : 1 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: 1, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/* The lime rides on each word rather than on the run as a whole, so a wrapped
   accent puts a block behind each of its lines instead of one rectangle with
   empty corners.

   The spaces stay outside the words, where they collapse at a line break and so
   cannot leave a lime tail hanging past the end of a line. Inside a line they are
   pulled to nothing by word-spacing, which is the only thing that can close the
   seam: the side padding cannot, since padding sits inside the box while the space
   is the distance between two boxes, measured at 0.164em here. Anything past
   -0.164em lands on the same result, the advance of a space being clamped at zero,
   so the value only has to clear the measurement.

   The known cost: the words end up 0.28em apart on their own padding instead of
   the 0.164em they had as a single run. Closing that would mean halving the
   padding, and the block would lose the 0.14em it sits past the first and last
   glyph, which is the more visible of the two.

   Side padding in em, so it holds its proportion at every step of the size. */
function Accent({ reduce }) {
  return (
    <span className="[word-spacing:-0.2em]">
      {hero.claim.accent.split(' ').map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <Word delay={0.52 + i * 0.06} reduce={reduce} className="bg-lime px-[0.14em] text-ink">
            {word}
          </Word>
        </Fragment>
      ))}
    </span>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const greeting = hero.greeting.split(' ')

  return (
    <section id="top" className="gutter relative flex min-h-svh flex-col justify-center py-28">
      {/* No 1400px cap here, unlike the other sections: that cap is what made the
          claim wrap on a wide screen, since the column stopped growing while the
          type carried on. */}
      {/* @container so the type can be sized off the column rather than off the
          viewport: below lg the size is the measure divided by the greeting's own
          width, and cqw is the one unit that already has the gutter and any
          scrollbar taken out of it. Its own width does not depend on the type. */}
      <div className="@container relative z-10 w-full">
        <h1 className="display-xl">
          <Line>
            {greeting.map((word, i) => (
              <Word key={i} delay={0.25 + i * 0.06} reduce={reduce}>
                {word}{' '}
              </Word>
            ))}
            <Word delay={0.25 + greeting.length * 0.06} reduce={reduce}>
              <img
                src={profileImg}
                alt=""
                // In em, like everything else on this line: it is one of the four
                // terms the size divisor is measured from.
                className="ml-[0.1em] inline-block h-[1.2em] w-[1.2em] rounded-full object-cover align-[-0.17em]"
              />
            </Word>
          </Line>

          {/* One declared line at every width, and it wraps where the measure
              says. There is no second copy for a phone any more: the lead used to
              be given a line of its own so the accent could start at the margin,
              which left "I'm an" alone on a line and broke the accent in two. The
              size below lg is set so the wrap falls after "product" instead, so
              the lead keeps company. */}
          <Line className={CLAIM_LEADING}>
            <Word delay={0.45} reduce={reduce}>
              {hero.claim.lead}{' '}
            </Word>
            <Accent reduce={reduce} />
          </Line>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 0.9, ease: EASE }}
          className="ml-auto mt-10 max-w-[26rem] text-right text-[0.9375rem] leading-[1.6] text-ink lg:mt-14"
        >
          {hero.note}
        </motion.p>
      </div>
    </section>
  )
}

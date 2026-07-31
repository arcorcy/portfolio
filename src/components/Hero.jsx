import { motion, useReducedMotion } from 'framer-motion'
import { EASE, HIDDEN_Y, maskStyle } from '../lib/motion.jsx'
import { hero } from '../data/content.js'
import profileImg from '../img/profil.jpg'

/* The lime block gets its height from the line height, not from padding on the
   span. The mask clips to the line box, so a block that fills the line box can
   never be cut, while padding pushed it straight past the clip. 1.3 also spaces
   the two lines the way the mock does. */
const CLAIM_LEADING = 'leading-[1.3]'

/* One masked line. The hero animates on mount rather than on scroll, so it
   drives its own words instead of going through Headline. */
function Line({ children, className = '' }) {
  return (
    <span className={`block overflow-hidden ${className}`} style={maskStyle}>
      {children}
    </span>
  )
}

/* Side padding in em, so the block holds its proportion at every step of the
   clamped display size. No vertical padding: the height comes from the leading. */
function Accent({ reduce }) {
  return (
    <Word delay={0.52} reduce={reduce} className="bg-lime px-[0.14em] text-ink">
      {hero.claim.accent}
    </Word>
  )
}

function Word({ children, delay, reduce, className = '' }) {
  return (
    <motion.span
      className={`inline-block whitespace-pre ${className}`}
      initial={{ y: reduce ? 0 : HIDDEN_Y, opacity: reduce ? 0 : 1 }}
      animate={{ y: '0%', opacity: 1 }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </motion.span>
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
      <div className="relative z-10 w-full">
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
                className="ml-1 inline-block h-[1.2em] w-[1.2em] rounded-full object-cover align-[-0.17em]"
              />
            </Word>
          </Line>

          {/* One line where it fits, two where it does not. Each masked line has
              to hold exactly one visual line: the mask clips to the container, so
              a wrapped line would show its own words before their turn. Only one
              of the two is ever displayed, so nothing is read twice. */}
          <span className="hidden lg:block">
            <Line className={CLAIM_LEADING}>
              <Word delay={0.45} reduce={reduce}>
                {hero.claim.lead}{' '}
              </Word>
              <Accent reduce={reduce} />
            </Line>
          </span>

          <span className="block lg:hidden">
            <Line>
              <Word delay={0.45} reduce={reduce}>
                {hero.claim.lead}
              </Word>
            </Line>
            <Line className={CLAIM_LEADING}>
              <Accent reduce={reduce} />
            </Line>
          </span>
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

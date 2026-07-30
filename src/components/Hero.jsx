import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { Magnetic, EASE } from '../lib/motion.jsx'
import { hero, profile } from '../data/content.js'
import placeholderImg from '../img/placeholder.webp'
import peaceIcon from '../img/peace.svg'

/* The square visual: a rotated, rounded block holding the cover image.
   It is absolutely positioned, so it paints above the following sections
   (which are static). It must therefore stay inside the hero: the size is
   capped by viewport height as well as width, and the scroll drift below is
   small enough that the block can never reach the next section's content. */
function Visual({ x, y, style, className }) {
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y, rotate: 6.05, ...style }}
      className={`overflow-hidden rounded-panel bg-fog ${className}`}
    >
      <img src={placeholderImg} alt="" className="h-full w-full object-cover" draggable={false} />
    </motion.div>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const lift = useTransform(scrollYProgress, [0, 1], [0, -70])
  // Kept small on purpose: a bigger drift pushed the block down into the Work
  // section, where it covered the heading.
  const drift = useTransform(scrollYProgress, [0, 1], [0, 70])

  const mx = useSpring(0, { stiffness: 60, damping: 22 })
  const my = useSpring(0, { stiffness: 60, damping: 22 })

  function onMove(e) {
    if (reduce) return
    const { innerWidth, innerHeight } = window
    mx.set((e.clientX / innerWidth - 0.5) * 40)
    my.set((e.clientY / innerHeight - 0.5) * 28)
  }

  const visualY = useTransform([my, drift], ([a, b]) => (reduce ? 0 : a + b))

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMove}
      className="relative flex min-h-[90svh] items-center px-5 py-28 sm:px-8 lg:px-12"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.div style={{ y: reduce ? 0 : lift }} className="relative z-10">
          <h1 className="display-xl flex flex-wrap items-center gap-x-3">
            <span className="overflow-hidden">
              {profile.name.split(' ').map((word, i) => (
                <motion.span
                  key={word}
                  className="inline-block whitespace-pre"
                  initial={{ y: reduce ? 0 : '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1, delay: 0.25 + i * 0.06, ease: EASE }}
                >
                  {word}{' '}
                </motion.span>
              ))}
            </span>
            <motion.img
              src={peaceIcon}
              alt=""
              className="h-[0.68em] w-[0.68em] shrink-0"
              initial={{ opacity: 0, rotate: -18 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.7, ease: EASE }}
            className="mt-10 max-w-[42rem] text-[1.125rem] leading-[1.67] text-mute lg:mt-14"
          >
            {hero.lead}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-8 flex"
          >
            <Magnetic strength={0.22}>
              <a
                href={hero.cta.href}
                data-cursor="link"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white transition-colors duration-300 hover:bg-forest"
              >
                {hero.cta.label}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
          </motion.div>
        </motion.div>

        {/* mobile / tablet: the visual sits in the flow */}
        <Visual
          x={0}
          y={0}
          className="mt-16 aspect-square w-full max-w-sm lg:hidden"
        />
      </div>

      {/* desktop: the visual floats to the right, centred and contained.
          The wrapper carries the centring translate so it does not fight the
          transform Framer writes on the block itself. */}
      <div className="pointer-events-none absolute right-[4%] top-1/2 hidden -translate-y-1/2 lg:block">
        <Visual
          x={reduce ? 0 : mx}
          y={visualY}
          style={{ width: 'min(38vw, 520px, 56svh)' }}
          className="aspect-square"
        />
      </div>
    </section>
  )
}

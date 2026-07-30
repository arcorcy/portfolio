import { motion, useReducedMotion } from 'framer-motion'
import { Headline, ScrollWords, EASE } from '../lib/motion.jsx'
import { process } from '../data/content.js'
import artAI from '../img/AI.png'
import artFIG from '../img/FIG.png'
import artTST from '../img/TST.png'
import artPLG from '../img/PLG.png'
import artPiece from '../img/Vector.png'

const ART = { AI: artAI, FIG: artFIG, TST: artTST, PLG: artPLG }

/* PLG was exported as an empty frame, with the puzzle piece in Vector.png.
   Layering them beats flattening: the piece can drift inside its own frame. */
function Art({ icon, reduce }) {
  if (icon !== 'PLG') {
    return <img src={ART[icon]} alt="" className="h-full w-full object-contain" draggable={false} />
  }

  return (
    <div className="relative h-full w-full">
      <img src={artPLG} alt="" className="h-full w-full object-contain" draggable={false} />
      <motion.img
        src={artPiece}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2"
        animate={reduce ? undefined : { rotate: [-6, 8, -6] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* Three nested layers so the transforms never fight: position, then the
   one-shot entrance, then the endless drift. */
function Mark({ mark, i, reduce }) {
  return (
    <div
      aria-hidden="true"
      style={{ left: `${mark.left}%`, top: `${mark.top}%`, width: mark.size }}
      className="pointer-events-none absolute hidden aspect-square select-none lg:block"
    >
      <motion.div
        className="h-full w-full"
        initial={{ opacity: 0, scale: 0.84, rotate: mark.rot - 12 }}
        whileInView={{ opacity: 1, scale: 1, rotate: mark.rot }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
      >
        <motion.div
          className="h-full w-full"
          animate={reduce ? undefined : { y: [0, -14, 0], rotate: [0, 2.2, 0] }}
          transition={{ duration: 9 + i * 1.7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Art icon={mark.icon} reduce={reduce} />
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function Process() {
  const reduce = useReducedMotion()

  return (
    <section id="process" className="bg-ink text-white">
      <div className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-12">
        <Headline lines={process.title} className="display-lg mx-auto max-w-[1400px] text-center" />
      </div>

      {/* One paragraph per screenful, alternating sides. The generous height is
          what gives the word-by-word reveal room to breathe, and it leaves the
          opposite half free for an illustration. */}
      <div className="mx-auto w-full max-w-[1400px] px-5 pb-24 sm:px-8 sm:pb-32 lg:px-12">
        {process.paragraphs.map((text, i) => (
          <div
            key={i}
            className={`relative flex py-16 lg:min-h-[78svh] lg:items-center lg:py-0 ${
              i % 2 === 0 ? 'justify-start' : 'lg:justify-end'
            }`}
          >
            <ScrollWords text={text} className="display-sm max-w-[50rem] text-dim" />
            {process.marks[i] && <Mark mark={process.marks[i]} i={i} reduce={reduce} />}
          </div>
        ))}
      </div>
    </section>
  )
}

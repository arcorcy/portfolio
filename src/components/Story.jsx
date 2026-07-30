import { motion } from 'framer-motion'
import { Headline, Reveal, EASE } from '../lib/motion.jsx'
import { story } from '../data/content.js'

function FactCard({ fact }) {
  return (
    <div className="rounded-card bg-white px-6 py-5 shadow-[0_18px_50px_-18px_rgba(1,1,2,0.3)]">
      <p className="text-sm font-bold text-mute">{fact.k}</p>
      <p className="mt-0.5 text-xl font-extrabold tracking-[-0.0175em]">{fact.v}</p>
    </div>
  )
}

export default function Story() {
  return (
    <section id="story" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="mx-auto grid w-full max-w-[1400px] gap-16 lg:grid-cols-2 lg:gap-10">
        <div>
          <Headline lines={story.title} className="display-lg" />
          <div className="mt-12 flex max-w-[44rem] flex-col gap-5 lg:mt-16">
            {story.paragraphs.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p className="text-base leading-[1.63] text-mute">{p}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* desktop: the cards sit dropped on the page and straighten on hover.
            left/top/rot come from the mock. */}
        <div className="relative hidden h-[22rem] lg:block">
          {story.facts.map((fact, i) => (
            <div
              key={fact.k}
              style={{ left: `${fact.left}%`, top: `${fact.top}%` }}
              className="absolute"
            >
              <Reveal delay={0.15 + i * 0.1}>
                <motion.div
                  data-cursor="hover"
                  initial={{ rotate: fact.rot }}
                  whileHover={{ rotate: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <FactCard fact={fact} />
                </motion.div>
              </Reveal>
            </div>
          ))}
        </div>

        {/* mobile / tablet: in the flow */}
        <div className="flex flex-wrap gap-4 lg:hidden">
          {story.facts.map((fact) => (
            <FactCard key={fact.k} fact={fact} />
          ))}
        </div>
      </div>
    </section>
  )
}

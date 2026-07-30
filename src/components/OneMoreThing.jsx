import { Headline, Reveal } from '../lib/motion.jsx'
import { oneMore } from '../data/content.js'

export default function OneMoreThing() {
  return (
    <section className="px-5 pb-24 sm:px-8 sm:pb-32 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <Headline lines={oneMore.title} className="display-lg" />

        <Reveal delay={0.1}>
          {/* Deliberate empty slot. The hairline and radius are ours: they keep
              the block reading as a reserved space rather than a broken render. */}
          <div className="mt-12 flex min-h-[17rem] items-center justify-center rounded-card border border-line bg-white px-8 py-24 lg:mt-16">
            <p className="text-center text-xs font-extrabold tracking-[0.1em] text-mute">
              {oneMore.placeholder}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { Headline, Magnetic, EASE } from '../lib/motion.jsx'
import { contact, profile } from '../data/content.js'

const OUTLINE =
  'inline-flex items-center rounded-full border border-white/25 px-7 py-4 text-sm font-bold text-white transition-colors duration-300 hover:border-white hover:bg-white/5'

export default function Contact() {
  return (
    /* One screen, and the legal line inside it rather than after it, so the
       footer is exactly a screen tall and not a screen plus a strip.

       The pitch is centred inside a flex-1 child rather than by justify-center on
       the footer itself: that is the trap Work and Experience both fell into, a
       growing child consuming the free space before justify-content has anything
       left to distribute. Centring inside the child that grows cannot go wrong. */
    <footer id="contact" className="gutter flex min-h-svh flex-col bg-ink text-white">
      <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        {/* clip="word" because these two lines are long enough to wrap on a
            laptop, not only on a phone: the line mask would then show a wrapped
            word on the next line's band before its turn. */}
        <Headline
          lines={contact.lead}
          clip="word"
          className="display-lg mx-auto max-w-[18em] text-balance"
        />

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
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
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 border-t border-white/10 py-6 text-[11px] font-semibold text-white/40">
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

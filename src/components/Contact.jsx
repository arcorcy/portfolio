import { useState } from 'react'
import { motion } from 'framer-motion'
import { Magnetic, EASE } from '../lib/motion.jsx'
import { contact, profile } from '../data/content.js'

const OUTLINE =
  'inline-flex items-center rounded-full border border-white/25 px-6 py-4 text-sm font-bold text-white transition-colors duration-300 hover:border-white hover:bg-white/5'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <footer id="contact" className="bg-ink px-5 text-white sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-8 py-10 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-base leading-[1.63] text-white/60">
            {contact.lead.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>

          <div className="flex flex-wrap items-center gap-3">
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

            <button type="button" onClick={copyEmail} data-cursor="link" className={OUTLINE}>
              <motion.span key={copied ? 'y' : 'n'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {copied ? 'Copied' : 'Copy address'}
              </motion.span>
            </button>

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

        {/* the name, set large and nearly invisible */}
        <div className="border-t border-white/10 py-6" aria-hidden="true">
          <p
            className="font-semibold leading-none tracking-[-0.05em] text-white/10"
            style={{ fontSize: 'clamp(2.5rem, 5.5vw, 5rem)' }}
          >
            {profile.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-10 text-[11px] font-semibold text-white/40">
          <span>
            ©{profile.year} {profile.name}
          </span>
          <span>
            {profile.role} · {profile.location}
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
      </div>
    </footer>
  )
}

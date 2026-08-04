import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Headline, Magnetic, EASE } from '../lib/motion.jsx'
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

// How long the button admits to having copied before going back to the address.
const HELD = 1800

/* The old way, for when the clipboard API is there but says no: it answers
   NotAllowedError under a handful of permission and focus policies, and the
   button would otherwise do nothing at all when it does. Deprecated, and still
   the thing that works in those cases.

   readonly so a phone does not throw its keyboard up on the way past, and
   setSelectionRange as well as select() because iOS ignores the latter on its
   own. Focus goes back to where it was, or the press would move it into a
   textarea that is about to be removed. */
function legacyCopy(text) {
  const held = document.activeElement
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.cssText = 'position:fixed;top:-1000px;opacity:0'
  document.body.appendChild(area)
  area.select()
  area.setSelectionRange(0, text.length)

  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }

  area.remove()
  if (held instanceof HTMLElement) held.focus()
  return ok
}

function Copy() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 4.5V3A1.5 1.5 0 0 0 8 1.5H3A1.5 1.5 0 0 0 1.5 3v5A1.5 1.5 0 0 0 3 9.5h1.5" />
      <rect x="4.5" y="4.5" width="8" height="8" rx="1.5" />
    </svg>
  )
}

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
    </svg>
  )
}

/* One of the two button labels, both laid in the same grid cell so the hidden one
   still pays for its width. `decorative` is the confirmation, which is a visual
   only: the button keeps the address as its accessible name whatever it is
   showing, and the copy is announced by the live region instead, so the name
   never changes under someone who is reading it. */
function Label({ shown, decorative = false, children }) {
  return (
    <motion.span
      aria-hidden={decorative || undefined}
      className="col-start-1 row-start-1 flex items-center justify-center gap-2 whitespace-nowrap"
      animate={{ opacity: shown ? 1 : 0 }}
      initial={false}
      transition={{ duration: 0.2, ease: EASE }}
    >
      {children}
    </motion.span>
  )
}

export default function Contact() {
  const reduce = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  // Cleared on unmount, so the timeout cannot land on a component that is gone.
  useEffect(() => () => clearTimeout(timer.current), [])

  /* No mailto behind this: the address goes to the clipboard and the button says
     so. Two ways of getting it there, and the confirmation is shown only if one
     of them reports success, because a button that says Copied over an empty
     clipboard is worse than one that appears to do nothing. If both fail, what
     the button is already showing is the address itself, there to be read. */
  async function copy() {
    let ok = false

    try {
      await navigator.clipboard.writeText(profile.email)
      ok = true
    } catch {
      ok = legacyCopy(profile.email)
    }

    if (!ok) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), HELD)
  }

  return (
    /* One screen, and the legal line inside it rather than after it, so the
       footer is exactly a screen tall and not a screen plus a strip.

       The pitch is centred inside a flex-1 child rather than by justify-center on
       the footer itself: that is the trap Work and Experience both fell into, a
       growing child consuming the free space before justify-content has anything
       left to distribute. Centring inside the child that grows cannot go wrong. */
    <footer id="contact" className="gutter flex min-h-svh flex-col bg-ink text-white">
      <div className="relative flex flex-1 flex-col items-center justify-center py-24 text-center">
        {/* The halo carries its own clip, in a box beside the heading rather than
            around it. An overflow around the heading would clip the words waiting
            below their mask, and an element clipped out by an ancestor reports no
            intersection: Headline watches the heading for exactly that reason, and
            a title that never reports entering view never reveals itself. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
          <motion.div
            className="absolute left-1/2 top-1/2 aspect-square w-[44rem] max-w-full"
            style={{ background: HALO, x: '-50%', y: '-50%' }}
            animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
            transition={BREATH}
          />
        </div>

        {/* The same mask reveal as every other section title. clip="word" because
            these two sentences wrap on a laptop and not only on a phone: the line
            mask cuts at the container, so a wrapped word would sit on the next
            line's band and be seen before its turn.

            No exit here, unlike the other titles: this section is the last screen
            and its end is the end of the document, so a title that left as the
            section did would take the whole point of the page with it. */}
        <Headline
          lines={contact.lead}
          clip="word"
          className="display-lg relative z-10 mx-auto max-w-[18em]"
        />

        <div className="relative z-10 mt-14 flex flex-wrap items-center justify-center gap-3">
          <Magnetic strength={0.2}>
            <button
              type="button"
              onClick={copy}
              data-cursor="link"
              className="inline-flex items-center rounded-full bg-lime px-7 py-4 text-sm font-bold text-ink transition-transform duration-300 hover:scale-[1.03]"
            >
              {/* Both labels share one grid cell, so the button is always as wide
                  as the wider of them and swapping them cannot shove LinkedIn
                  sideways. Only opacity moves. */}
              <span className="grid">
                <Label shown={!copied}>
                  {profile.email}
                  <Copy />
                </Label>
                <Label shown={copied} decorative>
                  {contact.copied}
                  <Check />
                </Label>
              </span>
            </button>
          </Magnetic>

          {/* Out of flow, so it costs no layout: the only thing that tells a
              screen reader the press did anything. */}
          <span role="status" className="sr-only">
            {copied ? contact.copied : ''}
          </span>

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

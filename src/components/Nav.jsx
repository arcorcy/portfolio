import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { nav } from '../data/content.js'
import profileImg from '../img/profil.jpg'

/* The pill, shared by the bar, the compact trigger and the contact shortcut, so
   the three read as one object cut into pieces. */
const PILL =
  'flex items-center gap-1 rounded-full bg-ink/95 p-1.5 shadow-[0_10px_34px_rgba(1,1,2,0.24)] backdrop-blur-md'

const ITEM =
  'relative rounded-full px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 sm:px-4'

function Chevron({ open }) {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="mr-1 shrink-0"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <path
        d="M3.5 5.5L7 9l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  )
}

function Photo({ className = '' }) {
  return (
    <a href="#top" aria-label="Back to top" data-cursor="link" className="shrink-0">
      <img src={profileImg} alt="" className={`h-8 w-8 rounded-full object-cover ${className}`} />
    </a>
  )
}

export default function Nav() {
  // The hero has no nav entry, so the first item stays lit until you reach
  // the next section. Avoids an empty state at the top of the page.
  const [active, setActive] = useState(nav[0].id)
  const [open, setOpen] = useState(false)
  const menu = useRef(null)
  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  useEffect(() => {
    const sections = nav.map((i) => document.getElementById(i.id)).filter(Boolean)

    function onScroll() {
      const line = window.scrollY + window.innerHeight * 0.32
      let current = nav[0].id
      for (const section of sections) {
        if (section.offsetTop <= line) current = section.id
      }
      // Contact is the last, short section: snap to it at the very bottom.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
        current = nav[nav.length - 1].id
      }
      setActive(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // The menu closes on a pick, on Escape, and on anything outside it.
  useEffect(() => {
    if (!open) return undefined

    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onDown(e) {
      if (menu.current && !menu.current.contains(e.target)) setOpen(false)
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const current = nav.find((i) => i.id === active) ?? nav[0]
  const contact = nav[nav.length - 1]

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[60] h-[2px] w-full origin-left bg-lime"
        style={{ scaleX: bar }}
      />

      <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto flex items-start gap-2"
        >
          {/* The full bar. Measured, not guessed: with the current labels it
              needs 596px including the photo and wraps below that, so it steps
              aside at 768 and keeps real headroom for a longer label. */}
          <nav className={`hidden md:flex ${PILL}`}>
            <Photo className="ml-1 mr-2" />
            {nav.map((item) => {
              const on = active === item.id
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  data-cursor="link"
                  className={`${ITEM} ${on ? 'text-ink' : 'text-white/70 hover:text-white'}`}
                >
                  {on && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-lime"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              )
            })}
          </nav>

          {/* The compact bar: the photo, where you are, and a way elsewhere. */}
          <div ref={menu} className="relative md:hidden">
            <div className={PILL}>
              <Photo className="ml-1 mr-1" />
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={`Current section: ${current.label}. Choose a section`}
                data-cursor="link"
                className={`${ITEM} flex items-center gap-2 text-white`}
              >
                <span>{current.label}</span>
                <Chevron open={open} />
              </button>
            </div>

            {open && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-full mt-2 w-[13rem] origin-top rounded-[1.4rem] bg-ink/95 p-1.5 shadow-[0_10px_34px_rgba(1,1,2,0.24)] backdrop-blur-md"
              >
                {nav.map((item) => {
                  const on = active === item.id
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      data-cursor="link"
                      className={`block rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors duration-200 ${
                        on ? 'bg-lime text-ink' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </a>
                  )
                })}
              </motion.div>
            )}
          </div>

          {/* Contact, its own pill so it survives the bar collapsing. */}
          <a href={`#${contact.id}`} data-cursor="link" className={`${PILL} md:hidden`}>
            <span
              className={`${ITEM} ${
                active === contact.id ? 'bg-lime text-ink' : 'text-white/70 hover:text-white'
              }`}
            >
              {contact.label}
            </span>
          </a>
        </motion.div>
      </header>
    </>
  )
}

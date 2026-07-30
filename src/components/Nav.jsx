import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { nav } from '../data/content.js'
import profileImg from '../img/profil.jpg'

export default function Nav() {
  // The hero has no nav entry, so the first item stays lit until you reach
  // the next section. Avoids an empty state at the top of the page.
  const [active, setActive] = useState(nav[0].id)
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

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[60] h-[2px] w-full origin-left bg-lime"
        style={{ scaleX: bar }}
      />

      <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <motion.nav
          initial={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink/95 p-1.5 shadow-[0_10px_34px_rgba(1,1,2,0.24)] backdrop-blur-md"
        >
          <a href="#top" aria-label="Back to top" className="shrink-0">
            <img
              src={profileImg}
              alt=""
              className="ml-1 mr-2 hidden h-8 w-8 rounded-full object-cover sm:block"
            />
          </a>
          {nav.map((item) => {
            const on = active === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                data-cursor="link"
                className={`relative rounded-full px-3 py-2 text-[13px] font-semibold transition-colors duration-200 sm:px-4 ${
                  on ? 'text-ink' : 'text-white/70 hover:text-white'
                }`}
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
        </motion.nav>
      </header>
    </>
  )
}

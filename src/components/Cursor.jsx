import { useEffect, useState } from 'react'
import { motion, useSpring, useReducedMotion } from 'framer-motion'

/**
 * Custom cursor. Inverts whatever is underneath, swells on anything
 * marked with data-cursor, and can show a short label via
 * data-cursor-label="View".
 */
export default function Cursor() {
  const reduce = useReducedMotion()
  const [mode, setMode] = useState('idle')
  const [label, setLabel] = useState('')
  const [visible, setVisible] = useState(false)
  const [touch, setTouch] = useState(false)

  const x = useSpring(0, { stiffness: 700, damping: 40, mass: 0.35 })
  const y = useSpring(0, { stiffness: 700, damping: 40, mass: 0.35 })

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setTouch(true)
      return
    }

    function onMove(e) {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)

      const target = e.target.closest('[data-cursor]')
      if (target) {
        setMode(target.getAttribute('data-cursor') || 'hover')
        setLabel(target.getAttribute('data-cursor-label') || '')
      } else {
        setMode('idle')
        setLabel('')
      }
    }

    function onLeave() {
      setVisible(false)
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [x, y])

  if (touch || reduce) return null

  const size = mode === 'idle' ? 14 : label ? 92 : 58

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden mix-blend-difference lg:block"
      style={{ x, y }}
    >
      <motion.div
        className="flex items-center justify-center rounded-full bg-white"
        animate={{
          width: size,
          height: size,
          opacity: visible ? 1 : 0,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        {label && (
          <span className="text-[11px] font-bold text-ink">
            {label}
          </span>
        )}
      </motion.div>
    </motion.div>
  )
}

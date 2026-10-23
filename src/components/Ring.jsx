import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cubicBezier } from 'framer-motion'
import { drawCover, drawDisc, drawSpine } from '../lib/covers.js'
import { matColour } from '../lib/contrast.js'

/* ------------------------------------------------------------------
   The projects as DVD cases flying round a ring, in WebGL.

   Loaded on its own (React.lazy in Work.jsx), so the hero never waits for
   Three.js. The page owns everything that is a decision: which project is in
   front comes from the scroll, which one is open from a click. This file only
   draws them and plays the moves between.
   ------------------------------------------------------------------ */

// The site's one curve (lib/motion.jsx EASE), as a function the frame loop can call.
const ease = cubicBezier(0.16, 1, 0.3, 1)

/* A real case is 135 x 190 x 14 mm. One unit is 10 cm. The front cover and the
   back are two halves of the depth, the cover hinged on the spine. */
const W = 1.35
const H = 1.9
const HALF = 0.07

/* The ring. RADIUS is wide enough for the cases either side of the front one
   to show without crowding it. TILT leans it towards the camera a touch, so the
   ones at the back read as further away and not just smaller. */
const RADIUS = 2.7
const TILT = 0.07
/* How much of the ring's turn a case takes on itself. At 1 each case faced
   straight out of the ring, so the two either side of the front one showed only
   their spines; at half, every case keeps its cover turned towards the camera. */
const FACE = 0.5
const FOV = 35

/* The camera's resting distance: the front case at about 55% of the screen's
   height, and never narrower than SEEN_WIDTH across, which is what keeps a
   phone in portrait from losing the case to its own edges. */
const REST = 5.4
const SEEN_WIDTH = 2.4

/* How fast the ring catches up with the scroll, per second. A spring would
   overshoot past a case; this settles on it. */
const FOLLOW = 7

/* Opening: the cover swings on its hinge first, then the camera dives into the
   inside of the cover, which is the mat's colour, until it fills the screen.
   The study then fades in over exactly that colour. DIVE_FROM is where in the
   move the dive starts. */
export const OPEN_MS = 1400
const CLOSE_MS = 1100
const DIVE_FROM = 0.25
const LID_UNTIL = 0.55
const LID_OPEN = Math.PI * 0.985

const tmp = new THREE.Vector3()
const tmpLook = new THREE.Vector3()

function damp(current, target, rate, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt))
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v))
}

function texture(canvas, gl) {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = gl.capabilities.getMaxAnisotropy()
  return t
}

/* The artwork for every project, drawn once. Until it is ready a case wears its
   plain mat, so nothing waits on a font or a screenshot to appear. */
function useArtwork(projects) {
  const gl = useThree((s) => s.gl)
  const [art, setArt] = useState({})

  useEffect(() => {
    let live = true
    const made = []
    projects.forEach((project) => {
      Promise.all([drawCover(project), drawSpine(project), drawDisc(project)]).then(
        ([cover, spine, disc]) => {
          if (!live) return
          const set = { cover: texture(cover, gl), spine: texture(spine, gl), disc: texture(disc, gl) }
          made.push(set)
          setArt((a) => ({ ...a, [project.id]: set }))
        },
      )
    })
    return () => {
      live = false
      made.forEach((set) => Object.values(set).forEach((t) => t.dispose()))
    }
  }, [projects, gl])

  return art
}

const halfGeometry = new THREE.BoxGeometry(W, H, HALF)
const spineGeometry = new THREE.PlaneGeometry(HALF * 2, H)
const discGeometry = new THREE.CircleGeometry(0.62, 96)

function DvdCase({ project, art, register, onPointer }) {
  const group = useRef(null)
  const lid = useRef(null)

  /* Box faces go +x, -x, +y, -y, +z, -z. The plastic is everything but the
     printed faces; the inside of the cover is unlit, so the colour the camera
     dives into is the mat's exact hex and meets the study's header without a
     seam (lighting and tone mapping would have shifted it). */
  const materials = useMemo(() => {
    const mat = matColour(project.mat)
    const plastic = new THREE.MeshStandardMaterial({ color: '#16161a', roughness: 0.38 })
    const tray = new THREE.MeshStandardMaterial({ color: '#0e0e11', roughness: 0.55 })
    const back = new THREE.MeshStandardMaterial({ color: mat, roughness: 0.6 })
    const front = new THREE.MeshPhysicalMaterial({
      color: art ? '#ffffff' : mat,
      map: art?.cover ?? null,
      roughness: 0.45,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
    })
    const inside = new THREE.MeshBasicMaterial({ color: mat, toneMapped: false })
    const spine = new THREE.MeshStandardMaterial({
      color: art ? '#ffffff' : mat,
      map: art?.spine ?? null,
      roughness: 0.5,
    })
    const disc = new THREE.MeshStandardMaterial({
      map: art?.disc ?? null,
      color: art ? '#ffffff' : '#c9cbd2',
      transparent: true,
      alphaTest: 0.5,
      metalness: 0.35,
      roughness: 0.3,
    })
    return {
      base: [plastic, plastic, plastic, plastic, tray, back],
      lid: [plastic, plastic, plastic, plastic, front, inside],
      spine,
      disc,
    }
  }, [project.mat, art])

  useEffect(
    () => () => {
      new Set([...materials.base, ...materials.lid, materials.spine, materials.disc]).forEach((m) =>
        m.dispose(),
      )
    },
    [materials],
  )

  useEffect(() => register(project.id, { group, lid }), [project.id, register])

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation()
        onPointer(project.id, true)
      }}
      onPointerOut={() => onPointer(project.id, false)}
    >
      <mesh geometry={halfGeometry} material={materials.base} position={[0, 0, -HALF / 2]} />
      <mesh geometry={discGeometry} material={materials.disc} position={[0.02, 0, 0.003]} />
      <mesh
        geometry={spineGeometry}
        material={materials.spine}
        position={[-W / 2 - 0.001, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {/* The hinge sits on the spine edge, so the cover swings open like a book. */}
      <group ref={lid} position={[-W / 2, 0, 0]}>
        <mesh geometry={halfGeometry} material={materials.lid} position={[W / 2, 0, HALF / 2]} />
      </group>
    </group>
  )
}

/* Everything that moves, in one frame loop: the ring following the scroll, the
   cases bobbing, the hovered one easing forward, and the open and close moves. */
function Scene({ projects, position, opened, hovered, reduce, onHover, onPick, onDived }) {
  const art = useArtwork(projects)
  const cases = useRef({})
  const ring = useRef(null)
  const at = useRef(position.get() * Math.max(1, projects.length - 1))
  const lift = useRef({})
  const move = useRef({ id: null, from: 0, to: 0, start: 0, dur: 1, told: true })
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)

  const register = useMemo(
    () => (id, refs) => {
      cases.current[id] = refs
    },
    [],
  )

  /* A change of `opened` starts a move from wherever the last one had got to, so
     a close that interrupts an open runs back from the middle instead of
     jumping to the end first. */
  const progress = useRef(0)
  useEffect(() => {
    const m = move.current
    const id = opened ?? m.id
    if (opened === null && m.id === null) return
    m.id = id
    m.from = progress.current
    m.to = opened === null ? 0 : 1
    m.start = performance.now()
    m.dur = reduce ? 1 : opened === null ? CLOSE_MS : OPEN_MS
    m.told = false
    invalidate()
  }, [opened, reduce, invalidate])

  useFrame((state, dt) => {
    const step = (Math.PI * 2) / projects.length
    const last = Math.max(1, projects.length - 1)
    const target = position.get() * last
    at.current = reduce ? target : damp(at.current, target, FOLLOW, Math.min(dt, 0.1))
    const t = state.clock.elapsedTime

    ring.current.rotation.x = TILT

    // The open or close move under way, if any.
    const m = move.current
    const k = clamp01((performance.now() - m.start) / m.dur)
    const p = m.from + (m.to - m.from) * (reduce ? 1 : ease(k))
    progress.current = p
    if (k >= 1 && !m.told) {
      m.told = true
      if (m.to === 1) onDived(m.id)
      else m.id = null
    }

    projects.forEach((project, i) => {
      const refs = cases.current[project.id]
      if (!refs?.group.current) return
      const g = refs.group.current
      const a = (i - at.current) * step
      const bob = reduce ? 0 : Math.sin(t * 0.8 + i * 1.7) * 0.06
      const l = (lift.current[project.id] = damp(
        lift.current[project.id] ?? 0,
        hovered === project.id && m.id === null ? 1 : 0,
        10,
        dt,
      ))

      g.position.set(
        RADIUS * Math.sin(a),
        bob + l * 0.06,
        RADIUS * Math.cos(a) - RADIUS + l * 0.25,
      )
      g.rotation.set(0, a * FACE, reduce ? 0 : Math.sin(t * 0.6 + i) * 0.025)

      const open = m.id === project.id ? ease(clamp01(p / LID_UNTIL)) : 0
      refs.lid.current.rotation.y = -(LID_OPEN * open + l * 0.16 * (1 - open))
    })

    /* The camera: at rest in front of the ring, far enough back for the case to
       fit the screen whatever its shape; mid-move, on its way into the inside of
       the open cover, aimed through the cover's own transform so the case does
       not have to be squarely in front for the dive to land on it. */
    const aspect = size.width / Math.max(1, size.height)
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const rest = Math.max(REST, SEEN_WIDTH / (2 * tan * aspect))
    const home = tmp.set(0, 0.15, rest)
    const look = tmpLook.set(0, 0, 0)

    const refs = m.id && cases.current[m.id]
    const dive = ease(clamp01((p - DIVE_FROM) / (1 - DIVE_FROM)))
    if (refs?.group.current && p > 0) {
      // Close enough that the cover's inside overflows the screen both ways.
      const near = Math.min((H * 0.86) / (2 * tan), (W * 0.86) / (2 * tan * aspect))
      const g = refs.group.current
      g.updateWorldMatrix(true, false)
      const lidCentre = new THREE.Vector3(-W, 0, 0)
      const into = g.localToWorld(lidCentre.clone().setZ(near))
      const onto = g.localToWorld(lidCentre)
      home.lerp(into, reduce ? (p > 0.5 ? 1 : 0) : dive)
      look.lerp(onto, reduce ? (p > 0.5 ? 1 : 0) : Math.min(1, dive * 1.6))
    }
    camera.position.copy(home)
    camera.lookAt(look)

    // Keep drawing while anything is still settling.
    if (k < 1 || Math.abs(at.current - target) > 0.0005) invalidate()
  })

  return (
    <>
      {/* Balanced so a cover facing the camera comes out at about its own
          colour: with tone mapping off (`flat` on the Canvas), more light than
          that would clip the pale mats to white. */}
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 4, 6]} intensity={1.7} />
      <directionalLight position={[-5, 1, -3]} intensity={0.5} />
      <group ref={ring} position={[0, -0.05, 0]}>
        {/* The ring turns about its own centre, RADIUS behind the front case. */}
        {projects.map((project) => (
          <group
            key={project.id}
            onClick={(e) => {
              e.stopPropagation()
              onPick(project.id)
            }}
          >
            <DvdCase
              project={project}
              art={art[project.id]}
              register={register}
              onPointer={(id, over) => onHover(over ? id : null)}
            />
          </group>
        ))}
      </group>
    </>
  )
}

/* `position` is the scroll's progress through the section, 0 to 1, as a
   MotionValue: read every frame, never through React state, so scrolling does
   not re-render anything. */
export default function Ring({ projects, position, opened, reduce, running, onPick, onDived }) {
  const [hovered, setHovered] = useState(null)

  return (
    <Canvas
      camera={{ fov: FOV, near: 0.05, far: 50, position: [0, 0.15, REST] }}
      dpr={[1, 2]}
      /* No tone mapping: the default filmic curve greyed the mats out, and the
         covers have to be the same colours as the rest of the site. */
      flat
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      /* Drawn every frame while the section is on screen, not at all when it is
         not or when a study covers it. */
      frameloop={running ? 'always' : 'demand'}
      /* pan-y, or the canvas would swallow a phone's scroll, which is what turns
         the ring. */
      // Otherwise the stage's grab cursor, inherited, says the ring can be dragged.
      style={{ touchAction: 'pan-y', cursor: hovered ? 'pointer' : undefined }}
      onPointerMissed={() => setHovered(null)}
    >
      <Scene
        projects={projects}
        position={position}
        opened={opened}
        hovered={hovered}
        reduce={reduce}
        onHover={setHovered}
        onPick={onPick}
        onDived={onDived}
      />
    </Canvas>
  )
}

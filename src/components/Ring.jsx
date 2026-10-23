import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { cubicBezier } from 'framer-motion'
import {
  drawBack,
  drawCover,
  drawDisc,
  drawDiscSurface,
  drawPaper,
  drawPlastic,
  drawSmudges,
  drawSpine,
} from '../lib/covers.js'
import { matColour } from '../lib/contrast.js'

/* ------------------------------------------------------------------
   The projects as DVD cases in a row that never ends, in WebGL.

   Loaded on its own (React.lazy in Work.jsx), so the hero never waits for
   Three.js. The page owns everything that is a decision: which project is in
   front comes from a drag or a click, which one is open from a click. This file only
   draws them and plays the moves between.
   ------------------------------------------------------------------ */

// The site's one curve (lib/motion.jsx EASE), as a function the frame loop can call.
const ease = cubicBezier(0.16, 1, 0.3, 1)

/* A real case is 135 x 190 x 14 mm. One unit is 10 cm. The front cover and the
   back are two halves of the depth, the cover hinged on the spine. */
const W = 1.35
const H = 1.9
const HALF = 0.07

/* The row. SPACING is centre to centre, enough air between two cases that
   the turned ones do not touch. TILT leans the row towards the camera a touch.

   It loops: each case sits at its distance from the one in front, wrapped into
   half the row either side, so going past the last case brings the first one
   round. The jump from one end to the other happens at the seam, half the row out,
   which is off screen on any ordinary screen; on one wide enough to see it, a
   case shrinks away over FADE before it jumps rather than popping. */
const SPACING = 1.85
const TILT = 0.07
const FADE = 0.9
/* Every case rests a few degrees turned, spine towards the camera. Square on, a
   case is a rectangle and reads as a card; turned, its depth and its printed
   spine show, and the sleeve catches the light. */
const YAW = 0.3
const FOV = 35

/* The camera's resting distance: the front case at about 55% of the screen's
   height, and never narrower than SEEN_WIDTH across, which is what keeps a
   phone in portrait from losing the case to its own edges. */
const REST = 5.4
const SEEN_WIDTH = 2.4

/* How fast the row catches up with the case in front, per second. A spring would
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

/* The light, balanced so a cover facing the camera comes out at about its own
   colour once the studio's reflections are added on top: with tone mapping off
   (`flat` on the Canvas), more than that clips the pale mats to white. */
const ENV = 0.5
const AMBIENT = 0.95
const KEY = 1.65

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
      Promise.all([drawCover(project), drawBack(project), drawSpine(project), drawDisc(project)]).then(
        ([cover, back, spine, disc]) => {
          if (!live) return
          const set = {
            cover: texture(cover, gl),
            back: texture(back, gl),
            spine: texture(spine, gl),
            disc: texture(disc, gl),
          }
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

/* ------------------------------------------------------------------
   The case, modelled on the Amaray keep case every DVD came in: two shells of
   black polypropylene with softened edges, a printed paper insert slid under
   a clear sleeve on the outside, and inside, a moulded tray with a ridge round
   the disc's well and a toothed hub the disc clips onto.

   The shells are geometry; the paper, the sleeve and the disc are thin layers
   laid a hair off the plastic. The sleeve is not a mesh of its own: the
   paper's clearcoat is exactly that, a smooth glossy film over a matte print,
   and it costs nothing a second transparent layer would.
   ------------------------------------------------------------------ */

// Off the plastic by a fraction of a millimetre: enough not to flicker.
const LAYER = 0.0012
// The softened edge of a shell, 1.5 mm.
const EDGE = 0.015
// The insert stops short of the rounded edges, as the paper does in the sleeve.
const INSET = 0.012
// A 12 cm disc with its 15 mm hole, the well's ridge just outside it.
const DISC_R = 0.6
const HOLE_R = 0.075
const TEETH = 12

const shellGeometry = new RoundedBoxGeometry(W, H, HALF, 4, EDGE)
const insertGeometry = new THREE.PlaneGeometry(W - INSET * 2, H - INSET * 2)
const spineGeometry = new THREE.PlaneGeometry(HALF * 2 - EDGE * 2, H - INSET * 2)
const insideGeometry = new THREE.PlaneGeometry(W - EDGE * 2, H - EDGE * 2)
const discGeometry = new THREE.RingGeometry(HOLE_R, DISC_R, 160, 1)
const ridgeGeometry = new THREE.TorusGeometry(DISC_R + 0.018, 0.005, 10, 160)
const hubGeometry = new THREE.CylinderGeometry(0.05, 0.052, 0.008, 48)
const toothGeometry = new THREE.BoxGeometry(0.016, 0.012, 0.014)

/* The soft shadow each case casts on a floor just under it: a blurred ellipse
   rather than a real shadow map, which would cost a second render of the
   scene every frame for a shape this simple. The floor itself is not drawn,
   so the shadow lands on the page. */
const FLOOR = -1.18
const shadowGeometry = new THREE.PlaneGeometry(1, 1)
let shadowTexture = null
function shadowMap() {
  if (shadowTexture) return shadowTexture
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(0, 0, 0, 1)')
  g.addColorStop(0.45, 'rgba(0, 0, 0, 0.55)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  shadowTexture = new THREE.CanvasTexture(c)
  return shadowTexture
}

/* The surfaces every case shares, made once on the first case that needs them.
   Repeats are per face size, so a grain is the same size on the cover as on
   the spine. */
let shared = null
function surfaces(gl) {
  if (shared) return shared
  // Data, not colour: left in the default linear space.
  const tile = (canvas, repeat) => {
    const t = new THREE.CanvasTexture(canvas)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
    t.anisotropy = gl.capabilities.getMaxAnisotropy()
    return t
  }
  const plastic = drawPlastic()
  const paper = drawPaper()
  shared = {
    plastic: tile(plastic, [9, 12.7]),
    paper: tile(paper, [4, 5.6]),
    paperSpine: tile(paper, [0.4, 5.6]),
    smudges: tile(drawSmudges(), [1, 1.4]),
    disc: tile(drawDiscSurface(), [1, 1]),
  }
  shared.disc.wrapS = shared.disc.wrapT = THREE.ClampToEdgeWrapping
  return shared
}

function DvdCase({ project, art, register, onPointer }) {
  const group = useRef(null)
  const lid = useRef(null)
  const gl = useThree((s) => s.gl)

  /* The inside of the cover is unlit, so the colour the camera dives into is
     the mat's exact hex and meets the study's header without a seam (lighting
     and reflections would have shifted it). It is the insert's reverse, which
     is printed on plenty of real cases. */
  const materials = useMemo(() => {
    const mat = matColour(project.mat)
    const s = surfaces(gl)

    const plastic = new THREE.MeshPhysicalMaterial({
      color: '#121215',
      roughness: 0.62,
      roughnessMap: s.plastic,
      bumpMap: s.plastic,
      bumpScale: 0.12,
      clearcoat: 0.25,
      clearcoatRoughness: 0.45,
    })
    // The paper under its sleeve: a matte print, a smooth film over it.
    const printed = (map, grain, fallback) =>
      new THREE.MeshPhysicalMaterial({
        color: map ? '#ffffff' : fallback,
        map: map ?? null,
        roughness: 0.78,
        bumpMap: grain,
        bumpScale: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.16,
        clearcoatRoughnessMap: s.smudges,
      })
    const disc = new THREE.MeshPhysicalMaterial({
      color: art ? '#ffffff' : '#c9cbd2',
      map: art?.disc ?? null,
      metalness: 1,
      metalnessMap: s.disc,
      roughness: 1,
      roughnessMap: s.disc,
      iridescence: 1,
      iridescenceMap: s.disc,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [250, 700],
      side: THREE.DoubleSide,
    })

    return {
      plastic,
      front: printed(art?.cover, s.paper, mat),
      spine: printed(art?.spine, s.paperSpine, mat),
      back: printed(art?.back, s.paper, mat),
      inside: new THREE.MeshBasicMaterial({ color: mat, toneMapped: false }),
      disc,
    }
  }, [project.mat, art, gl])

  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  useEffect(() => register(project.id, { group, lid }), [project.id, register])

  const teeth = useMemo(
    () =>
      Array.from({ length: TEETH }, (_, i) => {
        const a = (i / TEETH) * Math.PI * 2
        return { a, x: Math.cos(a) * (HOLE_R - 0.012), y: Math.sin(a) * (HOLE_R - 0.012) }
      }),
    [],
  )

  /* Inside the base, laid out from its centre, a little towards the edge that
     opens, as a real tray is. */
  const well = [0.02, 0, LAYER]

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation()
        onPointer(project.id, true)
      }}
      onPointerOut={() => onPointer(project.id, false)}
    >
      {/* The base: its shell, the back insert, and the tray inside. */}
      <mesh geometry={shellGeometry} material={materials.plastic} position={[0, 0, -HALF / 2]} />
      <mesh
        geometry={insertGeometry}
        material={materials.back}
        position={[0, 0, -HALF - LAYER]}
        rotation={[0, Math.PI, 0]}
      />
      <group position={well}>
        <mesh geometry={ridgeGeometry} material={materials.plastic} />
        <mesh geometry={hubGeometry} material={materials.plastic} rotation={[Math.PI / 2, 0, 0]} />
        {teeth.map((t) => (
          <mesh
            key={t.a}
            geometry={toothGeometry}
            material={materials.plastic}
            position={[t.x, t.y, 0.006]}
            rotation={[0, 0, t.a]}
          />
        ))}
        <mesh geometry={discGeometry} material={materials.disc} position={[0, 0, 0.004]} />
      </group>

      {/* The spine, which the insert wraps round. */}
      <mesh
        geometry={spineGeometry}
        material={materials.spine}
        position={[-W / 2 - LAYER, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* The cover, hinged on the front corner of the spine, as on a real
          case: the spine belongs to the base and stays put, and the cover's
          own edge swings in behind it. Hinged mid-depth, the cover's black
          edge swung out past the printed spine as soon as it opened at all,
          which a hover does by a few degrees. */}
      <group ref={lid} position={[-W / 2, 0, HALF]}>
        <mesh geometry={shellGeometry} material={materials.plastic} position={[W / 2, 0, -HALF / 2]} />
        <mesh geometry={insertGeometry} material={materials.front} position={[W / 2, 0, LAYER]} />
        <mesh
          geometry={insideGeometry}
          material={materials.inside}
          position={[W / 2, 0, -HALF - LAYER]}
          rotation={[0, Math.PI, 0]}
        />
      </group>
    </group>
  )
}

/* The room the cases reflect, built as a photo studio and blurred into an
   environment map once: a dim room, lighter overhead, a thin bright strip
   light where the covers mirror it, and two tall strips at the sides.

   A cover turned YAW from the camera mirrors a patch of the room about twice
   that angle off to the side, and the strip runs diagonally through that
   patch: that is the streak of glare across the sleeve that says there is a
   film over the print. It is thin on purpose. A light's reflection on the
   film scales with its brightness, but the light it pours on the print scales
   with its size too, and a broad softbox bright enough to show on the film
   washed every cover out to white. The side strips catch the rounded edges as
   the row slides. Panels are unlit colours above 1, so they act as lights. */
function studio() {
  const room = new THREE.Scene()
  const panel = (w, h, power, at) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power, power), side: THREE.DoubleSide }),
    )
    m.position.set(...at)
    m.lookAt(0, 0, 0)
    room.add(m)
    return m
  }

  const walls = new THREE.Mesh(
    new THREE.SphereGeometry(30, 32, 16),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }),
  )
  // Lighter overhead, darker underfoot.
  const position = walls.geometry.attributes.position
  const colours = []
  for (let i = 0; i < position.count; i++) {
    const v = 0.08 + 0.32 * ((position.getY(i) / 30 + 1) / 2) ** 2
    colours.push(v, v, v)
  }
  walls.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  room.add(walls)

  const glare = panel(0.3, 16, 16, [5.9, 0.4, 6.8])
  glare.rotateZ(0.45)
  panel(1.2, 10, 4, [8, 0.5, 2.5])
  panel(1.2, 10, 2, [-8, 0, -1])
  return room
}

function Studio({ intensity }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = studio()
    const map = pmrem.fromScene(room, 0.02).texture
    scene.environment = map
    scene.environmentIntensity = intensity
    room.traverse((o) => {
      o.geometry?.dispose()
      o.material?.dispose()
    })
    pmrem.dispose()
    return () => {
      scene.environment = null
      map.dispose()
    }
  }, [gl, scene, intensity])

  return null
}

/* Everything that moves, in one frame loop: the row following the case in front, the
   cases bobbing, the hovered one easing forward, and the open and close moves. */
function Scene({ projects, position, opened, hovered, reduce, onHover, onPick, onDived }) {
  const art = useArtwork(projects)
  const cases = useRef({})
  const shadows = useRef({})
  const row = useRef(null)
  // One material per shadow, since each fades on its own.
  const shadowMaterials = useMemo(
    () =>
      projects.map(
        () =>
          new THREE.MeshBasicMaterial({
            map: shadowMap(),
            color: '#000000',
            transparent: true,
            opacity: 0.32,
            depthWrite: false,
          }),
      ),
    [projects],
  )
  useEffect(() => () => shadowMaterials.forEach((m) => m.dispose()), [shadowMaterials])
  const at = useRef(position.get())
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
    const n = projects.length
    const seam = (n * SPACING) / 2
    const target = position.get()
    at.current = reduce ? target : damp(at.current, target, FOLLOW, Math.min(dt, 0.1))
    const t = state.clock.elapsedTime

    row.current.rotation.x = TILT

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
      // How many places from the front this case is, the short way round.
      const d = ((((i - at.current + n / 2) % n) + n) % n) - n / 2
      const x = d * SPACING
      const size = clamp01((seam - Math.abs(x)) / FADE)
      const bob = reduce ? 0 : Math.sin(t * 0.8 + i * 1.7) * 0.06
      const l = (lift.current[project.id] = damp(
        lift.current[project.id] ?? 0,
        hovered === project.id && m.id === null ? 1 : 0,
        10,
        dt,
      ))

      g.position.set(x, bob + l * 0.06, l * 0.25)
      g.rotation.set(0, YAW, reduce ? 0 : Math.sin(t * 0.6 + i) * 0.025)
      g.scale.setScalar(Math.max(0.0001, size))

      /* The shadow stays on the floor under the case, turns with it, and
         spreads and fades as the case rises off it. */
      const sh = shadows.current[project.id]
      if (sh) {
        const rise = g.position.y + 0.06
        sh.position.set(g.position.x, FLOOR, g.position.z)
        sh.rotation.set(-Math.PI / 2, 0, g.rotation.y)
        sh.scale.set(W * (1.25 + rise) * size, (0.42 + rise) * size, 1)
        sh.material.opacity = 0.32 * (1 - rise * 1.5) * size
      }

      const open = m.id === project.id ? ease(clamp01(p / LID_UNTIL)) : 0
      refs.lid.current.rotation.y = -(LID_OPEN * open + l * 0.16 * (1 - open))
    })

    /* The camera: at rest in front of the row, far enough back for the case to
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
      // Where the inside of the cover lies once it is open flat, in the case's own space.
      const lidCentre = new THREE.Vector3(-W, 0, HALF * 2)
      const into = g.localToWorld(lidCentre.clone().setZ(HALF * 2 + near))
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
      <Studio intensity={ENV} />
      <ambientLight intensity={AMBIENT} />
      <directionalLight position={[3, 4, 6]} intensity={KEY} />
      <directionalLight position={[-5, 1, -3]} intensity={0.5} />
      <group ref={row} position={[0, -0.05, 0]}>
        {projects.map((project, i) => (
          <mesh
            key={`${project.id}-shadow`}
            ref={(m) => {
              shadows.current[project.id] = m
            }}
            geometry={shadowGeometry}
            material={shadowMaterials[i]}
            renderOrder={-1}
          />
        ))}
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

/* `position` is which case is in front, as a count of cases that runs on
   without end either way (5 and 0 are the same case with five projects), and
   a MotionValue owned by the section: read every frame, never through React
   state, so a drag does not re-render anything. */
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
      /* pan-y, or the canvas would swallow a phone's scroll: a vertical move
         over the row is still the page's. */
      // Otherwise the stage's grab cursor, inherited, says the row can be dragged.
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

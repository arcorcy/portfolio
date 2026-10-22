/* The DVD artwork, drawn on 2D canvases that the 3D scene then wears as
   textures: the front cover, the spine and the disc of each project.

   Drawn in code from the project's own data rather than shipped as images, so
   a new project gets its artwork by existing. The layout is one poster for
   everyone, the way a collection's covers share a template: the project's mat
   as the ground, its name set big, its shot tilted in the middle like a still
   from the film, and a credits line at the foot. Type is ink or white on the
   mat, by the same rule as the study's header (lib/contrast.js). */
import { matColour, onMatHex } from './contrast.js'

// A real case is 135 x 190 mm; the canvas keeps the proportion.
export const COVER_SIZE = [1024, 1440]
export const SPINE_SIZE = [96, 1440]
export const DISC_SIZE = 1024

const FONT = "'Manrope', ui-sans-serif, system-ui, sans-serif"
const MARGIN = 72

/* Manrope comes from Google Fonts, and a canvas draws with whatever is loaded
   at the moment it draws: without waiting, the covers came out in the fallback
   face and stayed that way. */
let fontsReady = null
function fonts() {
  fontsReady ??= Promise.all(
    ['600', '700', '800'].map((w) => document.fonts.load(`${w} 100px Manrope`)),
  ).catch(() => {})
  return fontsReady
}

function canvas([w, h]) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function loadImage(src) {
  if (!src) return Promise.resolve(null)
  const img = new Image()
  img.src = src
  return img.decode().then(
    () => img,
    () => null,
  )
}

/* The largest size, from `max` down, at which `text` fits `width` on one line. */
function fit(ctx, text, weight, max, width) {
  let size = max
  ctx.font = `${weight} ${size}px ${FONT}`
  while (size > 24 && ctx.measureText(text).width > width) {
    size -= 4
    ctx.font = `${weight} ${size}px ${FONT}`
  }
  return size
}

/* The name, on one line when it holds big, else broken over two at a size
   that still reads as a title. */
function title(ctx, text, colour) {
  const width = COVER_SIZE[0] - MARGIN * 2
  ctx.fillStyle = colour
  ctx.textBaseline = 'alphabetic'
  let size = fit(ctx, text, 800, 200, width)
  if (size >= 140 || !text.includes(' ')) {
    ctx.fillText(text, MARGIN, 150 + size)
    return 150 + size
  }
  const words = text.split(' ')
  const half = Math.ceil(words.length / 2)
  const lines = [words.slice(0, half).join(' '), words.slice(half).join(' ')]
  size = Math.min(...lines.map((l) => fit(ctx, l, 800, 160, width)))
  ctx.font = `800 ${size}px ${FONT}`
  lines.forEach((l, i) => ctx.fillText(l, MARGIN, 150 + size * (i + 1) * 0.98))
  return 150 + size * 2 * 0.98
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/* The shot at 16:10, cropped the way the project asks (`crop` in projects.js):
   by default the top survives, since an interface's header says what it is. */
function still(ctx, img, crop, centreY) {
  const w = 860
  const h = Math.round((w * 10) / 16)
  const ratio = w / h
  let sw = img.naturalWidth
  let sh = sw / ratio
  if (sh > img.naturalHeight) {
    sh = img.naturalHeight
    sw = sh * ratio
  }
  const sx = crop === 'left-top' ? 0 : (img.naturalWidth - sw) / 2
  const sy = 0

  ctx.save()
  ctx.translate(COVER_SIZE[0] / 2, centreY)
  ctx.rotate((-4 * Math.PI) / 180)
  ctx.shadowColor = 'rgba(1, 1, 2, 0.32)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 30
  roundedRect(ctx, -w / 2, -h / 2, w, h, 16)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.clip()
  ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h)
  ctx.restore()
}

export async function drawCover(project) {
  await fonts()
  const img = await loadImage(project.cover)
  const c = canvas(COVER_SIZE)
  const ctx = c.getContext('2d')
  const [W, H] = COVER_SIZE
  const ink = onMatHex(project.mat)

  ctx.fillStyle = matColour(project.mat)
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = ink
  ctx.globalAlpha = 0.7
  ctx.font = `600 34px ${FONT}`
  ctx.fillText('Arthur Corcy presents', MARGIN, 120)
  ctx.globalAlpha = 1

  const below = title(ctx, project.label, ink)
  if (img) still(ctx, img, project.crop, Math.max(below + 330, 820))

  // The credits: what it is, and the one joke a DVD case is allowed.
  ctx.fillStyle = ink
  ctx.font = `700 40px ${FONT}`
  ctx.fillText(project.subtitle, MARGIN, H - 150)
  ctx.globalAlpha = 0.6
  ctx.font = `600 26px ${FONT}`
  ctx.fillText('Written, designed and shipped by Arthur Corcy', MARGIN, H - 96)
  ctx.globalAlpha = 1

  const pill = "Director's cut"
  ctx.font = `700 26px ${FONT}`
  const pw = ctx.measureText(pill).width + 44
  roundedRect(ctx, W - MARGIN - pw, H - 190, pw, 54, 27)
  ctx.lineWidth = 3
  ctx.strokeStyle = ink
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillText(pill, W - MARGIN - pw / 2, H - 154)
  ctx.textAlign = 'left'

  return c
}

/* The spine reads bottom to top, as on a shelf in Europe. */
export async function drawSpine(project) {
  await fonts()
  const c = canvas(SPINE_SIZE)
  const ctx = c.getContext('2d')
  const [W, H] = SPINE_SIZE
  ctx.fillStyle = matColour(project.mat)
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(W / 2, H - 60)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = onMatHex(project.mat)
  ctx.textBaseline = 'middle'
  fit(ctx, project.label, 800, 52, H - 260)
  ctx.fillText(project.label, 0, 0)
  ctx.font = `700 30px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText('AC', H - 120, 0)
  ctx.restore()
  return c
}

/* The disc: a silver ring, a printed face in the mat with the name on it, and
   the clear hub with its hole punched out, so the tray shows through. */
export async function drawDisc(project) {
  await fonts()
  const S = DISC_SIZE
  const c = canvas([S, S])
  const ctx = c.getContext('2d')
  const mid = S / 2

  const silver = ctx.createRadialGradient(mid, mid, 100, mid, mid, mid)
  silver.addColorStop(0, '#f2f2f4')
  silver.addColorStop(0.6, '#c9cbd2')
  silver.addColorStop(1, '#e6e7ea')
  ctx.fillStyle = silver
  ctx.beginPath()
  ctx.arc(mid, mid, mid - 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = matColour(project.mat)
  ctx.beginPath()
  ctx.arc(mid, mid, mid - 26, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = onMatHex(project.mat)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  fit(ctx, project.label, 800, 96, S * 0.62)
  ctx.fillText(project.label, mid, mid - 250)
  ctx.font = `600 30px ${FONT}`
  ctx.globalAlpha = 0.7
  ctx.fillText('Disc 1 · the case study', mid, mid + 250)
  ctx.globalAlpha = 1

  ctx.fillStyle = 'rgba(230, 231, 234, 0.9)'
  ctx.beginPath()
  ctx.arc(mid, mid, 150, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(mid, mid, 60, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  return c
}

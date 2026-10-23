/* Which of ink or white reads on a project's mat. Shared by the study's
   coloured header and the DVD covers, which both put type on the mat and must
   agree on it.

   Read from the tokens themselves rather than duplicated here, so the two
   cannot drift: a new project only declares its colour. */

/* WCAG relative luminance of a #rrggbb colour. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const HEX = /^#[0-9a-f]{6}$/i

/* The mat's own hex, or paper when the project has none or it cannot be read. */
export function matColour(mat) {
  const hex = mat && token(`--color-mat-${mat}`)
  return HEX.test(hex || '') ? hex : token('--color-paper') || '#f7f6f1'
}

/* 'white' or 'ink', whichever contrasts more with the mat. Ink is the answer
   whenever the value cannot be read: it is what every mat but the darkest takes
   anyway. */
export function onMat(mat) {
  const hex = mat && token(`--color-mat-${mat}`)
  if (!HEX.test(hex || '')) return 'ink'
  const l = luminance(hex)
  const ink = luminance(token('--color-ink') || '#010102')
  return 1.05 / (l + 0.05) > (l + 0.05) / (ink + 0.05) ? 'white' : 'ink'
}

/* The same answer as a colour a canvas can paint with. */
export function onMatHex(mat) {
  return onMat(mat) === 'white' ? token('--color-white') || '#ffffff' : token('--color-ink') || '#010102'
}

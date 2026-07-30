/**
 * Neutral stand-in for a project cover, matching the flat grey tiles in the
 * mock. Deterministic per seed so the deck does not reshuffle on render.
 */
const SHADES = ['#dddddd', '#cccccc', '#c4c4c4', '#b7b7b7']

export default function Placeholder({ seed = 0, className = '' }) {
  const shade = SHADES[seed % SHADES.length]

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: shade }}
      aria-hidden="true"
    >
      <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 300">
        <defs>
          <pattern id={`ph-grid-${seed}`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="#010102" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#ph-grid-${seed})`} />
      </svg>
    </div>
  )
}

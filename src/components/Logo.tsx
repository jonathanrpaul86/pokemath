/** Inline SVG logo — Lilita One must be loaded in index.html */
export default function Logo({ width = 260 }: { width?: number }) {
  // viewBox is 260×190; scale via width prop
  const height = Math.round(width * (190 / 260))

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 190"
      width={width}
      height={height}
      aria-label="Poké Math"
      role="img"
    >
      {/* ── Shared text style helpers ── */}
      <defs>
        <style>{`
          .logo-word {
            font-family: 'Lilita One', Impact, fantasy;
            font-size: 78px;
            fill: #FFD700;
            stroke: #1a3c8c;
            stroke-width: 10;
            stroke-linejoin: round;
            paint-order: stroke fill;
          }
          .logo-symbol {
            font-family: 'Lilita One', Impact, fantasy;
            fill: #1a3c8c;
            dominant-baseline: middle;
            text-anchor: middle;
          }
        `}</style>
        <clipPath id="pokeball-clip">
          <circle cx="0" cy="0" r="26" />
        </clipPath>
      </defs>

      {/* ── "Math" — rendered first so Pokéball can overlap ── */}
      <text className="logo-word" x="130" y="172" textAnchor="middle">Math</text>

      {/* × in the 'a'  */}
      <text className="logo-symbol" x="119" y="152" fontSize="32">×</text>
      {/* ÷ in the 'h'  */}
      <text className="logo-symbol" x="206" y="152" fontSize="28">÷</text>

      {/* ── "Poké" — rendered over Math ── */}
      <text className="logo-word" x="130" y="100" textAnchor="middle">Poké</text>

      {/* ── Pokéball as é accent — rendered on top ── */}
      {/* Center placed above the 'é' character */}
      <g transform="translate(198, 26)">
        {/* White base circle */}
        <circle cx="0" cy="0" r="26" fill="white" stroke="#1a3c8c" strokeWidth="3.5" />
        {/* Red top half */}
        <rect x="-26" y="-26" width="52" height="26" fill="#CC0000" clipPath="url(#pokeball-clip)" />
        {/* Dividing band */}
        <line x1="-26" y1="0" x2="26" y2="0" stroke="#1a3c8c" strokeWidth="4" />
        {/* Center button */}
        <circle cx="0" cy="0" r="8" fill="white" stroke="#1a3c8c" strokeWidth="3" />
        <circle cx="0" cy="0" r="3.5" fill="#1a3c8c" />
      </g>
    </svg>
  )
}

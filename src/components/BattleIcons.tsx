/**
 * Icons for the battle action buttons. Drawn in currentColor on a 64×64 grid,
 * so they take the button's text colour and look the same on every platform
 * (unlike emoji, and Unicode has no Poké Ball anyway).
 */

export type BattleAction = 'fight' | 'catch' | 'items' | 'switch' | 'run'

/** One sword pointing straight up, centred on (32, 32) */
function Sword() {
  return (
    <>
      <path d="M29 16 L32 5 L35 16 V40 H29 Z" />
      <rect x="21" y="40" width="22" height="5" rx="2" />
      <rect x="29.5" y="45" width="5" height="10" />
      <circle cx="32" cy="58" r="3.5" />
    </>
  )
}

function FightIcon() {
  return (
    <g fill="currentColor">
      <g transform="rotate(45 32 32)"><Sword /></g>
      <g transform="rotate(-45 32 32)"><Sword /></g>
    </g>
  )
}

function PokeBallIcon() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="4">
      {/* Top half, filled, with a notch for the button */}
      <path d="M5 32 A27 27 0 0 1 59 32 H42 A10 10 0 0 0 22 32 Z" fill="currentColor" stroke="none" />
      <circle cx="32" cy="32" r="27" />
      <line x1="5" y1="32" x2="22" y2="32" />
      <line x1="42" y1="32" x2="59" y2="32" />
      <circle cx="32" cy="32" r="9" />
      <circle cx="32" cy="32" r="3.5" fill="currentColor" stroke="none" />
    </g>
  )
}

function PotionIcon() {
  return (
    <g fill="currentColor">
      <rect x="24" y="4" width="16" height="7" rx="2" />
      <rect x="28" y="11" width="8" height="7" />
      {/* Bottle with a cross cut out of it */}
      <path
        fillRule="evenodd"
        d="M24 18 H40 A9 9 0 0 1 49 27 V51 A9 9 0 0 1 40 60 H24 A9 9 0 0 1 15 51 V27 A9 9 0 0 1 24 18 Z
           M28.5 29 H35.5 V35.5 H42 V42.5 H35.5 V49 H28.5 V42.5 H22 V35.5 H28.5 Z"
      />
    </g>
  )
}

function SwitchIcon() {
  return (
    <g fill="currentColor" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="21" x2="46" y2="21" />
      <path d="M42 11 L55 21 L42 31 Z" strokeWidth="3" />
      <line x1="56" y1="43" x2="18" y2="43" />
      <path d="M22 33 L9 43 L22 53 Z" strokeWidth="3" />
    </g>
  )
}

function RunIcon() {
  return (
    <g fill="currentColor" stroke="currentColor" strokeLinecap="round">
      {/* Speed lines */}
      <line x1="3" y1="27" x2="13" y2="27" strokeWidth="4" />
      <line x1="6" y1="36" x2="14" y2="36" strokeWidth="4" />
      <line x1="3" y1="45" x2="12" y2="45" strokeWidth="4" />
      {/* Running shoe */}
      <path
        stroke="none"
        d="M18 44 C18 32 22 22 30 22 H35 L41 32 L53 36 C60 38 61 46 55 47 H20 C18.5 47 18 46 18 44 Z"
      />
      <line x1="17" y1="52" x2="58" y2="52" strokeWidth="5" />
    </g>
  )
}

const ICONS: Record<BattleAction, () => React.JSX.Element> = {
  fight: FightIcon,
  catch: PokeBallIcon,
  items: PotionIcon,
  switch: SwitchIcon,
  run: RunIcon,
}

export function BattleActionIcon({ action }: { action: BattleAction }) {
  const Icon = ICONS[action]
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <Icon />
    </svg>
  )
}

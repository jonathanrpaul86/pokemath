import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import { useTrainer, useGameStore } from '../store'
import { fetchPokemonSpecies } from '../services/pokeApi'
import { spawnWildPokemon, calcDamage, calcCatchDifficulty, isBattleOutcome, damagingMoves, moveMenuOptions, battleProblem, moveMathTier } from '../utils/battle'
import { pickEncounter, pickLevel } from '../utils/encounter'
import { generateProblem, checkAnswer } from '../utils/math'
import { battleXpReward, trainerMoneyReward, pokemonXpToNextLevel, EXP_ALL_SHARE } from '../utils/formulas'
import { hasKeyItem } from '../data/areas'
import { playCorrect, playWrong, playCatch, playVictory, playLevelUp, isMuted, setMuted } from '../utils/sound'
import { EVOLUTIONS } from '../data/evolutions'
import { KANTO_NAMES } from '../data/pokedex'
import { BattleActionIcon } from '../components/BattleIcons'
import { ITEM_MAP, BALL_EMOJI, ITEM_EMOJI } from '../data/items'
import type { Area, BattlePhase, BattleOutcome, MathProblem, Move, OwnedPokemon, WildPokemon, TrainerBattle, WildOverride } from '../types'
import './BattleScreen.css'

// ---- Constants ---------------------------------------------------------------

const MATH_ATTACK: Move = {
  id: 0, name: 'math attack', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical',
}
const TACKLE: Move = {
  id: 33, name: 'tackle', type: 'normal', power: 35, accuracy: 100, damageClass: 'physical',
}

function pickEnemyMove(wild: WildPokemon): Move {
  const damaging = damagingMoves(wild.moves)
  if (damaging.length === 0) return TACKLE
  return damaging[Math.floor(Math.random() * damaging.length)]
}

/** The move picked in the move menu, otherwise a random attack */
function pickPlayerMove(pokemon: OwnedPokemon, chosen?: Move): Move {
  if (chosen) return chosen
  const damaging = damagingMoves(pokemon.moves)
  if (damaging.length === 0) return MATH_ATTACK
  return damaging[Math.floor(Math.random() * damaging.length)]
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ---- Types -------------------------------------------------------------------

interface CatchProgress {
  required: number
  solved: number
  timePerProblem: number
}

interface BattleData {
  phase: BattlePhase
  wild: WildPokemon
  wildHp: number
  partyHps: number[]
  activeIdx: number
  switchTargetIdx: number | null
  problem: MathProblem | null
  timeRemaining: number
  catchProgress: CatchProgress | null
  catchProblem: MathProblem | null
  catchTimeRemaining: number
  log: string[]
  wildSprite: string
  playerSprites: string[]
  /** Move picked in the move menu, and the Pokémon it was picked for */
  chosenMove?: { uid: string; move: Move }
  // Trainer battle only:
  trainerTeam?: WildPokemon[]
  trainerTeamIdx?: number
  trainerSprites?: string[]
}

// ---- Battle field backgrounds -----------------------------------------------

// Each entry: [sky-top, sky-bottom, ground-top, ground-bottom]
const FIELD_THEMES: Record<string, [string, string, string, string]> = {
  'route-1':         ['#87ceeb', '#b8e4f8', '#78c840', '#3a7a18'],
  'route-2':         ['#87ceeb', '#b8e4f8', '#68b838', '#2a6a18'],
  'route-22':        ['#90d0f0', '#c0e8f8', '#88c048', '#4a7a20'],
  'route-23':        ['#d8b878', '#f0d8a0', '#a89048', '#605020'],
  'viridian-city':   ['#6ab0c0', '#3a8898', '#5a7060', '#283830'],
  'viridian-forest': ['#1a4028', '#0d2818', '#2a4a18', '#0a1c08'],
  'pewter-city':     ['#8090a8', '#5a6890', '#808888', '#505858'],
  'mt-moon':         ['#0a0520', '#1a0a40', '#100820', '#060410'],
  'cerulean-city':   ['#70c8f8', '#38a0e0', '#1060c8', '#083880'],
  'rock-tunnel':     ['#100808', '#1c0e08', '#2a1808', '#140c04'],
  'cerulean-cave':   ['#080c28', '#101c48', '#182040', '#080c20'],
  'digletts-cave':   ['#2a1808', '#4a2c10', '#6a4420', '#3a2410'],
  'lavender-town':   ['#280838', '#4a1870', '#2a1838', '#100818'],
  'power-plant':     ['#302808', '#584810', '#403820', '#201808'],
  'celadon-city':    ['#50b870', '#309050', '#20a060', '#0a5830'],
  'fuchsia-city':    ['#780848', '#b83080', '#400820', '#200408'],
  'route-19':        ['#70c0f0', '#a0d8f8', '#2080c8', '#0850a0'],
  'route-20':        ['#70c0f0', '#a0d8f8', '#2080c8', '#0850a0'],
  'route-21':        ['#70c0f0', '#a0d8f8', '#2080c8', '#0850a0'],
  'seafoam-islands': ['#a8d8f0', '#d0f0ff', '#88b8d8', '#4878a8'],
  'cinnabar-island': ['#280408', '#681008', '#b83008', '#c04808'],
  'victory-road':    ['#080c10', '#101820', '#181820', '#080810'],
  'indigo-plateau':  ['#302070', '#5040a8', '#403860', '#201838'],
}

function getBattleFieldStyle(areaId: string): CSSProperties {
  const [st, sb, gt, gb] = FIELD_THEMES[areaId] ?? ['#0f3460', '#16213e', '#1a2238', '#1a1a2e']
  return {
    background: `linear-gradient(180deg, ${st} 0%, ${sb} 50%, ${gt} 53%, ${gb} 100%)`,
  }
}

// ---- Sub-components ----------------------------------------------------------

function HpBar({ current, max, small }: { current: number; max: number; small?: boolean }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  const color = pct > 50 ? 'green' : pct > 20 ? 'yellow' : 'red'
  return (
    <div className={`hp-bar ${small ? 'hp-bar--small' : ''}`}>
      <div className={`hp-bar__fill hp-bar__fill--${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function XpBar({ xp, max }: { xp: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((xp / max) * 100)) : 0
  return (
    <div className="xp-bar xp-bar--battle">
      <div className="xp-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

function TimerRing({ remaining, total, overlay, flash }: {
  remaining: number; total: number; overlay?: boolean; flash?: 'correct' | 'wrong'
}) {
  const pct = flash ? 1 : (total > 0 ? Math.min(1, remaining / total) : 0)
  const stroke = flash === 'correct' ? '#48bb78'
    : flash === 'wrong' ? '#e63946'
    : pct > 0.5 ? '#4299e1' : pct > 0.25 ? '#f6e05e' : '#e63946'
  const size = overlay ? 140 : 64
  const r = overlay ? 58 : 26
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const cls = ['timer-ring', overlay && 'timer-ring--overlay', flash && `timer-ring--flash-${flash}`].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#ffffff20" strokeWidth="12" />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: flash ? 'none' : 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span className="timer-ring__label">
        {flash === 'correct' ? '✓' : flash === 'wrong' ? '✗' : remaining}
      </span>
    </div>
  )
}

/** What a move's strength does to the math, shown in the move menu and log */
const MATH_TIER_NAMES = ['', 'Harder math', 'Hardest math'] as const

const ACTION_BUTTONS = [
  ['fight',  'Fight'],
  ['catch',  'Catch'],
  ['items',  'Items'],
  ['switch', 'Switch'],
  ['run',    'Run'],
] as const

function NumberPad({ mode = 'digits', onDigit, onDelete, onSubmit, onAction, switchableCount, disabled }: {
  mode?: 'digits' | 'actions'
  onDigit?: (d: string) => void
  onDelete?: () => void
  onSubmit?: () => void
  onAction?: (a: 'fight' | 'catch' | 'items' | 'switch' | 'run') => void
  switchableCount?: number
  disabled?: boolean
}) {
  if (mode === 'actions') {
    return (
      <div className="numpad numpad--actions">
        {ACTION_BUTTONS.map(([action, label]) => (
          <button
            key={action}
            className={`numpad-btn numpad-btn--${action}`}
            disabled={action === 'switch' && (switchableCount ?? 0) === 0}
            onClick={() => onAction?.(action)}
          >
            <span className="numpad-btn__bg-icon"><BattleActionIcon action={action} /></span>
            <span className="numpad-btn__label">({label[0]}){' '}{label.slice(1)}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="numpad">
      {['7','8','9','4','5','6','1','2','3','⌫','0','✓'].map(key => (
        <button
          key={key}
          className={`numpad-btn ${key === '✓' ? 'numpad-btn--submit' : ''} ${key === '⌫' ? 'numpad-btn--delete' : ''}`}
          onClick={() => {
            if (disabled) return
            if (key === '⌫') onDelete?.()
            else if (key === '✓') onSubmit?.()
            else onDigit?.(key)
          }}
          disabled={disabled}
        >
          {key}
        </button>
      ))}
    </div>
  )
}

// ---- Main component ----------------------------------------------------------

interface Props {
  area: Area
  onBattleEnd: (outcome: BattleOutcome) => void
  trainerBattle?: TrainerBattle
  /** Battle this Pokémon instead of rolling the area's encounter table */
  wildOverride?: WildOverride
}

/**
 * Counts a battle timer down once a second while `running`: `onTick` takes a
 * second off, and `onExpire` runs instead when the last second is up.
 */
function useBattleCountdown(running: boolean, remaining: number, onTick: () => void, onExpire: () => void) {
  // The callbacks change every render; read the latest ones when the second is up
  const callbacks = useRef({ onTick, onExpire })
  useEffect(() => { callbacks.current = { onTick, onExpire } })

  useEffect(() => {
    if (!running || remaining <= 0) return
    const t = setTimeout(() => (remaining > 1 ? callbacks.current.onTick() : callbacks.current.onExpire()), 1000)
    return () => clearTimeout(t)
  }, [running, remaining])
}

export default function BattleScreen({ area, onBattleEnd, trainerBattle, wildOverride }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()

  const [battle, setBattle] = useState<BattleData | null>(null)
  const [answer, setAnswer] = useState('')
  const [showSwitch, setShowSwitch] = useState(false)
  const [switchHighlight, setSwitchHighlight] = useState<number | null>(null)
  const [pendingTrainerSend, setPendingTrainerSend] = useState<{ nextEnemy: WildPokemon; nextIdx: number; spriteSrc: string } | null>(null)
  const [showBallMenu, setShowBallMenu] = useState(false)
  const [showItemMenu, setShowItemMenu] = useState(false)
  const [usingItemInBattle, setUsingItemInBattle] = useState<string | null>(null)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const battleRef = useRef<BattleData | null>(null)
  const evolvedRef = useRef<Set<string>>(new Set())
  // Branching evolutions (Eevee) the player already picked or put off, keyed like evolvedRef
  const [settledEvolutions, setSettledEvolutions] = useState<string[]>([])
  const prevLevelRef = useRef<Record<string, number>>({})
  const [muted, setMutedState] = useState(isMuted())

  useEffect(() => { battleRef.current = battle }, [battle])

  // ---- Initialise battle -----------------------------------------------------

  useEffect(() => {
    let cancelled = false
    async function init() {
      const partySpecies = await Promise.all(trainer.party.map(p => fetchPokemonSpecies(p.speciesId)))
      if (cancelled) return
      const partyHps = trainer.party.map(p => p.currentHp)
      const firstAlive = partyHps.findIndex(hp => hp > 0)

      if (trainerBattle) {
        const teamSpecies = await Promise.all(trainerBattle.team.map(t => fetchPokemonSpecies(t.speciesId)))
        if (cancelled) return
        const trainerTeam = trainerBattle.team.map((t, i) => spawnWildPokemon(teamSpecies[i], t.level))
        const wild = trainerTeam[0]
        setBattle({
          phase: 'choose-action',
          wild,
          wildHp: wild.maxHp,
          partyHps,
          activeIdx: firstAlive >= 0 ? firstAlive : 0,
          switchTargetIdx: null,
          problem: null,
          timeRemaining: 0,
          catchProgress: null,
          catchProblem: null,
          catchTimeRemaining: 0,
          log: [`${trainerBattle.trainerName}: "${trainerBattle.quote}"`, `${trainerBattle.trainerName} sent out ${capitalize(wild.name)}!`],
          wildSprite: teamSpecies[0].sprites.front,
          playerSprites: partySpecies.map(s => s.sprites.back),
          trainerTeam,
          trainerTeamIdx: 0,
          trainerSprites: teamSpecies.map(s => s.sprites.front),
        })
        return
      }

      const { speciesId, level } = wildOverride ?? (() => {
        const entry = pickEncounter(area, Math.random, trainer.keyItems)
        return { speciesId: entry.speciesId, level: pickLevel(entry) }
      })()
      const wildSpecies = await fetchPokemonSpecies(speciesId)
      if (cancelled) return
      const wild = spawnWildPokemon(wildSpecies, level)
      dispatch({ type: 'SEE_POKEMON', payload: { speciesId: wild.speciesId } })
      setBattle({
        phase: 'choose-action',
        wild,
        wildHp: wild.maxHp,
        partyHps,
        activeIdx: firstAlive >= 0 ? firstAlive : 0,
        switchTargetIdx: null,
        problem: null,
        timeRemaining: 0,
        catchProgress: null,
        catchProblem: null,
        catchTimeRemaining: 0,
        log: [wildOverride?.intro ?? `A wild ${capitalize(wild.name)} appeared!`],
        wildSprite: wildSpecies.sprites.front,
        playerSprites: partySpecies.map(s => s.sprites.back),
      })
    }
    init()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Helpers ---------------------------------------------------------------

  const nextProblem = useCallback((overrideIdx?: number, move?: Move) => {
    const base = battleProblem(area.mathDifficulty, move)
    const b = battleRef.current
    const idx = overrideIdx ?? b?.activeIdx ?? 0
    const playerLevel = trainer.party[idx]?.level ?? 1
    const wildLevel = b?.wild.level ?? 1
    const levelDiff = playerLevel - wildLevel
    const multiplier = trainer.timerMultiplier ?? 1
    const adjusted = Math.max(5, Math.min(45, Math.round(
      (base.timeLimit + Math.round(levelDiff * 0.5)) * multiplier
    )))
    return { ...base, timeLimit: adjusted }
  }, [area.mathDifficulty, trainer.party, trainer.timerMultiplier])

  /** Moves the Fight menu offers the active Pokémon; empty means Fight goes straight to a problem */
  function moveOptionsFor(b: BattleData): Move[] {
    return moveMenuOptions(trainer.party[b.activeIdx]?.moves, trainer.chooseMoves)
  }

  /** The move picked for the active Pokémon, if one was picked */
  function chosenMoveFor(b: BattleData): Move | undefined {
    const chosen = b.chosenMove
    return chosen && chosen.uid === trainer.party[b.activeIdx]?.uid ? chosen.move : undefined
  }

  function persistHps(b: BattleData) {
    trainer.party.forEach((member, i) => {
      const hp = b.partyHps[i]
      if (hp !== undefined && hp !== member.currentHp) {
        dispatch({ type: 'UPDATE_POKEMON_HP', payload: { uid: member.uid, currentHp: hp } })
      }
    })
  }

  /**
   * XP for the Pokémon that fought; with the Exp. All, the rest of the party
   * (if they haven't fainted) shares some too. Returns a note for the log.
   */
  function awardXp(b: BattleData, amount: number): string {
    dispatch({ type: 'GAIN_POKEMON_XP', payload: { uid: trainer.party[b.activeIdx].uid, amount } })
    if (!hasKeyItem(trainer.keyItems, 'exp-all')) return ''
    const shared = Math.round(amount * EXP_ALL_SHARE)
    const others = trainer.party.filter((p, i) => i !== b.activeIdx && (b.partyHps[i] ?? p.currentHp) > 0)
    for (const p of others) dispatch({ type: 'GAIN_POKEMON_XP', payload: { uid: p.uid, amount: shared } })
    return others.length ? ` The Exp. All shared ${shared} XP with the team!` : ''
  }

  function handleVictory(b: BattleData) {
    const pkmnXp = battleXpReward(b.wild.level, !!trainerBattle)
    persistHps(b)
    const sharedNote = awardXp(b, pkmnXp)

    if (trainerBattle && b.trainerTeam && b.trainerTeamIdx !== undefined) {
      const nextIdx = b.trainerTeamIdx + 1
      if (nextIdx < b.trainerTeam.length) {
        const nextEnemy = b.trainerTeam[nextIdx]
        const hasSwitchable = b.partyHps.some((hp, i) => i !== b.activeIdx && hp > 0)
        if (hasSwitchable) {
          // Offer a free switch before the trainer sends their next Pokémon
          setPendingTrainerSend({ nextEnemy, nextIdx, spriteSrc: b.trainerSprites![nextIdx] })
          setBattle(prev => prev ? {
            ...prev,
            phase: 'choose-action',
            wild: nextEnemy,
            wildHp: nextEnemy.maxHp,
            trainerTeamIdx: nextIdx,
            wildSprite: b.trainerSprites![nextIdx],
            problem: null,
            log: [...prev.log.slice(-3), `${capitalize(b.wild.name)} fainted! ${trainerBattle.trainerName} is about to send out ${capitalize(nextEnemy.name)}!`],
          } : prev)
        } else {
          setBattle(prev => prev ? {
            ...prev,
            phase: 'choose-action',
            wild: nextEnemy,
            wildHp: nextEnemy.maxHp,
            trainerTeamIdx: nextIdx,
            wildSprite: b.trainerSprites![nextIdx],
            problem: null,
            log: [...prev.log.slice(-3), `${capitalize(b.wild.name)} fainted! ${trainerBattle.trainerName} sent out ${capitalize(nextEnemy.name)}!`],
          } : prev)
        }
        return
      }
      const topLevel = Math.max(...b.trainerTeam.map(p => p.level))
      const prize = trainerMoneyReward(topLevel)
      dispatch({ type: 'GAIN_MONEY', payload: { amount: prize } })
      playVictory()
      setBattle(prev => prev ? {
        ...prev,
        phase: 'victory',
        log: [`${capitalize(b.wild.name)} fainted! You defeated ${trainerBattle.trainerName} and received ¥${prize}!`],
      } : prev)
      return
    }

    playVictory()
    setBattle(prev => prev ? {
      ...prev,
      phase: 'victory',
      log: [`Wild ${capitalize(b.wild.name)} fainted! ${capitalize(trainer.party[b.activeIdx].name)} gained ${pkmnXp} XP!${sharedNote}`],
    } : prev)
  }

  function handleBlackout() {
    dispatch({ type: 'HEAL_PARTY' })
    setBattle(prev => prev ? {
      ...prev,
      phase: 'blacked-out',
      log: ['All your Pokémon fainted! You were sent back to safety...'],
    } : prev)
  }

  // ---- Phase effects ---------------------------------------------------------

  // resolving-correct / resolving-wrong → next phase
  useEffect(() => {
    if (!battle) return
    if (battle.phase !== 'resolving-correct' && battle.phase !== 'resolving-wrong') return
    const t = setTimeout(() => {
      const b = battleRef.current
      if (!b) return
      // Clear typed answer on every resolve exit (victory, next enemy, forced switch)
      setAnswer('')

      if (b.phase === 'resolving-correct') {
        if (b.wildHp <= 0) { handleVictory(b); return }
        const p = nextProblem(undefined, chosenMoveFor(b))
        setBattle(prev => prev ? { ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit } : prev)
        setAnswer('')
        return
      }

      if (b.phase === 'resolving-wrong') {
        if (b.partyHps[b.activeIdx] <= 0) {
          const nextIdx = b.partyHps.findIndex((hp, i) => i !== b.activeIdx && hp > 0)
          if (nextIdx === -1) { handleBlackout(); return }
          // Forced switch after faint — pause at choose-action so player can react
          setBattle(prev => prev ? {
            ...prev, phase: 'choose-action', activeIdx: nextIdx, problem: null,
            log: [...prev.log.slice(-3), `Go, ${capitalize(trainer.party[nextIdx].name)}!`],
          } : prev)
          return
        }
        const p = nextProblem(undefined, chosenMoveFor(b))
        setBattle(prev => prev ? { ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit } : prev)
        setAnswer('')
        return
      }
    }, 800)
    return () => clearTimeout(t)
  }, [battle?.phase])  // eslint-disable-line

  // ---- Timers ---------------------------------------------------------------

  const battlePhase = battle?.phase
  const timeLeft = battle?.timeRemaining ?? 0
  const catchTimeLeft = battle?.catchTimeRemaining ?? 0
  // The answer timer waits while a menu is open
  const menuOpen = showSwitch || showMoveMenu || showBallMenu || showItemMenu || !!usingItemInBattle

  /** Take a second off the timer, but only while the battle is still in that phase */
  function tick(phase: BattlePhase, field: 'timeRemaining' | 'catchTimeRemaining') {
    setBattle(prev => prev?.phase === phase ? { ...prev, [field]: prev[field] - 1 } : prev)
  }

  /** Runs the handler for a timer that ran out, if the battle is still in that phase */
  function whenStill(phase: BattlePhase, handler: (b: BattleData) => void) {
    const b = battleRef.current
    if (b?.phase === phase) handler(b)
  }

  // Out of time to answer → counts as a wrong answer
  useBattleCountdown(battlePhase === 'player-turn' && !menuOpen, timeLeft,
    () => tick('player-turn', 'timeRemaining'),
    () => whenStill('player-turn', processWrongAnswer))

  // Out of time while catching → the Pokémon breaks free
  useBattleCountdown(battlePhase === 'catch-attempt', catchTimeLeft,
    () => tick('catch-attempt', 'catchTimeRemaining'),
    () => whenStill('catch-attempt', processCatchTimeout))

  // Out of time while running → the escape fails
  useBattleCountdown(battlePhase === 'run-attempt', timeLeft,
    () => tick('run-attempt', 'timeRemaining'),
    () => whenStill('run-attempt', processRunFailure))

  // Out of time while switching → the switch happens, but the enemy attacks
  useBattleCountdown(battlePhase === 'switch-attempt', timeLeft,
    () => tick('switch-attempt', 'timeRemaining'),
    () => whenStill('switch-attempt', processSwitchFailure))

  function processCatchTimeout(b: BattleData) {
    const p = nextProblem(undefined, chosenMoveFor(b))
    setBattle(prev => prev ? {
      ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit,
      catchProgress: null, catchProblem: null,
      log: [...prev.log.slice(-3), `${capitalize(prev.wild.name)} broke free!`],
    } : prev)
    setAnswer('')
  }

  // ---- Level-up sound --------------------------------------------------------

  useEffect(() => {
    if (!battle || battle.phase === 'intro') return
    const pokemon = trainer.party[battle.activeIdx]
    if (!pokemon) return
    const prev = prevLevelRef.current[pokemon.uid]
    if (prev !== undefined && pokemon.level > prev) {
      playLevelUp()
    }
    prevLevelRef.current[pokemon.uid] = pokemon.level
  }, [trainer.party[battle?.activeIdx ?? 0]?.level]) // eslint-disable-line

  // ---- Evolution check -------------------------------------------------------

  useEffect(() => {
    if (!battle) return
    if (battle.phase !== 'victory' && battle.phase !== 'caught') return

    const pokemon = trainer.party[battle.activeIdx]
    if (!pokemon) return

    const key = `${pokemon.uid}@${pokemon.speciesId}@${pokemon.level}`
    if (evolvedRef.current.has(key)) return

    const evo = EVOLUTIONS[pokemon.speciesId]
    // Branching evolutions wait for the player's pick (see evolutionChoice)
    if (!evo || evo.choices || pokemon.level < evo.atLevel) return

    evolvedRef.current.add(key)
    evolveInto(pokemon.uid, capitalize(pokemon.name), evo.evolvesIntoId)
  }, [battle?.phase]) // eslint-disable-line

  function evolveInto(uid: string, prevName: string, speciesId: number) {
    fetchPokemonSpecies(speciesId).then(newSpecies => {
      dispatch({
        type: 'EVOLVE_POKEMON',
        payload: {
          uid,
          newSpeciesId: newSpecies.id,
          newName: newSpecies.name,
          newBaseStats: newSpecies.baseStats,
        },
      })
      setBattle(prev => {
        if (!prev) return prev
        const sprites = [...prev.playerSprites]
        sprites[prev.activeIdx] = newSpecies.sprites.back
        return {
          ...prev,
          playerSprites: sprites,
          log: [...prev.log.slice(-3), `✨ ${prevName} evolved into ${capitalize(newSpecies.name)}!`],
        }
      })
    })
  }

  /** Pick a branch, or null to stay as-is for now (asked again next level) */
  function resolveEvolutionChoice(speciesId: number | null) {
    if (!evolutionChoice) return
    setSettledEvolutions(keys => [...keys, evolutionChoice.key])
    if (speciesId !== null) evolveInto(evolutionChoice.uid, evolutionChoice.prevName, speciesId)
  }

  // A branching evolution (Eevee) waiting for the player to pick, after a win or catch
  const evolutionChoice = (() => {
    if (!battle || (battle.phase !== 'victory' && battle.phase !== 'caught')) return null
    const pokemon = trainer.party[battle.activeIdx]
    const evo = pokemon && EVOLUTIONS[pokemon.speciesId]
    if (!pokemon || !evo?.choices || pokemon.level < evo.atLevel) return null
    const key = `${pokemon.uid}@${pokemon.speciesId}@${pokemon.level}`
    if (settledEvolutions.includes(key)) return null
    return { key, uid: pokemon.uid, prevName: capitalize(pokemon.name), options: evo.choices }
  })()

  // ---- Keyboard input --------------------------------------------------------

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const b = battleRef.current
      if (!b) return

      // Terminal phase: pick an evolution first if one is waiting, then Enter continues
      if (isBattleOutcome(b.phase) && evolutionChoice) {
        const n = parseInt(e.key, 10)
        if (n >= 1 && n <= evolutionChoice.options.length) { e.preventDefault(); resolveEvolutionChoice(evolutionChoice.options[n - 1]) }
        else if (e.key === 'Escape') { e.preventDefault(); resolveEvolutionChoice(null) }
        return
      }
      if (isBattleOutcome(b.phase)) {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (trainerBattle) trainerBattle.onComplete(b.phase === 'victory')
          else onBattleEnd(b.phase)
        }
        return
      }

      // Escape closes any open sub-menu
      if (e.key === 'Escape') {
        if (showBallMenu) { e.preventDefault(); setShowBallMenu(false); return }
        if (showItemMenu) { e.preventDefault(); setShowItemMenu(false); return }
        if (usingItemInBattle) { e.preventDefault(); setUsingItemInBattle(null); return }
      }

      // Move menu: a number picks that move, Escape closes it
      if (showMoveMenu) {
        const options = moveOptionsFor(b)
        const n = parseInt(e.key, 10)
        if (e.key === 'Escape') { e.preventDefault(); setShowMoveMenu(false) }
        else if (n >= 1 && n <= options.length) { e.preventDefault(); handleChooseMove(options[n - 1]) }
        return
      }

      // Trainer send-next prompt: only n/Enter (no) or s (switch) valid
      if (pendingTrainerSend && !showSwitch) {
        if (e.key === 'Enter' || e.key.toLowerCase() === 'n') { e.preventDefault(); handleNoSwitchBeforeTrainerSend(); return }
        if (e.key.toLowerCase() === 's') { e.preventDefault(); openSwitchMenuForTrainerSend(); return }
        return
      }

      // Branch A: action selection
      if (b.phase === 'choose-action' && !showSwitch && !showBallMenu && !showItemMenu && !usingItemInBattle) {
        const switchable = trainer.party.filter((_, i) => i !== b.activeIdx && (b.partyHps[i] ?? 0) > 0)
        const actionMap: Record<string, () => void> = {
          'f': handleFight,
          ...(!trainerBattle && { 'c': handleStartCatch, 'r': handleFlee }),
        }
        if (e.key === 's' && switchable.length > 0) { e.preventDefault(); openSwitchMenu(); return }
        const fn = actionMap[e.key]
        if (fn) { e.preventDefault(); fn() }
        return
      }

      // Branch B: switch menu navigation (two-step: number highlights, Enter confirms)
      if (showSwitch) {
        if (e.key === 'Escape') { e.preventDefault(); closeSwitchMenu(true); return }

        if (e.key === 'Enter') {
          if (switchHighlight !== null) {
            e.preventDefault()
            const isCurrent = switchHighlight === b.activeIdx
            const isFainted = (b.partyHps[switchHighlight] ?? 0) === 0
            if (isCurrent) {
              setBattle(prev => prev ? { ...prev, log: [...prev.log.slice(-3), `${capitalize(trainer.party[switchHighlight].name)} is already battling!`] } : prev)
            } else if (isFainted) {
              setBattle(prev => prev ? { ...prev, log: [...prev.log.slice(-3), `${capitalize(trainer.party[switchHighlight].name)} has no will to battle!`] } : prev)
            } else if (pendingTrainerSend) {
              handleFreeSwitchForTrainerSend(switchHighlight)
            } else {
              handleSwitch(switchHighlight)
            }
          }
          return
        }

        const n = parseInt(e.key, 10)
        if (!isNaN(n) && n >= 1 && n <= trainer.party.length) {
          e.preventDefault()
          const partyIdx = n - 1
          setSwitchHighlight(partyIdx)
          setBattle(prev => prev ? {
            ...prev,
            log: [...prev.log.slice(-3), `Send out ${capitalize(trainer.party[partyIdx].name)}?`],
          } : prev)
        }
        return
      }

      // Branch C: digit entry (player-turn / catch-attempt / run-attempt / switch-attempt)
      if (b.phase !== 'player-turn' && b.phase !== 'catch-attempt' && b.phase !== 'run-attempt' && b.phase !== 'switch-attempt') return

      // Battle option hotkeys available during player-turn
      if (b.phase === 'player-turn') {
        const switchable = trainer.party.filter((_, i) => i !== b.activeIdx && (b.partyHps[i] ?? 0) > 0)
        const noMenuOpen = !showBallMenu && !showItemMenu && !usingItemInBattle
        if (e.key === 'f' && noMenuOpen && moveOptionsFor(b).length > 0) { e.preventDefault(); setShowMoveMenu(true); return }
        if (!trainerBattle && e.key === 'c') { e.preventDefault(); handleStartCatch(); return }
        if (e.key === 's' && switchable.length > 0) { e.preventDefault(); openSwitchMenu(); return }
        if (!trainerBattle && e.key === 'r') { e.preventDefault(); handleFlee(); return }
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        setAnswer(a => a.length < 4 ? a + e.key : a)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        setAnswer(a => a.slice(0, -1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (b.phase === 'catch-attempt') handleSubmitCatchAnswer()
        else handleSubmitAnswer()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [answer, showSwitch, switchHighlight, showBallMenu, showItemMenu, usingItemInBattle, pendingTrainerSend, showMoveMenu, evolutionChoice?.key]) // eslint-disable-line

  // ---- Action handlers -------------------------------------------------------

  function processCorrectAnswer(b: BattleData, fast: boolean) {
    playCorrect()
    const attacker = trainer.party[b.activeIdx]
    const move = pickPlayerMove(attacker, chosenMoveFor(b))
    const playerDmg = Math.max(1, calcDamage(move, attacker, b.wild))
    const newWildHp = Math.max(0, b.wildHp - playerDmg)
    const logLines = [`${capitalize(attacker.name)} used ${capitalize(move.name)} for ${playerDmg} damage!`]
    let newPartyHps = b.partyHps

    if (!fast) {
      const counterMove = pickEnemyMove(b.wild)
      const counterDmg = Math.max(1, calcDamage(counterMove, b.wild, attacker))
      newPartyHps = b.partyHps.map((hp, i) =>
        i === b.activeIdx ? Math.max(0, hp - counterDmg) : hp
      )
      const enemyLabel = trainerBattle ? capitalize(b.wild.name) : `Wild ${capitalize(b.wild.name)}`
      logLines[0] += ` But ${enemyLabel} countered for ${counterDmg}!`
    }

    setBattle(prev => prev ? {
      ...prev,
      phase: 'resolving-correct',
      wildHp: newWildHp,
      partyHps: newPartyHps,
      log: [...prev.log.slice(-3), ...logLines],
    } : prev)
  }

  function processWrongAnswer(b: BattleData) {
    playWrong()
    const move = pickEnemyMove(b.wild)
    const defender = trainer.party[b.activeIdx]
    const damage = Math.max(1, calcDamage(move, b.wild, defender))
    const newHp = Math.max(0, b.partyHps[b.activeIdx] - damage)
    const newPartyHps = b.partyHps.map((hp, i) => i === b.activeIdx ? newHp : hp)
    const enemyLabel = trainerBattle ? capitalize(b.wild.name) : `Wild ${capitalize(b.wild.name)}`
    const chosen = chosenMoveFor(b)
    const missed = chosen ? `${capitalize(defender.name)}'s ${capitalize(chosen.name)} missed! ` : ''
    setBattle(prev => prev ? {
      ...prev,
      phase: 'resolving-wrong',
      partyHps: newPartyHps,
      log: [...prev.log.slice(-3), `${missed}${enemyLabel} used ${capitalize(move.name)} for ${damage} damage!`],
    } : prev)
  }

  function processRunFailure(b: BattleData) {
    playWrong()
    const move = pickEnemyMove(b.wild)
    const defender = trainer.party[b.activeIdx]
    const damage = Math.max(1, calcDamage(move, b.wild, defender))
    const newHp = Math.max(0, b.partyHps[b.activeIdx] - damage)
    const newPartyHps = b.partyHps.map((hp, i) => i === b.activeIdx ? newHp : hp)
    const failMsg = `Couldn't escape! ${capitalize(b.wild.name)} used ${capitalize(move.name)} for ${damage} damage!`

    if (newHp <= 0) {
      const nextIdx = newPartyHps.findIndex((hp, i) => i !== b.activeIdx && hp > 0)
      if (nextIdx === -1) {
        dispatch({ type: 'HEAL_PARTY' })
        setBattle(prev => prev ? { ...prev, partyHps: newPartyHps, phase: 'blacked-out', log: ['All your Pokémon fainted! You were sent back to safety...'] } : prev)
        return
      }
      setBattle(prev => prev ? {
        ...prev, partyHps: newPartyHps, phase: 'choose-action', activeIdx: nextIdx, problem: null,
        log: [...prev.log.slice(-3), `${failMsg} Go, ${capitalize(trainer.party[nextIdx].name)}!`],
      } : prev)
      return
    }

    setBattle(prev => prev ? {
      ...prev, partyHps: newPartyHps, phase: 'choose-action', problem: null,
      log: [...prev.log.slice(-3), failMsg],
    } : prev)
    setAnswer('')
  }

  function handleSubmitAnswer() {
    const b = battleRef.current
    if (!b || !b.problem) return

    if (b.phase === 'run-attempt') {
      const num = parseInt(answer, 10)
      if (isNaN(num)) return
      if (checkAnswer(b.problem, num)) {
        playCorrect()
        persistHps(b)
        setBattle(prev => prev ? { ...prev, phase: 'fled', log: ['You got away safely!'] } : prev)
      } else {
        processRunFailure(b)
      }
      setAnswer('')
      return
    }

    if (b.phase === 'switch-attempt') {
      const num = parseInt(answer, 10)
      if (isNaN(num)) return
      const correct = checkAnswer(b.problem!, num)
      dispatch({ type: 'RECORD_ANSWER', payload: { operator: b.problem!.operator, correct } })
      if (correct) processSwitchSuccess(b)
      else processSwitchFailure(b)
      return
    }

    if (b.phase !== 'player-turn') return
    const num = parseInt(answer, 10)
    if (isNaN(num)) return
    const correct = checkAnswer(b.problem, num)
    dispatch({ type: 'RECORD_ANSWER', payload: { operator: b.problem.operator, correct } })
    if (correct) processCorrectAnswer(b, b.timeRemaining >= b.problem.timeLimit / 2)
    else processWrongAnswer(b)
  }

  function handleFight() {
    const b = battleRef.current
    if (b && moveOptionsFor(b).length > 0) { setShowMoveMenu(true); return }
    const p = nextProblem()
    setBattle(prev => prev ? { ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit } : prev)
    setAnswer('')
  }

  /** Picking a move comes before the problem; solving it lands the move */
  function handleChooseMove(move: Move) {
    const b = battleRef.current
    if (!b) return
    setShowMoveMenu(false)
    const chosenMove = { uid: trainer.party[b.activeIdx].uid, move }
    const tierName = MATH_TIER_NAMES[moveMathTier(move)]
    const line = `${tierName ? `${tierName}! ` : ''}Solve to use ${capitalize(move.name)}!`
    if (b.phase === 'player-turn') {
      // Changed moves mid-problem. A move with harder or easier math swaps in a
      // new problem, but the clock keeps running, so switching can't dodge one.
      const previous = chosenMoveFor(b)
      const sameMath = moveMathTier(move) === (previous ? moveMathTier(previous) : 0)
      const problem = sameMath ? b.problem : nextProblem(undefined, move)
      setBattle(prev => prev ? { ...prev, chosenMove, problem, log: [...prev.log.slice(-3), line] } : prev)
      if (!sameMath) setAnswer('')
      return
    }
    if (b.phase !== 'choose-action') {
      // Picked while a turn resolves: the next problem uses it
      setBattle(prev => prev ? { ...prev, chosenMove, log: [...prev.log.slice(-3), line] } : prev)
      return
    }
    const p = nextProblem(undefined, move)
    setBattle(prev => prev ? {
      ...prev, chosenMove, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit,
      log: [...prev.log.slice(-3), line],
    } : prev)
    setAnswer('')
  }

  function handleStartCatch() {
    const b = battleRef.current
    if (!b || (b.phase !== 'player-turn' && b.phase !== 'choose-action')) return
    if (trainer.balls.length === 0) {
      setBattle(prev => prev ? { ...prev, log: [...prev.log.slice(-3), 'No Poké Balls! Visit a Poké Mart!'] } : prev)
      return
    }
    setShowBallMenu(true)
  }

  function handleSelectBall(ballId: string) {
    const b = battleRef.current
    if (!b) return
    setShowBallMenu(false)
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId: ballId, quantity: 1 } })
    const { problemsRequired, timePerProblem } = calcCatchDifficulty(b.wildHp / b.wild.maxHp, b.wild.level, ballId, wildOverride?.legendary)
    const p = nextProblem()
    setBattle(prev => prev ? {
      ...prev,
      phase: 'catch-attempt',
      catchProgress: { required: problemsRequired, solved: 0, timePerProblem },
      catchProblem: p,
      catchTimeRemaining: timePerProblem,
      log: [...prev.log.slice(-3), `Solve ${problemsRequired} problem${problemsRequired > 1 ? 's' : ''} to catch ${capitalize(prev.wild.name)}!`],
    } : prev)
    setAnswer('')
  }

  function handleOpenItemMenu() {
    const usableItems = trainer.items.filter(slot => ITEM_MAP[slot.itemId]?.healAmount !== undefined)
    if (usableItems.length === 0) {
      setBattle(prev => prev ? { ...prev, log: [...prev.log.slice(-3), 'No usable items!'] } : prev)
      return
    }
    setShowItemMenu(true)
  }

  function handleUseItemInBattle(itemId: string, targetUid: string) {
    const b = battleRef.current
    if (!b) return
    const def = ITEM_MAP[itemId]
    if (!def) return
    const targetIdx = trainer.party.findIndex(p => p.uid === targetUid)
    if (targetIdx === -1) return
    const pokemon = trainer.party[targetIdx]

    const currentHp = b.partyHps[targetIdx]
    const gain = def.healAmount === 0
      ? pokemon.maxHp - currentHp
      : Math.min(def.healAmount ?? 0, pokemon.maxHp - currentHp)
    const healedHp = currentHp + gain

    const move = pickEnemyMove(b.wild)
    const defender = trainer.party[b.activeIdx]
    const damage = Math.max(1, calcDamage(move, b.wild, defender))

    const newPartyHps = b.partyHps.map((hp, i) => {
      if (i === targetIdx && i === b.activeIdx) return Math.max(0, healedHp - damage)
      if (i === targetIdx) return healedHp
      if (i === b.activeIdx) return Math.max(0, hp - damage)
      return hp
    })

    dispatch({ type: 'REMOVE_ITEM', payload: { itemId, quantity: 1 } })
    setUsingItemInBattle(null)

    const enemyLabel = trainerBattle ? capitalize(b.wild.name) : `Wild ${capitalize(b.wild.name)}`
    const logMsg = `Used ${def.name} on ${capitalize(pokemon.name)}! +${gain} HP, but ${enemyLabel} used ${capitalize(move.name)} for ${damage} damage!`
    const activeHpAfter = newPartyHps[b.activeIdx]

    if (activeHpAfter <= 0) {
      const nextIdx = newPartyHps.findIndex((hp, i) => i !== b.activeIdx && hp > 0)
      if (nextIdx === -1) {
        dispatch({ type: 'HEAL_PARTY' })
        setBattle(prev => prev ? { ...prev, partyHps: newPartyHps, phase: 'blacked-out', log: ['All your Pokémon fainted! You were sent back to safety...'] } : prev)
        return
      }
      setBattle(prev => prev ? {
        ...prev, partyHps: newPartyHps, phase: 'choose-action', activeIdx: nextIdx,
        log: [...prev.log.slice(-3), `${logMsg} Go, ${capitalize(trainer.party[nextIdx].name)}!`],
      } : prev)
      return
    }
    setBattle(prev => prev ? {
      ...prev, partyHps: newPartyHps, phase: 'choose-action',
      log: [...prev.log.slice(-3), logMsg],
    } : prev)
  }

  function handleSubmitCatchAnswer() {
    const b = battleRef.current
    if (!b || b.phase !== 'catch-attempt' || !b.catchProblem || !b.catchProgress) return
    const num = parseInt(answer, 10)
    if (isNaN(num)) return
    const correct = checkAnswer(b.catchProblem, num)
    dispatch({ type: 'RECORD_ANSWER', payload: { operator: b.catchProblem.operator, correct } })
    setAnswer('')

    if (!correct) {
      setBattle(prev => prev ? { ...prev, log: [...prev.log.slice(-3), 'Not quite! Try again!'] } : prev)
      return
    }

    const newSolved = b.catchProgress.solved + 1
    if (newSolved >= b.catchProgress.required) {
      // All problems solved — catch success
      const caught: OwnedPokemon = {
        uid: crypto.randomUUID(),
        speciesId: b.wild.speciesId,
        name: b.wild.name,
        level: b.wild.level,
        xp: 0,
        xpToNextLevel: pokemonXpToNextLevel(b.wild.level),
        currentHp: b.wildHp,
        maxHp: b.wild.maxHp,
        stats: b.wild.stats,
        baseStats: b.wild.baseStats,
        moves: b.wild.moves,
        caughtAt: Date.now(),
      }
      playCatch()
      persistHps(b)
      dispatch({ type: 'CATCH_POKEMON', payload: { pokemon: caught } })
      awardXp(b, battleXpReward(b.wild.level))
      setBattle(prev => prev ? {
        ...prev,
        phase: 'caught',
        log: [`Gotcha! ${capitalize(b.wild.name)} was caught!`],
      } : prev)
    } else {
      playCorrect()
      const p = nextProblem()
      setBattle(prev => prev ? {
        ...prev,
        catchProgress: { ...prev.catchProgress!, solved: newSolved },
        catchProblem: p,
        catchTimeRemaining: prev.catchProgress!.timePerProblem,
        log: [...prev.log.slice(-3), `${newSolved} / ${b.catchProgress!.required} — keep going!`],
      } : prev)
    }
  }

  function handleFlee() {
    const b = battleRef.current
    if (!b) return
    const rawProblem = generateProblem(Math.max(1, Math.floor(area.mathDifficulty / 2)))
    const playerLevel = trainer.party[b.activeIdx]?.level ?? 1
    const levelDiff = playerLevel - b.wild.level
    const multiplier = trainer.timerMultiplier ?? 1
    const timeLimit = Math.max(5, Math.min(45, Math.round(
      (rawProblem.timeLimit + Math.round(levelDiff * 0.5)) * multiplier
    )))
    const p = { ...rawProblem, timeLimit }
    setBattle(prev => prev ? {
      ...prev, phase: 'run-attempt', problem: p, timeRemaining: p.timeLimit,
      log: [...prev.log.slice(-3), 'Solve this to escape!'],
    } : prev)
    setAnswer('')
  }

  function handleSwitch(partyIdx: number) {
    const base = nextProblem(partyIdx)
    const switchProblem = { ...base, timeLimit: Math.max(5, Math.round(base.timeLimit / 2)) }
    setBattle(prev => prev ? {
      ...prev,
      phase: 'switch-attempt',
      switchTargetIdx: partyIdx,
      problem: switchProblem,
      timeRemaining: switchProblem.timeLimit,
      log: [...prev.log.slice(-3), `Solve to bring in ${capitalize(trainer.party[partyIdx].name)} safely!`],
    } : prev)
    closeSwitchMenu()
    setAnswer('')
  }

  function processSwitchSuccess(b: BattleData) {
    const targetIdx = b.switchTargetIdx!
    playCorrect()
    setBattle(prev => prev ? {
      ...prev,
      phase: 'choose-action',
      activeIdx: targetIdx,
      switchTargetIdx: null,
      problem: null,
      log: [...prev.log.slice(-3), `Go, ${capitalize(trainer.party[targetIdx].name)}!`],
    } : prev)
    setAnswer('')
  }

  function processSwitchFailure(b: BattleData) {
    const targetIdx = b.switchTargetIdx!
    playWrong()
    const move = pickEnemyMove(b.wild)
    const defender = trainer.party[targetIdx]
    const damage = Math.max(1, calcDamage(move, b.wild, defender))
    const newHp = Math.max(0, b.partyHps[targetIdx] - damage)
    const newPartyHps = b.partyHps.map((hp, i) => i === targetIdx ? newHp : hp)
    const enemyLabelSwitch = trainerBattle ? capitalize(b.wild.name) : `Wild ${capitalize(b.wild.name)}`
    const switchMsg = `${capitalize(trainer.party[targetIdx].name)} came in! But ${enemyLabelSwitch} used ${capitalize(move.name)} for ${damage} damage!`

    if (newHp <= 0) {
      const nextIdx = newPartyHps.findIndex((hp, i) => i !== targetIdx && hp > 0)
      if (nextIdx === -1) {
        dispatch({ type: 'HEAL_PARTY' })
        setBattle(prev => prev ? {
          ...prev, partyHps: newPartyHps, switchTargetIdx: null, phase: 'blacked-out',
          log: ['All your Pokémon fainted! You were sent back to safety...'],
        } : prev)
        return
      }
      setBattle(prev => prev ? {
        ...prev, partyHps: newPartyHps, phase: 'choose-action',
        activeIdx: nextIdx, switchTargetIdx: null, problem: null,
        log: [...prev.log.slice(-3), `${switchMsg} ${capitalize(trainer.party[targetIdx].name)} fainted! Go, ${capitalize(trainer.party[nextIdx].name)}!`],
      } : prev)
      setAnswer('')
      return
    }

    setBattle(prev => prev ? {
      ...prev,
      partyHps: newPartyHps,
      phase: 'choose-action',
      activeIdx: targetIdx,
      switchTargetIdx: null,
      problem: null,
      log: [...prev.log.slice(-3), switchMsg],
    } : prev)
    setAnswer('')
  }

  function closeSwitchMenu(cancelled = false) {
    if (cancelled) {
      const activeName = capitalize(trainer.party[battleRef.current?.activeIdx ?? 0]?.name ?? '')
      setBattle(prev => prev ? {
        ...prev,
        log: [...prev.log.slice(-3), `What will ${activeName} do?`],
      } : prev)
    }
    setShowSwitch(false)
    setSwitchHighlight(null)
  }

  function openSwitchMenu() {
    setBattle(prev => prev ? {
      ...prev,
      log: [...prev.log.slice(-3), 'Which Pokémon should battle next?'],
    } : prev)
    setShowSwitch(true)
    setSwitchHighlight(null)
  }

  function openSwitchMenuForTrainerSend() {
    setBattle(prev => prev ? {
      ...prev,
      log: [...prev.log.slice(-3), 'Which Pokémon will you send out?'],
    } : prev)
    setShowSwitch(true)
    setSwitchHighlight(null)
  }

  function handleNoSwitchBeforeTrainerSend() {
    const ps = pendingTrainerSend!
    setPendingTrainerSend(null)
    setBattle(prev => prev ? {
      ...prev,
      log: [...prev.log.slice(-3), `${trainerBattle?.trainerName} sent out ${capitalize(ps.nextEnemy.name)}!`],
    } : prev)
  }

  function handleFreeSwitchForTrainerSend(partyIdx: number) {
    const ps = pendingTrainerSend!
    setBattle(prev => prev ? {
      ...prev,
      activeIdx: partyIdx,
      switchTargetIdx: null,
      log: [...prev.log.slice(-3), `Go, ${capitalize(trainer.party[partyIdx].name)}! ${trainerBattle?.trainerName} sent out ${capitalize(ps.nextEnemy.name)}!`],
    } : prev)
    setPendingTrainerSend(null)
    setShowSwitch(false)
    setSwitchHighlight(null)
  }

  function handleAction(action: 'fight' | 'catch' | 'items' | 'switch' | 'run') {
    if (action === 'fight')  handleFight()
    if (action === 'catch')  handleStartCatch()
    if (action === 'items')  handleOpenItemMenu()
    if (action === 'switch') openSwitchMenu()
    if (action === 'run')    handleFlee()
  }

  // ---- Derived values --------------------------------------------------------

  if (!battle) {
    return (
      <div className="battle-screen battle-screen--loading">
        <div className="spinner" />
        <p>{trainerBattle ? `${trainerBattle.trainerName} wants to battle!` : 'A wild Pokémon appeared…'}</p>
      </div>
    )
  }

  const { phase, wild, wildHp, partyHps, activeIdx, problem, timeRemaining } = battle
  const activeParty = trainer.party[activeIdx]
  const activeHp = partyHps[activeIdx] ?? 0
  const isTerminal = isBattleOutcome(phase)
  const inputBlocked = phase !== 'player-turn' && phase !== 'catch-attempt' && phase !== 'run-attempt' && phase !== 'switch-attempt'
  const switchableCount = trainer.party.filter((_, i) => i !== activeIdx && (partyHps[i] ?? 0) > 0).length
  const moveOptions = moveOptionsFor(battle)
  const chosenMove = chosenMoveFor(battle)

  const numpadProps = {
    onDigit: (d: string) => setAnswer(a => a.length < 4 ? a + d : a),
    onDelete: () => setAnswer(a => a.slice(0, -1)),
  }

  // ---- Render ----------------------------------------------------------------

  function handleMuteToggle() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  return (
    <div className="battle-screen">
      <button className="mute-btn" onClick={handleMuteToggle} title={muted ? 'Unmute' : 'Mute'}>
        {muted ? '🔇' : '🔊'}
      </button>

      {/* ── Field ── */}
      <div className="battle-field" style={getBattleFieldStyle(area.id)}>
        <div className="battle-field__enemy-status">
          <span className="battle-status__name">{capitalize(wild.name)}</span>
          <span className="battle-status__level">Lv.{wild.level}</span>
          <HpBar current={wildHp} max={wild.maxHp} />
        </div>
        <div className="battle-field__sprites">
          <img
            className={`battle-sprite battle-sprite--player${phase === 'resolving-correct' ? ' battle-sprite--lunge' : phase === 'resolving-wrong' ? ' battle-sprite--hit' : ''}`}
            src={battle.playerSprites[activeIdx]}
            alt={activeParty?.name ?? ''}
          />
          <img
            className={`battle-sprite battle-sprite--enemy${phase === 'resolving-wrong' ? ' battle-sprite--lunge' : phase === 'resolving-correct' ? ' battle-sprite--hit' : ''}`}
            src={battle.wildSprite}
            alt={wild.name}
          />
        </div>
        {activeParty && (
          <div className="battle-field__player-status">
            <span className="battle-status__name">{capitalize(activeParty.name)}</span>
            <span className="battle-status__level">Lv.{activeParty.level}</span>
            <HpBar current={activeHp} max={activeParty.maxHp} />
            <span className="battle-status__hp-text">{activeHp} / {activeParty.maxHp}</span>
            <XpBar xp={activeParty.xp} max={activeParty.xpToNextLevel} />
          </div>
        )}
        {(phase === 'player-turn' || phase === 'run-attempt' || phase === 'switch-attempt' || phase === 'resolving-correct' || phase === 'resolving-wrong') && problem && !showSwitch && !showMoveMenu && (
          <TimerRing
            remaining={timeRemaining}
            total={problem.timeLimit}
            overlay
            flash={phase === 'resolving-correct' ? 'correct' : phase === 'resolving-wrong' ? 'wrong' : undefined}
          />
        )}
        {phase === 'catch-attempt' && battle.catchProgress && (
          <TimerRing remaining={battle.catchTimeRemaining} total={battle.catchProgress.timePerProblem} overlay />
        )}
      </div>

      {/* ── Command panel ── */}
      <div className="battle-commands">
        <div className="battle-commands__inner">

          {/* Full-width equation row */}
          {!isTerminal && !showSwitch && !showMoveMenu && (
            phase === 'catch-attempt' && battle.catchProgress && battle.catchProblem ? (
              <>
                <div className="catch-header">
                  <span className="catch-header__label">Catching {capitalize(wild.name)}!</span>
                  <span className="catch-header__progress">
                    {battle.catchProgress.solved} / {battle.catchProgress.required} solved
                  </span>
                </div>
                <div className="battle-problem">
                  <span className="battle-problem__text">
                    {battle.catchProblem.operands.join(` ${battle.catchProblem.operator} `)} = ?
                  </span>
                  <span className="battle-problem__answer">{answer || '_'}</span>
                </div>
              </>
            ) : problem ? (
              (() => {
                const isResolving = phase === 'resolving-correct' || phase === 'resolving-wrong'
                return (
                  <div className={`battle-problem${phase === 'resolving-correct' ? ' battle-problem--correct' : phase === 'resolving-wrong' ? ' battle-problem--wrong' : ''}`}>
                    <span className="battle-problem__text">
                      {problem.operands.join(` ${problem.operator} `)} = {isResolving ? (answer || '?') : '?'}
                    </span>
                    {!isResolving && (
                      <span className="battle-problem__answer">{answer || '_'}</span>
                    )}
                  </div>
                )
              })()
            ) : null
          )}

          {/* Bottom row: log + actions (left) | numpad / result (right) */}
          <div className={`battle-commands__row${showSwitch || showMoveMenu ? ' battle-commands__row--switch' : ''}`}>

            <div className="battle-commands__left">
              <div className="battle-log">
                <p className="battle-log__line">{battle.log[battle.log.length - 1]}</p>
              </div>
              {!isTerminal && !showSwitch && !showMoveMenu && !pendingTrainerSend && phase !== 'catch-attempt' && phase !== 'run-attempt' && phase !== 'switch-attempt' && !showBallMenu && !showItemMenu && !usingItemInBattle && (
                <div className="battle-action-strip">
                  {ACTION_BUTTONS.map(([action, label]) => {
                    const isResolving = phase === 'resolving-correct' || phase === 'resolving-wrong'
                    // Mid-problem, Fight reopens the move menu to change moves
                    const canChangeMove = phase === 'player-turn' && moveOptions.length > 0
                    const isFighting = action === 'fight' && phase !== 'choose-action' && !canChangeMove
                    const noSwitchable = action === 'switch' && switchableCount === 0
                    const notAllowed = !!trainerBattle && (action === 'catch' || action === 'run')
                    return (
                      <button
                        key={action}
                        className={`numpad-btn numpad-btn--${action}`}
                        disabled={isResolving || isFighting || noSwitchable || notAllowed}
                        onClick={() => handleAction(action)}
                      >
                        <span className="numpad-btn__bg-icon"><BattleActionIcon action={action} /></span>
                        <span className="numpad-btn__label">({label[0]}){' '}{label.slice(1)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right column always rendered so left column width stays fixed */}
            <div className="battle-commands__right">
              {isTerminal && evolutionChoice ? (
                <div className="battle-result-panel evolution-choice">
                  <p className="evolution-choice__prompt">✨ Evolve {evolutionChoice.prevName} into…</p>
                  <div className="evolution-choice__options">
                    {evolutionChoice.options.map((id, i) => (
                      <button key={id} className="btn btn-primary" onClick={() => resolveEvolutionChoice(id)}>
                        ({i + 1}) {KANTO_NAMES[id] ?? `#${id}`}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-secondary" onClick={() => resolveEvolutionChoice(null)}>Not now</button>
                </div>
              ) : isTerminal ? (
                <div className="battle-result-panel">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      if (trainerBattle) trainerBattle.onComplete(phase === 'victory')
                      else if (isBattleOutcome(phase)) onBattleEnd(phase)
                    }}
                  >
                    Continue{phase === 'blacked-out' ? ' (healed)' : ''}
                  </button>
                </div>
              ) : showSwitch ? (
                <div className="switch-menu switch-menu--grid">
                  {trainer.party.map((p, i) => {
                    const hp = partyHps[i] ?? 0
                    const isCurrent = i === activeIdx
                    const isFainted = hp === 0
                    const unavailable = isCurrent || isFainted
                    const isHighlighted = i === switchHighlight && !unavailable
                    const tag = isCurrent ? 'active' : isFainted ? 'fainted' : null
                    return (
                      <button
                        key={p.uid}
                        className={`switch-btn${isCurrent ? ' switch-btn--current' : isFainted ? ' switch-btn--fainted' : ''}${isHighlighted ? ' switch-btn--highlighted' : ''}`}
                        disabled={unavailable}
                        onClick={() => pendingTrainerSend ? handleFreeSwitchForTrainerSend(i) : handleSwitch(i)}
                      >
                        <span className="switch-btn__name">
                          <span className="switch-btn__num">{i + 1}</span>
                          {capitalize(p.name)}
                          {tag && <span className="switch-btn__tag">({tag})</span>}
                        </span>
                        <span className="switch-btn__level">Lv.{p.level}</span>
                        <span className="switch-btn__hp">{hp}/{p.maxHp} HP</span>
                      </button>
                    )
                  })}
                  <button className="switch-btn switch-btn--cancel" onClick={() => closeSwitchMenu(true)}>
                    Cancel
                  </button>
                </div>
              ) : showMoveMenu ? (
                <div className="switch-menu switch-menu--grid">
                  {moveOptions.map((m, i) => (
                    <button
                      key={m.id}
                      className={`switch-btn${m.id === chosenMove?.id ? ' switch-btn--current' : ''}`}
                      onClick={() => handleChooseMove(m)}
                    >
                      <span className="switch-btn__name">
                        <span className="switch-btn__num">{i + 1}</span>
                        {capitalize(m.name)}
                      </span>
                      <span className="switch-btn__hp">Power {m.power}</span>
                      {moveMathTier(m) > 0 && <span className="switch-btn__math">{MATH_TIER_NAMES[moveMathTier(m)]}</span>}
                    </button>
                  ))}
                  <button className="switch-btn switch-btn--cancel" onClick={() => setShowMoveMenu(false)}>
                    Cancel
                  </button>
                </div>
              ) : showBallMenu ? (
                <div className="switch-menu">
                  {trainer.balls.map(slot => {
                    const def = ITEM_MAP[slot.itemId]
                    if (!def) return null
                    return (
                      <button key={slot.itemId} className="switch-btn" onClick={() => handleSelectBall(slot.itemId)}>
                        <span className="switch-btn__name">{BALL_EMOJI[slot.itemId] ?? '⚪'} {def.name}</span>
                        <span className="switch-btn__hp">×{slot.quantity}</span>
                      </button>
                    )
                  })}
                  <button className="switch-btn switch-btn--cancel" onClick={() => setShowBallMenu(false)}>
                    Cancel
                  </button>
                </div>
              ) : showItemMenu ? (
                <div className="switch-menu">
                  {trainer.items.filter(slot => ITEM_MAP[slot.itemId]?.healAmount !== undefined).map(slot => {
                    const def = ITEM_MAP[slot.itemId]!
                    return (
                      <button key={slot.itemId} className="switch-btn" onClick={() => { setShowItemMenu(false); setUsingItemInBattle(slot.itemId) }}>
                        <span className="switch-btn__name">{ITEM_EMOJI[slot.itemId] ?? '📦'} {def.name}</span>
                        <span className="switch-btn__hp">×{slot.quantity}</span>
                      </button>
                    )
                  })}
                  <button className="switch-btn switch-btn--cancel" onClick={() => setShowItemMenu(false)}>
                    Cancel
                  </button>
                </div>
              ) : pendingTrainerSend && !showSwitch ? (
                <div className="battle-result-panel trainer-send-prompt">
                  <p className="trainer-send-prompt__question">Switch Pokémon?</p>
                  <button className="btn btn-primary trainer-send-prompt__btn" onClick={openSwitchMenuForTrainerSend}>
                    (S) Yes, switch!
                  </button>
                  <button className="btn btn-secondary trainer-send-prompt__btn" onClick={handleNoSwitchBeforeTrainerSend}>
                    (N) No, continue
                  </button>
                </div>
              ) : usingItemInBattle ? (
                <div className="switch-menu">
                  <div className="switch-btn switch-btn--current" style={{ cursor: 'default', pointerEvents: 'none' }}>
                    <span className="switch-btn__name">Use on which Pokémon?</span>
                  </div>
                  {trainer.party.map((p, i) => {
                    const hp = partyHps[i] ?? 0
                    const fainted = hp === 0
                    const alreadyFull = hp === p.maxHp
                    const disabled = fainted || alreadyFull
                    return (
                      <button
                        key={p.uid}
                        className={`switch-btn${disabled ? ' switch-btn--fainted' : ''}`}
                        disabled={disabled}
                        onClick={() => handleUseItemInBattle(usingItemInBattle, p.uid)}
                      >
                        <span className="switch-btn__name">{capitalize(p.name)}</span>
                        <span className="switch-btn__hp">
                          {fainted ? 'Fainted' : alreadyFull ? `${hp}/${p.maxHp} (full)` : `${hp}/${p.maxHp} HP`}
                        </span>
                      </button>
                    )
                  })}
                  <button className="switch-btn switch-btn--cancel" onClick={() => setUsingItemInBattle(null)}>
                    Cancel
                  </button>
                </div>
              ) : (phase === 'player-turn' || phase === 'resolving-correct' || phase === 'resolving-wrong' || phase === 'catch-attempt' || phase === 'run-attempt' || phase === 'switch-attempt') ? (
                <NumberPad
                  {...numpadProps}
                  onSubmit={phase === 'catch-attempt' ? handleSubmitCatchAnswer : handleSubmitAnswer}
                  disabled={inputBlocked}
                />
              ) : null}
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

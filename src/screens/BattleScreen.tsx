import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import { useTrainer, useGameStore } from '../store'
import { fetchPokemonSpecies } from '../services/pokeApi'
import { spawnWildPokemon, calcDamage, calcCatchDifficulty } from '../utils/battle'
import { pickEncounter, pickLevel } from '../utils/encounter'
import { generateProblem, checkAnswer } from '../utils/math'
import { battleXpReward, trainerXpReward, pokemonXpToNextLevel } from '../utils/formulas'
import { playCorrect, playWrong, playCatch, playVictory, playLevelUp, isMuted, setMuted } from '../utils/sound'
import { EVOLUTIONS } from '../data/evolutions'
import type { Area, BattlePhase, MathProblem, Move, OwnedPokemon, WildPokemon } from '../types'
import './BattleScreen.css'

// ---- Constants ---------------------------------------------------------------

const MATH_ATTACK: Move = {
  id: 0, name: 'math attack', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical',
}
const TACKLE: Move = {
  id: 33, name: 'tackle', type: 'normal', power: 35, accuracy: 100, damageClass: 'physical',
}

function pickEnemyMove(wild: WildPokemon): Move {
  const damaging = wild.moves.filter(m => m.power !== null && (m.power ?? 0) > 0)
  if (damaging.length === 0) return TACKLE
  return damaging[Math.floor(Math.random() * damaging.length)]
}

function pickPlayerMove(pokemon: OwnedPokemon): Move {
  const damaging = (pokemon.moves ?? []).filter(m => m.power !== null && (m.power ?? 0) > 0)
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
}

// ---- Battle field backgrounds -----------------------------------------------

// Each entry: [sky-top, sky-bottom, ground-top, ground-bottom]
const FIELD_THEMES: Record<string, [string, string, string, string]> = {
  'route-1':         ['#87ceeb', '#b8e4f8', '#78c840', '#3a7a18'],
  'viridian-city':   ['#6ab0c0', '#3a8898', '#5a7060', '#283830'],
  'viridian-forest': ['#1a4028', '#0d2818', '#2a4a18', '#0a1c08'],
  'pewter-city':     ['#8090a8', '#5a6890', '#808888', '#505858'],
  'mt-moon':         ['#0a0520', '#1a0a40', '#100820', '#060410'],
  'cerulean-city':   ['#70c8f8', '#38a0e0', '#1060c8', '#083880'],
  'rock-tunnel':     ['#100808', '#1c0e08', '#2a1808', '#140c04'],
  'lavender-town':   ['#280838', '#4a1870', '#2a1838', '#100818'],
  'celadon-city':    ['#50b870', '#309050', '#20a060', '#0a5830'],
  'fuchsia-city':    ['#780848', '#b83080', '#400820', '#200408'],
  'cinnabar-island': ['#280408', '#681008', '#b83008', '#c04808'],
  'victory-road':    ['#080c10', '#101820', '#181820', '#080810'],
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

const ACTION_BUTTONS = [
  ['fight',  '⚔',  'Fight'],
  ['catch',  '🎣', 'Catch'],
  ['switch', '🔄', 'Switch'],
  ['run',    '🏃', 'Run'],
] as const

function NumberPad({ mode = 'digits', onDigit, onDelete, onSubmit, onAction, switchableCount, disabled }: {
  mode?: 'digits' | 'actions'
  onDigit?: (d: string) => void
  onDelete?: () => void
  onSubmit?: () => void
  onAction?: (a: 'fight' | 'catch' | 'switch' | 'run') => void
  switchableCount?: number
  disabled?: boolean
}) {
  if (mode === 'actions') {
    return (
      <div className="numpad numpad--actions">
        {ACTION_BUTTONS.map(([action, icon, label]) => (
          <button
            key={action}
            className={`numpad-btn numpad-btn--${action}`}
            disabled={action === 'switch' && (switchableCount ?? 0) === 0}
            onClick={() => onAction?.(action)}
          >
            <span className="numpad-btn__bg-icon" aria-hidden="true">{icon}</span>
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
  onBattleEnd: () => void
}

export default function BattleScreen({ area, onBattleEnd }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()

  const [battle, setBattle] = useState<BattleData | null>(null)
  const [answer, setAnswer] = useState('')
  const [showSwitch, setShowSwitch] = useState(false)
  const [switchHighlight, setSwitchHighlight] = useState<number | null>(null)
  const battleRef = useRef<BattleData | null>(null)
  const evolvedRef = useRef<Set<string>>(new Set())
  const prevLevelRef = useRef<Record<string, number>>({})
  const [muted, setMutedState] = useState(isMuted())

  useEffect(() => { battleRef.current = battle }, [battle])

  // ---- Initialise battle -----------------------------------------------------

  useEffect(() => {
    let cancelled = false
    async function init() {
      const entry = pickEncounter(area)
      const level = pickLevel(entry)
      const [wildSpecies, ...partySpecies] = await Promise.all([
        fetchPokemonSpecies(entry.speciesId),
        ...trainer.party.map(p => fetchPokemonSpecies(p.speciesId)),
      ])
      if (cancelled) return
      const wild = spawnWildPokemon(wildSpecies, level)
      dispatch({ type: 'SEE_POKEMON', payload: { speciesId: wild.speciesId } })
      const partyHps = trainer.party.map(p => p.currentHp)
      const firstAlive = partyHps.findIndex(hp => hp > 0)
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
        log: [`A wild ${capitalize(wild.name)} appeared!`],
        wildSprite: wildSpecies.sprites.front,
        playerSprites: partySpecies.map(s => s.sprites.back),
      })
    }
    init()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Helpers ---------------------------------------------------------------

  const nextProblem = useCallback((overrideIdx?: number) => {
    const base = generateProblem(area.mathDifficulty)
    const b = battleRef.current
    const idx = overrideIdx ?? b?.activeIdx ?? 0
    const playerLevel = trainer.party[idx]?.level ?? 1
    const wildLevel = b?.wild.level ?? 1
    const levelDiff = playerLevel - wildLevel
    const adjusted = Math.max(5, Math.min(45, base.timeLimit + Math.round(levelDiff * 0.5)))
    return { ...base, timeLimit: adjusted }
  }, [area.mathDifficulty, trainer.party])

  function persistHps(b: BattleData) {
    trainer.party.forEach((member, i) => {
      const hp = b.partyHps[i]
      if (hp !== undefined && hp !== member.currentHp) {
        dispatch({ type: 'UPDATE_POKEMON_HP', payload: { uid: member.uid, currentHp: hp } })
      }
    })
  }

  function handleVictory(b: BattleData) {
    playVictory()
    const pkmnXp = battleXpReward(b.wild.level)
    const trXp = trainerXpReward(b.wild.level)
    persistHps(b)
    dispatch({ type: 'GAIN_TRAINER_XP', payload: { amount: trXp } })
    dispatch({ type: 'GAIN_POKEMON_XP', payload: { uid: trainer.party[b.activeIdx].uid, amount: pkmnXp } })
    setBattle(prev => prev ? {
      ...prev,
      phase: 'victory',
      log: [`Wild ${capitalize(b.wild.name)} fainted! ${capitalize(trainer.party[b.activeIdx].name)} gained ${pkmnXp} XP!`],
    } : prev)
  }

  function handleBlackout(_b: BattleData) {
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

      if (b.phase === 'resolving-correct') {
        if (b.wildHp <= 0) { handleVictory(b); return }
        const p = nextProblem()
        setBattle(prev => prev ? { ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit } : prev)
        setAnswer('')
        return
      }

      if (b.phase === 'resolving-wrong') {
        if (b.partyHps[b.activeIdx] <= 0) {
          const nextIdx = b.partyHps.findIndex((hp, i) => i !== b.activeIdx && hp > 0)
          if (nextIdx === -1) { handleBlackout(b); return }
          // Forced switch after faint — pause at choose-action so player can react
          setBattle(prev => prev ? {
            ...prev, phase: 'choose-action', activeIdx: nextIdx, problem: null,
            log: [...prev.log.slice(-3), `Go, ${capitalize(trainer.party[nextIdx].name)}!`],
          } : prev)
          return
        }
        const p = nextProblem()
        setBattle(prev => prev ? { ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit } : prev)
        setAnswer('')
        return
      }
    }, 800)
    return () => clearTimeout(t)
  }, [battle?.phase])  // eslint-disable-line

  // Player-turn timer tick (paused while switch menu is open)
  useEffect(() => {
    if (!battle || battle.phase !== 'player-turn' || battle.timeRemaining <= 0 || showSwitch) return
    const t = setTimeout(() => {
      setBattle(prev => prev?.phase === 'player-turn' ? { ...prev, timeRemaining: prev.timeRemaining - 1 } : prev)
    }, 1000)
    return () => clearTimeout(t)
  }, [battle?.phase, battle?.timeRemaining, showSwitch])

  // Player-turn timer expired → wrong answer
  useEffect(() => {
    if (!battle || battle.phase !== 'player-turn' || battle.timeRemaining > 0) return
    const b = battleRef.current
    if (!b || b.phase !== 'player-turn') return
    processWrongAnswer(b)
  }, [battle?.phase, battle?.timeRemaining])  // eslint-disable-line

  // Catch-attempt timer tick
  useEffect(() => {
    if (!battle || battle.phase !== 'catch-attempt' || battle.catchTimeRemaining <= 0) return
    const t = setTimeout(() => {
      setBattle(prev => prev?.phase === 'catch-attempt' ? { ...prev, catchTimeRemaining: prev.catchTimeRemaining - 1 } : prev)
    }, 1000)
    return () => clearTimeout(t)
  }, [battle?.phase, battle?.catchTimeRemaining])

  // Catch-attempt timer expired → fail
  useEffect(() => {
    if (!battle || battle.phase !== 'catch-attempt' || battle.catchTimeRemaining > 0) return
    const p = nextProblem()
    setBattle(prev => prev ? {
      ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit,
      catchProgress: null, catchProblem: null,
      log: [...prev.log.slice(-3), `Wild ${capitalize(prev.wild.name)} broke free!`],
    } : prev)
    setAnswer('')
  }, [battle?.phase, battle?.catchTimeRemaining])  // eslint-disable-line

  // Run-attempt timer tick
  useEffect(() => {
    if (!battle || battle.phase !== 'run-attempt' || battle.timeRemaining <= 0) return
    const t = setTimeout(() => {
      setBattle(prev => prev?.phase === 'run-attempt' ? { ...prev, timeRemaining: prev.timeRemaining - 1 } : prev)
    }, 1000)
    return () => clearTimeout(t)
  }, [battle?.phase, battle?.timeRemaining])

  // Run-attempt timer expired → failure
  useEffect(() => {
    if (!battle || battle.phase !== 'run-attempt' || battle.timeRemaining > 0) return
    const b = battleRef.current
    if (!b || b.phase !== 'run-attempt') return
    processRunFailure(b)
  }, [battle?.phase, battle?.timeRemaining])  // eslint-disable-line

  // Switch-attempt timer tick
  useEffect(() => {
    if (!battle || battle.phase !== 'switch-attempt' || battle.timeRemaining <= 0) return
    const t = setTimeout(() => {
      setBattle(prev => prev?.phase === 'switch-attempt' ? { ...prev, timeRemaining: prev.timeRemaining - 1 } : prev)
    }, 1000)
    return () => clearTimeout(t)
  }, [battle?.phase, battle?.timeRemaining])

  // Switch-attempt timer expired → failure (switch happens but enemy attacks)
  useEffect(() => {
    if (!battle || battle.phase !== 'switch-attempt' || battle.timeRemaining > 0) return
    const b = battleRef.current
    if (!b || b.phase !== 'switch-attempt') return
    processSwitchFailure(b)
  }, [battle?.phase, battle?.timeRemaining])  // eslint-disable-line

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
    if (!evo || pokemon.level < evo.atLevel) return

    evolvedRef.current.add(key)
    const prevName = capitalize(pokemon.name)

    fetchPokemonSpecies(evo.evolvesIntoId).then(newSpecies => {
      dispatch({
        type: 'EVOLVE_POKEMON',
        payload: {
          uid: pokemon.uid,
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
  }, [battle?.phase]) // eslint-disable-line

  // ---- Keyboard input --------------------------------------------------------

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const b = battleRef.current
      if (!b) return

      // Terminal phase: Enter continues
      const terminal = b.phase === 'victory' || b.phase === 'caught' || b.phase === 'fled' || b.phase === 'blacked-out'
      if (terminal) {
        if (e.key === 'Enter') { e.preventDefault(); onBattleEnd() }
        return
      }

      // Branch A: action selection
      if (b.phase === 'choose-action' && !showSwitch) {
        const switchable = trainer.party.filter((_, i) => i !== b.activeIdx && (b.partyHps[i] ?? 0) > 0)
        const actionMap: Record<string, () => void> = {
          'f': handleFight,
          'c': handleStartCatch,
          'r': handleFlee,
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
        if (e.key === 'c') { e.preventDefault(); handleStartCatch(); return }
        if (e.key === 's' && switchable.length > 0) { e.preventDefault(); openSwitchMenu(); return }
        if (e.key === 'r') { e.preventDefault(); handleFlee(); return }
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
  }, [answer, showSwitch, switchHighlight]) // eslint-disable-line

  // ---- Action handlers -------------------------------------------------------

  function processCorrectAnswer(b: BattleData, fast: boolean) {
    playCorrect()
    const attacker = trainer.party[b.activeIdx]
    const move = pickPlayerMove(attacker)
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
      logLines[0] += ` But Wild ${capitalize(b.wild.name)} countered for ${counterDmg}!`
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
    setBattle(prev => prev ? {
      ...prev,
      phase: 'resolving-wrong',
      partyHps: newPartyHps,
      log: [...prev.log.slice(-3), `Wild ${capitalize(b.wild.name)} used ${capitalize(move.name)} for ${damage} damage!`],
    } : prev)
  }

  function processRunFailure(b: BattleData) {
    playWrong()
    const move = pickEnemyMove(b.wild)
    const defender = trainer.party[b.activeIdx]
    const damage = Math.max(1, calcDamage(move, b.wild, defender))
    const newHp = Math.max(0, b.partyHps[b.activeIdx] - damage)
    const newPartyHps = b.partyHps.map((hp, i) => i === b.activeIdx ? newHp : hp)
    const failMsg = `Couldn't escape! Wild ${capitalize(b.wild.name)} used ${capitalize(move.name)} for ${damage} damage!`

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
    const p = nextProblem()
    setBattle(prev => prev ? { ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit } : prev)
  }

  function handleStartCatch() {
    const b = battleRef.current
    if (!b || (b.phase !== 'player-turn' && b.phase !== 'choose-action')) return
    const { problemsRequired, timePerProblem } = calcCatchDifficulty(b.wildHp / b.wild.maxHp, b.wild.level)
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
        moves: b.wild.moves,
        caughtAt: Date.now(),
      }
      playCatch()
      persistHps(b)
      dispatch({ type: 'CATCH_POKEMON', payload: { pokemon: caught } })
      dispatch({ type: 'GAIN_TRAINER_XP', payload: { amount: trainerXpReward(b.wild.level) } })
      dispatch({ type: 'GAIN_POKEMON_XP', payload: { uid: trainer.party[b.activeIdx].uid, amount: battleXpReward(b.wild.level) } })
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
    const timeLimit = Math.max(5, Math.min(45, rawProblem.timeLimit + Math.round(levelDiff * 0.5)))
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
    const switchMsg = `${capitalize(trainer.party[targetIdx].name)} came in! But Wild ${capitalize(b.wild.name)} used ${capitalize(move.name)} for ${damage} damage!`

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

  function handleAction(action: 'fight' | 'catch' | 'switch' | 'run') {
    if (action === 'fight')  handleFight()
    if (action === 'catch')  handleStartCatch()
    if (action === 'switch') openSwitchMenu()
    if (action === 'run')    handleFlee()
  }

  // ---- Derived values --------------------------------------------------------

  if (!battle) {
    return (
      <div className="battle-screen battle-screen--loading">
        <div className="spinner" />
        <p>A wild Pokémon appeared…</p>
      </div>
    )
  }

  const { phase, wild, wildHp, partyHps, activeIdx, problem, timeRemaining } = battle
  const activeParty = trainer.party[activeIdx]
  const activeHp = partyHps[activeIdx] ?? 0
  const isTerminal = phase === 'victory' || phase === 'caught' || phase === 'fled' || phase === 'blacked-out'
  const inputBlocked = phase !== 'player-turn' && phase !== 'catch-attempt' && phase !== 'run-attempt' && phase !== 'switch-attempt'
  const switchableCount = trainer.party.filter((_, i) => i !== activeIdx && (partyHps[i] ?? 0) > 0).length

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
        {(phase === 'player-turn' || phase === 'run-attempt' || phase === 'switch-attempt' || phase === 'resolving-correct' || phase === 'resolving-wrong') && problem && !showSwitch && (
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
          {!isTerminal && !showSwitch && (
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
          <div className="battle-commands__row">

            <div className="battle-commands__left">
              <div className="battle-log">
                <p className="battle-log__line">{battle.log[battle.log.length - 1]}</p>
              </div>
              {!isTerminal && phase !== 'catch-attempt' && phase !== 'run-attempt' && phase !== 'switch-attempt' && (
                <div className="battle-action-strip">
                  {ACTION_BUTTONS.map(([action, icon, label]) => {
                    const isResolving = phase === 'resolving-correct' || phase === 'resolving-wrong'
                    const isFighting = action === 'fight' && phase !== 'choose-action'
                    const noSwitchable = action === 'switch' && switchableCount === 0
                    return (
                      <button
                        key={action}
                        className={`numpad-btn numpad-btn--${action}`}
                        disabled={isResolving || isFighting || noSwitchable}
                        onClick={() => handleAction(action)}
                      >
                        <span className="numpad-btn__bg-icon" aria-hidden="true">{icon}</span>
                        <span className="numpad-btn__label">({label[0]}){' '}{label.slice(1)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right column always rendered so left column width stays fixed */}
            <div className="battle-commands__right">
              {isTerminal ? (
                <div className="battle-result-panel">
                  <button className="btn btn-primary" onClick={onBattleEnd}>
                    Continue{phase === 'blacked-out' ? ' (healed)' : ''}
                  </button>
                </div>
              ) : showSwitch ? (
                <div className="switch-menu">
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
                        onClick={() => handleSwitch(i)}
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

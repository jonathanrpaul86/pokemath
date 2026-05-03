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
  const damaging = pokemon.moves.filter(m => m.power !== null && (m.power ?? 0) > 0)
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

function TimerBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0
  const color = pct > 50 ? 'blue' : pct > 25 ? 'yellow' : 'red'
  return (
    <div className="timer-bar">
      <div className={`timer-bar__fill timer-bar__fill--${color}`} style={{ width: `${pct}%` }} />
      <span className="timer-bar__label">{remaining}s</span>
    </div>
  )
}

function NumberPad({ onDigit, onDelete, onSubmit, disabled }: {
  onDigit: (d: string) => void
  onDelete: () => void
  onSubmit: () => void
  disabled?: boolean
}) {
  return (
    <div className="numpad">
      {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(key => (
        <button
          key={key}
          className={`numpad-btn ${key === '✓' ? 'numpad-btn--submit' : ''} ${key === '⌫' ? 'numpad-btn--delete' : ''}`}
          onClick={() => {
            if (disabled) return
            if (key === '⌫') onDelete()
            else if (key === '✓') onSubmit()
            else onDigit(key)
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
  const battleRef = useRef<BattleData | null>(null)
  const evolvedRef = useRef<Set<string>>(new Set())
  const prevLevelRef = useRef<number | null>(null)
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
      setBattle({
        phase: 'intro',
        wild,
        wildHp: wild.maxHp,
        partyHps: trainer.party.map(p => p.currentHp),
        activeIdx: 0,
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

  const nextProblem = useCallback(() =>
    generateProblem(trainer.mathStats.difficultyLevel),
    [trainer.mathStats.difficultyLevel]
  )

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

  // intro → choose-action
  useEffect(() => {
    if (!battle || battle.phase !== 'intro') return
    const t = setTimeout(() => {
      setBattle(prev => prev ? { ...prev, phase: 'choose-action' } : prev)
    }, 1800)
    return () => clearTimeout(t)
  }, [battle?.phase])  // eslint-disable-line

  // resolving-correct / resolving-wrong → next phase
  useEffect(() => {
    if (!battle) return
    if (battle.phase !== 'resolving-correct' && battle.phase !== 'resolving-wrong') return
    const t = setTimeout(() => {
      const b = battleRef.current
      if (!b) return

      if (b.phase === 'resolving-correct') {
        if (b.wildHp <= 0) { handleVictory(b); return }
      }

      if (b.phase === 'resolving-wrong') {
        if (b.partyHps[b.activeIdx] <= 0) {
          const nextIdx = b.partyHps.findIndex((hp, i) => i !== b.activeIdx && hp > 0)
          if (nextIdx === -1) { handleBlackout(b); return }
          setBattle(prev => prev ? {
            ...prev, phase: 'choose-action', activeIdx: nextIdx, problem: null,
            log: [...prev.log.slice(-3), `Go, ${capitalize(trainer.party[nextIdx].name)}!`],
          } : prev)
          return
        }
      }

      setBattle(prev => prev ? { ...prev, phase: 'choose-action', problem: null } : prev)
    }, 1500)
    return () => clearTimeout(t)
  }, [battle?.phase])  // eslint-disable-line

  // Player-turn timer tick
  useEffect(() => {
    if (!battle || battle.phase !== 'player-turn' || battle.timeRemaining <= 0) return
    const t = setTimeout(() => {
      setBattle(prev => prev?.phase === 'player-turn' ? { ...prev, timeRemaining: prev.timeRemaining - 1 } : prev)
    }, 1000)
    return () => clearTimeout(t)
  }, [battle?.phase, battle?.timeRemaining])

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
      log: [...prev.log.slice(-3), `${capitalize(prev.wild.name)} broke free!`],
    } : prev)
    setAnswer('')
  }, [battle?.phase, battle?.catchTimeRemaining])  // eslint-disable-line

  // ---- Level-up sound --------------------------------------------------------

  useEffect(() => {
    if (!battle || battle.phase === 'intro') return
    const level = trainer.party[battle.activeIdx]?.level ?? null
    if (prevLevelRef.current !== null && level !== null && level > prevLevelRef.current) {
      playLevelUp()
    }
    prevLevelRef.current = level
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
      if (!b || (b.phase !== 'player-turn' && b.phase !== 'catch-attempt')) return
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
  }, [answer]) // eslint-disable-line

  // ---- Action handlers -------------------------------------------------------

  function processCorrectAnswer(b: BattleData) {
    playCorrect()
    const attacker = trainer.party[b.activeIdx]
    const move = pickPlayerMove(attacker)
    const damage = Math.max(1, calcDamage(move, attacker, b.wild))
    const newWildHp = Math.max(0, b.wildHp - damage)
    setBattle(prev => prev ? {
      ...prev,
      phase: 'resolving-correct',
      wildHp: newWildHp,
      log: [...prev.log.slice(-3), `${capitalize(attacker.name)} used ${capitalize(move.name)} for ${damage} damage!`],
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

  function handleSubmitAnswer() {
    const b = battleRef.current
    if (!b || b.phase !== 'player-turn' || !b.problem) return
    const num = parseInt(answer, 10)
    if (isNaN(num)) return
    const correct = checkAnswer(b.problem, num)
    dispatch({ type: 'RECORD_ANSWER', payload: { operator: b.problem.operator, correct } })
    setAnswer('')
    if (correct) processCorrectAnswer(b)
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
    persistHps(b)
    setBattle(prev => prev ? { ...prev, phase: 'fled', log: ['You got away safely!'] } : prev)
  }

  function handleSwitch(partyIdx: number) {
    setBattle(prev => prev ? {
      ...prev,
      activeIdx: partyIdx,
      phase: 'choose-action',
      problem: null,
      log: [...prev.log.slice(-3), `Go, ${capitalize(trainer.party[partyIdx].name)}!`],
    } : prev)
    setShowSwitch(false)
    setAnswer('')
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
  const isChoosing = phase === 'choose-action'
  const inputBlocked = phase !== 'player-turn' && phase !== 'catch-attempt'
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
          <img className="battle-sprite battle-sprite--player" src={battle.playerSprites[activeIdx]} alt={activeParty?.name ?? ''} />
          <img className="battle-sprite battle-sprite--enemy" src={battle.wildSprite} alt={wild.name} />
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
      </div>

      {/* ── Command panel ── */}
      <div className="battle-commands">
        <div className="battle-commands__inner">
          {isTerminal ? (
            <div className="battle-bottom-row">
              <div className="battle-log">
                {battle.log.slice(-3).map((msg, i) => (
                  <p key={i} className="battle-log__line">{msg}</p>
                ))}
              </div>
              <div className="battle-action-grid battle-action-grid--result">
                <button className="btn btn-primary" onClick={onBattleEnd}>
                  {phase === 'blacked-out' ? 'Continue\n(healed)' : 'Continue'}
                </button>
              </div>
            </div>

          ) : isChoosing || showSwitch ? (
            <div className="battle-bottom-row">
              <div className="battle-log">
                {battle.log.slice(-3).map((msg, i) => (
                  <p key={i} className="battle-log__line">{msg}</p>
                ))}
              </div>
              {showSwitch ? (
                <div className="switch-menu">
                  {trainer.party.map((p, i) => {
                    if (i === activeIdx || (partyHps[i] ?? 0) === 0) return null
                    const hp = partyHps[i] ?? 0
                    return (
                      <button key={p.uid} className="switch-btn" onClick={() => handleSwitch(i)}>
                        <span className="switch-btn__name">{capitalize(p.name)}</span>
                        <span className="switch-btn__level">Lv.{p.level}</span>
                        <span className="switch-btn__hp">{hp}/{p.maxHp} HP</span>
                      </button>
                    )
                  })}
                  <button className="switch-btn switch-btn--cancel" onClick={() => setShowSwitch(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="battle-action-grid">
                  <button className="btn btn-fight" onClick={handleFight}>⚔ Fight!</button>
                  <button className="btn btn-catch" onClick={handleStartCatch}>🎯 Catch!</button>
                  <button
                    className="btn btn-switch"
                    onClick={() => setShowSwitch(true)}
                    disabled={switchableCount === 0}
                  >
                    🔄 Switch
                  </button>
                  <button className="btn btn-flee" onClick={handleFlee}>🏃 Run</button>
                </div>
              )}
            </div>

          ) : (
            <>
              {/* Problem / catch header */}
              {phase === 'catch-attempt' && battle.catchProgress && battle.catchProblem ? (
                <>
                  <div className="catch-header">
                    <span className="catch-header__label">Catching {capitalize(wild.name)}!</span>
                    <span className="catch-header__progress">
                      {battle.catchProgress.solved} / {battle.catchProgress.required} solved
                    </span>
                  </div>
                  <div className="battle-problem">
                    <span className="battle-problem__text">
                      {battle.catchProblem.operand1} {battle.catchProblem.operator} {battle.catchProblem.operand2} = ?
                    </span>
                    <span className="battle-problem__answer">{answer || '_'}</span>
                  </div>
                  <TimerBar remaining={battle.catchTimeRemaining} total={battle.catchProgress.timePerProblem} />
                </>
              ) : problem ? (
                <>
                  <div className="battle-problem">
                    <span className="battle-problem__text">
                      {problem.operand1} {problem.operator} {problem.operand2} = ?
                    </span>
                    <span className="battle-problem__answer">{answer || '_'}</span>
                  </div>
                  <TimerBar remaining={timeRemaining} total={problem.timeLimit} />
                </>
              ) : null}

              {/* Log + numpad side by side */}
              <div className="battle-bottom-row">
                <div className="battle-log">
                  {battle.log.slice(-3).map((msg, i) => (
                    <p key={i} className="battle-log__line">{msg}</p>
                  ))}
                </div>
                <NumberPad
                  {...numpadProps}
                  onSubmit={phase === 'catch-attempt' ? handleSubmitCatchAnswer : handleSubmitAnswer}
                  disabled={inputBlocked}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

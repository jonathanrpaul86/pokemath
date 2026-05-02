import { useState, useEffect, useRef, useCallback } from 'react'
import { useTrainer, useGameStore } from '../store'
import { fetchPokemonSpecies } from '../services/pokeApi'
import { spawnWildPokemon, calcDamage, calcCatchDifficulty, CATCH_HP_THRESHOLD } from '../utils/battle'
import { pickEncounter, pickLevel } from '../utils/encounter'
import { generateProblem, checkAnswer } from '../utils/math'
import { battleXpReward, trainerXpReward, pokemonXpToNextLevel } from '../utils/formulas'
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
  const battleRef = useRef<BattleData | null>(null)

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

  // intro → player-turn
  useEffect(() => {
    if (!battle || battle.phase !== 'intro') return
    const t = setTimeout(() => {
      const p = nextProblem()
      setBattle(prev => prev ? { ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit } : prev)
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
          const p = nextProblem()
          setBattle(prev => prev ? {
            ...prev, phase: 'player-turn', activeIdx: nextIdx,
            problem: p, timeRemaining: p.timeLimit,
            log: [...prev.log.slice(-3), `Go, ${capitalize(trainer.party[nextIdx].name)}!`],
          } : prev)
          return
        }
      }

      const p = nextProblem()
      setBattle(prev => prev ? { ...prev, phase: 'player-turn', problem: p, timeRemaining: p.timeLimit } : prev)
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

  // ---- Action handlers -------------------------------------------------------

  function processCorrectAnswer(b: BattleData) {
    const attacker = trainer.party[b.activeIdx]
    const damage = Math.max(1, calcDamage(MATH_ATTACK, attacker, b.wild))
    const newWildHp = Math.max(0, b.wildHp - damage)
    setBattle(prev => prev ? {
      ...prev,
      phase: 'resolving-correct',
      wildHp: newWildHp,
      log: [...prev.log.slice(-3), `${capitalize(attacker.name)} attacks for ${damage} damage!`],
    } : prev)
  }

  function processWrongAnswer(b: BattleData) {
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

  function handleStartCatch() {
    const b = battleRef.current
    if (!b || b.phase !== 'player-turn') return
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
        moveIds: b.wild.moves.map(m => m.id),
        caughtAt: Date.now(),
      }
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
  const wildHpPct = wild.maxHp > 0 ? wildHp / wild.maxHp : 0
  const canCatch = wildHpPct <= CATCH_HP_THRESHOLD && phase === 'player-turn'
  const isTerminal = phase === 'victory' || phase === 'caught' || phase === 'fled' || phase === 'blacked-out'
  const inputBlocked = phase !== 'player-turn' && phase !== 'catch-attempt'

  // ---- Render ----------------------------------------------------------------

  return (
    <div className="battle-screen">

      {/* ── Field ── */}
      <div className="battle-field">
        {/* Enemy row */}
        <div className="battle-field__enemy-status">
          <span className="battle-status__name">{capitalize(wild.name)}</span>
          <span className="battle-status__level">Lv.{wild.level}</span>
          <HpBar current={wildHp} max={wild.maxHp} />
          <span className="battle-status__hp-text">{wildHp} / {wild.maxHp}</span>
        </div>
        <div className="battle-field__sprites">
          <img
            className="battle-sprite battle-sprite--enemy"
            src={battle.wildSprite}
            alt={wild.name}
          />
          <img
            className="battle-sprite battle-sprite--player"
            src={battle.playerSprites[activeIdx]}
            alt={activeParty?.name ?? ''}
          />
        </div>
        {/* Player row */}
        {activeParty && (
          <div className="battle-field__player-status">
            <span className="battle-status__name">{capitalize(activeParty.name)}</span>
            <span className="battle-status__level">Lv.{activeParty.level}</span>
            <HpBar current={activeHp} max={activeParty.maxHp} />
            <span className="battle-status__hp-text">{activeHp} / {activeParty.maxHp}</span>
          </div>
        )}
      </div>

      {/* ── Log ── */}
      <div className="battle-log">
        {battle.log.slice(-2).map((msg, i) => (
          <p key={i} className="battle-log__line">{msg}</p>
        ))}
      </div>

      {/* ── Action area ── */}
      <div className="battle-actions">
        {isTerminal ? (
          <div className="battle-result">
            <button className="btn btn-primary btn-lg" onClick={onBattleEnd}>
              {phase === 'blacked-out' ? 'Continue (healed)' : 'Continue'}
            </button>
          </div>
        ) : phase === 'catch-attempt' && battle.catchProgress && battle.catchProblem ? (
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
            <NumberPad
              onDigit={d => setAnswer(a => a.length < 4 ? a + d : a)}
              onDelete={() => setAnswer(a => a.slice(0, -1))}
              onSubmit={handleSubmitCatchAnswer}
            />
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
            <div className="battle-problem__actions">
              {canCatch && (
                <button className="btn btn-catch" onClick={handleStartCatch}>
                  🎯 Catch!
                </button>
              )}
              <button className="btn btn-flee" onClick={handleFlee}>
                Run
              </button>
            </div>
            <NumberPad
              onDigit={d => setAnswer(a => a.length < 4 ? a + d : a)}
              onDelete={() => setAnswer(a => a.slice(0, -1))}
              onSubmit={handleSubmitAnswer}
              disabled={inputBlocked}
            />
          </>
        ) : (
          <div className="battle-waiting" />
        )}
      </div>
    </div>
  )
}

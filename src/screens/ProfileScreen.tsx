import { useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import type { MathOperator } from '../types'
import './ProfileScreen.css'

interface Props {
  onBack: () => void
}

const OPERATORS: MathOperator[] = ['+', '-', '×', '÷']

const DIFFICULTY_OPTIONS: { label: string; description: string; value: number }[] = [
  { label: 'Easy',   description: 'Extra time to answer each problem',  value: 1.5 },
  { label: 'Normal', description: 'Standard timing',                    value: 1   },
  { label: 'Hard',   description: 'Less time per problem',              value: 0.75 },
]

function pct(correct: number, total: number): string {
  if (total === 0) return '—'
  return `${Math.round((correct / total) * 100)}%`
}

export default function ProfileScreen({ onBack }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()

  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(trainer.name)

  const activeMultiplier = trainer.timerMultiplier ?? 1

  function handleSaveName() {
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== trainer.name) {
      dispatch({ type: 'RENAME_TRAINER', payload: { name: trimmed } })
    }
    setRenaming(false)
  }

  function handleCancelRename() {
    setDraftName(trainer.name)
    setRenaming(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSaveName()
    if (e.key === 'Escape') handleCancelRename()
  }

  const { lifetimeTotal, lifetimeCorrect, operators } = trainer.mathStats

  return (
    <div className="profile">

      {/* ── Header ── */}
      <header className="profile-header">
        <button className="btn btn-secondary profile-back" onClick={onBack}>← Back</button>
        <h1 className="profile-title">Trainer Profile</h1>
      </header>

      <div className="profile-body">

        {/* ── Trainer name ── */}
        <section className="profile-card">
          <h2 className="profile-card__heading">Trainer</h2>
          {renaming ? (
            <div className="profile-rename">
              <input
                className="profile-rename__input"
                value={draftName}
                maxLength={12}
                autoFocus
                onChange={e => setDraftName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="btn btn-primary profile-rename__save" onClick={handleSaveName}>
                Save
              </button>
              <button className="btn btn-secondary profile-rename__cancel" onClick={handleCancelRename}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="profile-trainer-row">
              <span className="profile-trainer-name">{trainer.name}</span>
              <span className="profile-trainer-level">Lv. {trainer.level} Trainer</span>
              <button className="btn btn-secondary profile-rename__trigger" onClick={() => { setDraftName(trainer.name); setRenaming(true) }}>
                Rename
              </button>
            </div>
          )}
        </section>

        {/* ── Difficulty ── */}
        <section className="profile-card">
          <h2 className="profile-card__heading">Difficulty</h2>
          <div className="profile-timer-btns">
            {DIFFICULTY_OPTIONS.map(({ label, description, value }) => (
              <button
                key={value}
                className={`btn profile-timer-btn${activeMultiplier === value ? ' profile-timer-btn--active' : ''}`}
                onClick={() => dispatch({ type: 'SET_TIMER_MULTIPLIER', payload: { multiplier: value } })}
              >
                {label}
                <span className="profile-timer-btn__desc">{description}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Math stats ── */}
        <section className="profile-card">
          <h2 className="profile-card__heading">Math Stats</h2>

          <div className="profile-stats-overall">
            <span className="profile-stats-overall__label">Overall accuracy</span>
            <span className="profile-stats-overall__value">{pct(lifetimeCorrect, lifetimeTotal)}</span>
            <span className="profile-stats-overall__detail">
              {lifetimeCorrect} / {lifetimeTotal} correct
            </span>
          </div>

          <table className="profile-stats-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Attempts</th>
                <th>Correct</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {OPERATORS.map(op => {
                const s = operators[op]
                return (
                  <tr key={op}>
                    <td className="profile-stats-table__op">{op}</td>
                    <td>{s.totalAttempts}</td>
                    <td>{s.correctAnswers}</td>
                    <td>{pct(s.correctAnswers, s.totalAttempts)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

      </div>
    </div>
  )
}

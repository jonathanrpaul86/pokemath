import { useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { AREA_MAP } from '../data/areas'
import { GYM_MAP, BADGE_NAMES } from '../data/gyms'
import BattleScreen from './BattleScreen'
import type { TrainerBattle } from '../types'
import './GymScreen.css'

interface Props {
  gymId: string
  onExit: () => void
}

const TYPE_COLORS: Record<string, string> = {
  Rock:   '#b8a038',
  Water:  '#6890f0',
  Grass:  '#78c850',
  Poison: '#a040a0',
  Fire:   '#f08030',
}

function BadgeIcon({ badgeId, earned }: { badgeId: string; earned: boolean }) {
  const shapes: Record<string, string> = {
    'boulder-badge': 'M12 3 L21 9 L18 20 L6 20 L3 9 Z',
    'cascade-badge': 'M12 3 C18 3 21 8 21 12 C21 16 18 21 12 21 C6 21 3 16 3 12 C3 8 6 3 12 3 Z',
    'thunder-badge': 'M14 2 L8 13 L12 13 L10 22 L18 9 L14 9 Z',
    'rainbow-badge': 'M12 3 L14 9 L20 9 L15 14 L17 20 L12 16 L7 20 L9 14 L4 9 L10 9 Z',
    'soul-badge':    'M12 3 C16 3 20 6 20 10 C20 15 12 21 12 21 C12 21 4 15 4 10 C4 6 8 3 12 3 Z',
    'marsh-badge':   'M12 2 L22 7 L22 17 L12 22 L2 17 L2 7 Z',
    'volcano-badge': 'M12 3 L3 20 L7 18 L12 21 L17 18 L21 20 Z',
    'earth-badge':   'M12 3 L20 7 L20 17 L12 21 L4 17 L4 7 Z',
  }
  const path = shapes[badgeId] ?? shapes['rainbow-badge']
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" className={`badge-icon${earned ? ' badge-icon--earned' : ' badge-icon--dim'}`}>
      <path d={path} strokeWidth="1.5" />
    </svg>
  )
}

export default function GymScreen({ gymId, onExit }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [activeBattle, setActiveBattle] = useState<TrainerBattle | null>(null)
  const [badgeFanfare, setBadgeFanfare] = useState(false)

  const gym = GYM_MAP[gymId]
  if (!gym) return null

  const area = AREA_MAP[gym.cityAreaId]
  const progress = trainer.gymProgress?.[gymId] ?? { defeatedTrainerIds: [], leaderDefeated: false }
  const allTrainersDefeated = gym.trainers.every(t => progress.defeatedTrainerIds.includes(t.id))
  const leaderDefeated = trainer.badges.includes(gym.leader.badge)

  function startTrainerBattle(trainerId: string) {
    const t = gym.trainers.find(t => t.id === trainerId)!
    setActiveBattle({
      trainerName: t.name,
      isLeader: false,
      team: t.team,
      quote: t.quote,
      onComplete: (won) => {
        if (won) {
          dispatch({ type: 'RECORD_GYM_TRAINER_DEFEAT', payload: { gymId, trainerId } })
        }
        setActiveBattle(null)
      },
    })
  }

  function startLeaderBattle() {
    const leader = gym.leader
    setActiveBattle({
      trainerName: leader.name,
      isLeader: true,
      team: leader.team,
      quote: leader.quote,
      onComplete: (won) => {
        if (won) {
          dispatch({ type: 'EARN_BADGE', payload: { badgeId: leader.badge } })
          dispatch({
            type: 'RECORD_GYM_TRAINER_DEFEAT',
            payload: { gymId, trainerId: '__leader__' },
          })
          setActiveBattle(null)
          setBadgeFanfare(true)
        } else {
          setActiveBattle(null)
        }
      },
    })
  }

  if (activeBattle) {
    return (
      <div className="gym-battle-fullscreen">
        <BattleScreen
          area={area}
          onBattleEnd={() => setActiveBattle(null)}
          trainerBattle={activeBattle}
        />
      </div>
    )
  }

  if (badgeFanfare) {
    const badgeName = BADGE_NAMES[gym.leader.badge] ?? gym.leader.badge
    return (
      <div className="gym-battle-fullscreen gym-screen--fanfare">
        <div className="gym-fanfare">
          <BadgeIcon badgeId={gym.leader.badge} earned />
          <h2 className="gym-fanfare__title">{badgeName} Obtained!</h2>
          <p className="gym-fanfare__quote">"{gym.leader.winQuote}"</p>
          <p className="gym-fanfare__sub">— {gym.leader.name}</p>
          <button className="btn btn-primary gym-fanfare__btn" onClick={onExit}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="gym-overlay" onClick={onExit}>
    <div className="gym-screen" onClick={e => e.stopPropagation()}>
      <div className="gym-header">
        <button className="btn btn-secondary gym-back-btn" onClick={onExit}>← Back</button>
        <div className="gym-header__info">
          <h1 className="gym-header__name">{gym.name}</h1>
          <span className={`gym-type-badge gym-type-badge--${gym.type.toLowerCase()}`}
            style={{ background: TYPE_COLORS[gym.type] ?? '#888' }}>
            {gym.type} Type
          </span>
        </div>
        {leaderDefeated && (
          <div className="gym-badge-earned">
            <BadgeIcon badgeId={gym.leader.badge} earned />
            <span className="gym-badge-earned__label">{BADGE_NAMES[gym.leader.badge]}</span>
          </div>
        )}
      </div>

      <div className="gym-interior">
        <div className="gym-trainers">
          {gym.trainers.map((t, i) => {
            const beaten = progress.defeatedTrainerIds.includes(t.id)
            const available = i === 0 || progress.defeatedTrainerIds.includes(gym.trainers[i - 1].id)
            return (
              <div key={t.id} className={`gym-trainer-row${beaten ? ' gym-trainer-row--beaten' : ''}`}>
                <div className="gym-trainer-row__info">
                  <span className="gym-trainer-row__name">{t.name}</span>
                  <span className="gym-trainer-row__team">
                    {t.team.map((p, j) => (
                      <span key={j} className="gym-trainer-row__pkmn">Lv.{p.level}</span>
                    ))}
                  </span>
                </div>
                {beaten ? (
                  <span className="gym-trainer-row__status gym-trainer-row__status--beaten">Defeated ✓</span>
                ) : (
                  <button
                    className="btn gym-trainer-row__challenge"
                    disabled={!available}
                    onClick={() => startTrainerBattle(t.id)}
                  >
                    {available ? 'Challenge' : 'Not yet'}
                  </button>
                )}
              </div>
            )
          })}

          <div className={`gym-leader-row${leaderDefeated ? ' gym-leader-row--beaten' : ''}${!allTrainersDefeated ? ' gym-leader-row--locked' : ''}`}>
            <div className="gym-leader-row__badge">
              <BadgeIcon badgeId={gym.leader.badge} earned={leaderDefeated} />
            </div>
            <div className="gym-leader-row__info">
              <span className="gym-leader-row__title">Gym Leader</span>
              <span className="gym-leader-row__name">{gym.leader.name}</span>
              <span className="gym-leader-row__team">
                {gym.leader.team.map((p, j) => (
                  <span key={j} className="gym-trainer-row__pkmn">Lv.{p.level}</span>
                ))}
              </span>
              {!allTrainersDefeated && (
                <span className="gym-leader-row__locked-hint">
                  Defeat all trainers first
                </span>
              )}
            </div>
            {leaderDefeated ? (
              <span className="gym-trainer-row__status gym-trainer-row__status--beaten">Badge earned ✓</span>
            ) : (
              <button
                className="btn btn-primary gym-leader-row__challenge"
                disabled={!allTrainersDefeated}
                onClick={startLeaderBattle}
              >
                {allTrainersDefeated ? `Challenge ${gym.leader.name}!` : 'Locked'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { AREA_MAP } from '../data/areas'
import {
  POKEMON_LEAGUE, LEAGUE_AREA_ID, LEAGUE_BADGES_REQUIRED, CHAMPION_GIFT, CHAMPION_GIFT_ID,
  type LeagueMember,
} from '../data/league'
import { fetchPokemonSpecies } from '../services/pokeApi'
import BattleScreen from './BattleScreen'
import GiftDialog from '../components/GiftDialog'
import type { HallOfFameEntry, TrainerBattle } from '../types'
import './GymScreen.css'
import './LeagueScreen.css'

interface Props {
  onExit: () => void
}

/**
 * Where the player is in a League run. A run is five battles back to back;
 * losing, giving up, or leaving starts it over.
 */
type Stage =
  | { kind: 'lobby' }
  | { kind: 'battle'; index: number }
  /** Just beat POKEMON_LEAGUE[index], and the next one is waiting */
  | { kind: 'between'; index: number }
  | { kind: 'defeated'; index: number }
  | { kind: 'hall-of-fame' }
  | { kind: 'champion-gift' }

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function displayName(member: LeagueMember): string {
  return member.title === 'Champion' ? member.name : `Elite Four ${member.name}`
}

function levelRange(member: LeagueMember): string {
  const low = Math.min(...member.team.map(p => p.level))
  const high = Math.max(...member.team.map(p => p.level))
  return low === high ? `Lv.${low}` : `Lv.${low}–${high}`
}

export default function LeagueScreen({ onExit }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [stage, setStage] = useState<Stage>({ kind: 'lobby' })
  const [sprites, setSprites] = useState<Record<number, string>>({})

  const area = AREA_MAP[LEAGUE_AREA_ID]
  const open = trainer.badges.length >= LEAGUE_BADGES_REQUIRED
  const partyHasLiveMember = trainer.party.some(p => p.currentHp > 0)
  const timesChampion = trainer.hallOfFame.length

  function battleFor(index: number): TrainerBattle {
    const member = POKEMON_LEAGUE[index]
    return {
      trainerName: displayName(member),
      isLeader: true,
      team: member.team,
      quote: member.quote,
      onComplete: won => {
        if (!won) { setStage({ kind: 'defeated', index }); return }
        if (index < POKEMON_LEAGUE.length - 1) { setStage({ kind: 'between', index }); return }
        dispatch({ type: 'ENTER_HALL_OF_FAME', payload: { date: Date.now() } })
        setStage({ kind: 'hall-of-fame' })
      },
    }
  }

  // Hall of Fame sprites (PokéAPI responses are cached)
  const hofEntry: HallOfFameEntry | undefined = trainer.hallOfFame[trainer.hallOfFame.length - 1]
  const hofKey = stage.kind === 'hall-of-fame' && hofEntry ? hofEntry.team.map(p => p.speciesId).join(',') : ''
  useEffect(() => {
    if (!hofKey || !hofEntry) return
    let cancelled = false
    for (const p of hofEntry.team) {
      fetchPokemonSpecies(p.speciesId)
        .then(species => { if (!cancelled) setSprites(s => ({ ...s, [p.speciesId]: species.sprites.front })) })
        .catch(() => { /* names still show */ })
    }
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hofKey])

  if (stage.kind === 'battle') {
    return (
      <div className="gym-battle-fullscreen">
        <BattleScreen
          key={stage.index}
          area={area}
          onBattleEnd={() => setStage({ kind: 'lobby' })}
          trainerBattle={battleFor(stage.index)}
        />
      </div>
    )
  }

  if (stage.kind === 'hall-of-fame' && hofEntry) {
    const giftWaiting = !trainer.claimedRewardIds.includes(CHAMPION_GIFT_ID)
    return (
      <div className="gym-battle-fullscreen gym-screen--fanfare">
        <div className="gym-fanfare league-hof">
          <p className="league-hof__crown">🏆</p>
          <h2 className="gym-fanfare__title">Welcome to the Hall of Fame!</h2>
          <p className="gym-fanfare__quote">
            {trainer.name} and their Pokémon are the new Champions of the Pokémon League!
          </p>
          <div className="league-hof__team">
            {hofEntry.team.map((p, i) => (
              <div key={i} className="league-hof__pkmn">
                {sprites[p.speciesId]
                  ? <img src={sprites[p.speciesId]} alt="" className="league-hof__sprite" />
                  : <span className="league-hof__sprite" />}
                <span className="league-hof__name">{capitalize(p.name)}</span>
                <span className="league-hof__level">Lv.{p.level}</span>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary gym-fanfare__btn"
            onClick={() => (giftWaiting ? setStage({ kind: 'champion-gift' }) : onExit())}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  if (stage.kind === 'champion-gift') {
    return (
      <div className="gym-battle-fullscreen gym-screen--fanfare">
        <GiftDialog
          place="Hall of Fame"
          icon="🏆"
          npcName={CHAMPION_GIFT.npcName}
          lines={CHAMPION_GIFT.lines}
          gift={CHAMPION_GIFT.gift}
          claimId={CHAMPION_GIFT_ID}
          onClose={onExit}
        />
      </div>
    )
  }

  const between = stage.kind === 'between' ? stage.index : null
  const defeatedAt = stage.kind === 'defeated' ? stage.index : null
  // Opponents beaten so far in this run
  const beatenCount = between === null ? 0 : between + 1

  return (
    <div className="gym-overlay" onClick={stage.kind === 'lobby' ? onExit : undefined}>
    <div className="gym-screen" onClick={e => e.stopPropagation()}>
      <div className="gym-header">
        {stage.kind !== 'between' && (
          <button className="btn btn-secondary gym-back-btn" onClick={onExit}>← Back</button>
        )}
        <div className="gym-header__info">
          <h1 className="gym-header__name">Pokémon League</h1>
          <span className="gym-type-badge league-badge">
            {timesChampion ? `🏆 Champion ×${timesChampion}` : 'Elite Four'}
          </span>
        </div>
      </div>

      <div className="gym-interior">
        {!open ? (
          <div className="gym-closed">
            <span className="gym-closed__icon">🔒</span>
            <p className="gym-closed__title">Only trainers with all eight badges may challenge the League.</p>
            <p className="gym-closed__hint">You have {trainer.badges.length} so far.</p>
          </div>
        ) : (
          <div className="gym-trainers">
            {between !== null && (
              <div className="league-message">
                <p className="league-message__quote">“{POKEMON_LEAGUE[between].winQuote}”</p>
                <p className="league-message__sub">— {displayName(POKEMON_LEAGUE[between])}</p>
                <div className="league-party">
                  {trainer.party.map(p => (
                    <div key={p.uid} className={`league-party__pkmn${p.currentHp === 0 ? ' league-party__pkmn--fainted' : ''}`}>
                      <span>{capitalize(p.name)} Lv.{p.level}</span>
                      <span>{p.currentHp} / {p.maxHp} HP</span>
                    </div>
                  ))}
                </div>
                <p className="league-message__hint">No Pokémon Center here! Use Potions from your Bag during the next battle.</p>
              </div>
            )}

            {defeatedAt !== null && (
              <div className="league-message league-message--defeat">
                <p className="league-message__quote">{displayName(POKEMON_LEAGUE[defeatedAt])} wins this time…</p>
                <p className="league-message__hint">
                  Your Pokémon were rushed to the Pokémon Center and are fully healed.
                  Train up, and challenge the League again from the start!
                </p>
              </div>
            )}

            {stage.kind === 'lobby' && (
              <p className="league-message__hint league-intro">
                Face all five opponents back to back. There’s no Pokémon Center until the challenge is over,
                and one loss sends you back to the start. Good luck!
              </p>
            )}

            {POKEMON_LEAGUE.map((member, i) => {
              const beaten = i < beatenCount
              const isChampion = member.title === 'Champion'
              return (
                <div
                  key={member.id}
                  className={`${isChampion ? 'gym-leader-row' : 'gym-trainer-row'}${beaten ? (isChampion ? ' gym-leader-row--beaten' : ' gym-trainer-row--beaten') : ''}`}
                >
                  <div className={isChampion ? 'gym-leader-row__info' : 'gym-trainer-row__info'}>
                    <span className={isChampion ? 'gym-leader-row__title' : 'gym-trainer-row__name'}>{member.title}</span>
                    <span className={isChampion ? 'gym-leader-row__name' : 'gym-trainer-row__name'}>{member.name} · {member.type}</span>
                    <span className="gym-trainer-row__team">
                      <span className="gym-trainer-row__pkmn">{member.team.length} Pokémon, {levelRange(member)}</span>
                    </span>
                  </div>
                  {beaten && <span className="gym-trainer-row__status gym-trainer-row__status--beaten">Defeated ✓</span>}
                </div>
              )
            })}

            <div className="league-actions">
              {between !== null ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setStage({ kind: 'lobby' })}>Give up</button>
                  <button
                    className="btn btn-primary"
                    disabled={!partyHasLiveMember}
                    onClick={() => setStage({ kind: 'battle', index: between + 1 })}
                  >
                    Onward to {displayName(POKEMON_LEAGUE[between + 1])}!
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={!partyHasLiveMember}
                  title={!partyHasLiveMember ? 'All your Pokémon have fainted!' : undefined}
                  onClick={() => setStage({ kind: 'battle', index: 0 })}
                >
                  {defeatedAt !== null ? 'Try again from the start' : timesChampion ? 'Challenge the League again' : 'Begin the challenge!'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

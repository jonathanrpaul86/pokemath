import { useEffect, useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { isMuted, setMuted } from '../utils/sound'
import { AREA_MAP, KANTO_AREAS, meetsBadgeRequirement, meetsKeyItemRequirement, travelBlocker, exploresDone, isAreaExplored, unclaimedReward } from '../data/areas'
import { ITEM_MAP } from '../data/items'
import { availableEncounters } from '../utils/encounter'
import { KANTO_NAMES } from '../data/pokedex'
import { BADGE_NAMES, KANTO_GYMS } from '../data/gyms'
import { hasCityHub } from '../data/cities'
import CityScreen from './CityScreen'
import { preloadAreaSpecies, fetchPokemonSpecies } from '../services/pokeApi'
import { WorldMapCanvas } from '../components/WorldMapCanvas'
import ExploreModal from '../components/ExploreModal'
import FullMapModal from '../components/FullMapModal'
import GiftDialog from '../components/GiftDialog'
import { canExplore } from '../utils/explore'
import { updatedMoveset } from '../utils/formulas'
import type { Area, OwnedPokemon, EncounterEntry, BattleRequest } from '../types'
import './OverworldScreen.css'

interface Props {
  onStartBattle: (request: BattleRequest) => void
  /** In a city, show the city screen (true) or the world map (false) */
  cityView: boolean
  onCityViewChange: (showCity: boolean) => void
  onOpenPokedex: () => void
  onOpenParty: () => void
  onOpenProfile: () => void
  onOpenBag: () => void
  onGoToTitle: () => void
}

// ---- Pokédex icon -----------------------------------------------------------

function PokedexIcon() {
  return (
    <svg viewBox="0 0 22 30" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
      {/* Body */}
      <rect x="1" y="1" width="20" height="28" rx="3" fill="#cc1a1a" />
      {/* Screen area */}
      <rect x="3.5" y="3.5" width="15" height="11" rx="2" fill="#111" />
      {/* Screen glow */}
      <rect x="4.5" y="4.5" width="13" height="9" rx="1.5" fill="#1a2a3a" />
      {/* Indicator light */}
      <circle cx="6.5" cy="18" r="2" fill="#44ee66" />
      {/* Button row */}
      <rect x="3.5" y="22" width="4.5" height="3" rx="1" fill="#fff3" />
      <rect x="9" y="22" width="4.5" height="3" rx="1" fill="#fff3" />
      <rect x="14.5" y="22" width="4" height="3" rx="1" fill="#fff3" />
      {/* D-pad stub */}
      <rect x="11" y="17" width="7" height="2" rx="1" fill="#fff2" />
      <rect x="13.5" y="15" width="2" height="6" rx="1" fill="#fff2" />
    </svg>
  )
}

// ---- Sub-components ---------------------------------------------------------

function XpBar({ xp, xpToNextLevel, pokemon }: { xp: number; xpToNextLevel: number; pokemon?: boolean }) {
  const pct = Math.min(100, Math.round((xp / xpToNextLevel) * 100))
  return (
    <div className={`xp-bar${pokemon ? ' xp-bar--pokemon' : ''}`} title={`${xp} / ${xpToNextLevel} XP`}>
      <div className="xp-bar__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, Math.round((current / max) * 100))
  const cls = pct > 50 ? 'hp-bar__fill--green' : pct > 20 ? 'hp-bar__fill--yellow' : 'hp-bar__fill--red'
  return (
    <div className="hp-bar">
      <div className={`hp-bar__fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function PartyMember({ pokemon }: { pokemon: OwnedPokemon }) {
  const fainted = pokemon.currentHp === 0
  return (
    <div className={`party-member ${fainted ? 'party-member--fainted' : ''}`}>
      <div className="party-member__info">
        <span className="party-member__name">{pokemon.name}</span>
        <span className="party-member__level">Lv.{pokemon.level}</span>
      </div>
      {fainted
        ? <span className="party-member__fainted-label">Fainted</span>
        : (
          <>
            <HpBar current={pokemon.currentHp} max={pokemon.maxHp} />
            <span className="party-member__hp-text">
              {pokemon.currentHp} / {pokemon.maxHp}
            </span>
          </>
        )
      }
      <XpBar xp={pokemon.xp} xpToNextLevel={pokemon.xpToNextLevel} pokemon />
    </div>
  )
}

// ---- Encounter preview ------------------------------------------------------

function EncounterPreview({ encounters }: { encounters: EncounterEntry[] }) {
  const trainer = useTrainer()
  return (
    <div className="encounter-preview">
      <div className="encounter-preview__label">Wild Pokémon</div>
      <div className="encounter-preview__grid">
        {encounters.map(e => {
          const seen = trainer.pokedex[e.speciesId]?.seen ?? false
          return (
            <div key={e.speciesId} className={`encounter-sprite${seen ? '' : ' encounter-sprite--unseen'}`}>
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.speciesId}.png`}
                alt={seen ? (KANTO_NAMES[e.speciesId] ?? `#${e.speciesId}`) : '???'}
                className={`encounter-sprite__img${seen ? '' : ' encounter-sprite__img--silhouette'}`}
              />
              <span className="encounter-sprite__name">
                {seen ? (KANTO_NAMES[e.speciesId] ?? `#${e.speciesId}`) : '???'}
              </span>
              {seen && (
                <span className="encounter-sprite__levels">Lv.{e.minLevel}–{e.maxLevel}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Main screen ------------------------------------------------------------

export default function OverworldScreen({ onStartBattle, cityView, onCityViewChange, onOpenPokedex, onOpenParty, onOpenProfile, onOpenBag, onGoToTitle }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [exploring, setExploring] = useState(false)
  const [fullMapOpen, setFullMapOpen] = useState(false)
  // An area whose reward the player put off (e.g. offline), so it doesn't pop straight back up
  const [rewardPutOffFor, setRewardPutOffFor] = useState<string | null>(null)
  const [muted, setMutedState] = useState(isMuted())
  // Which area is shown in the side panel (defaults to current, updates on hover/click)
  const [selectedAreaId, setSelectedAreaId] = useState(trainer.currentAreaId)

  function handleMuteToggle() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  const currentArea: Area = AREA_MAP[trainer.currentAreaId]
  const selectedArea: Area = AREA_MAP[selectedAreaId] ?? currentArea

  // Keep selectedAreaId pointing at currentAreaId if it drifts (e.g. after travel)
  useEffect(() => {
    setSelectedAreaId(trainer.currentAreaId)
  }, [trainer.currentAreaId])

  // Preload species sprites for current area so battles start instantly
  useEffect(() => {
    const ids = currentArea.encounters.map(e => e.speciesId)
    preloadAreaSpecies(ids)
  }, [currentArea.id])

  // Pokémon from older saves lack base stats, so they can't grow on level-up.
  // Look them up once (PokéAPI responses are cached) and recalculate.
  const missingBaseStats = [...trainer.party, ...trainer.pc].filter(p => !p.baseStats)
  const missingKey = missingBaseStats.map(p => p.uid).join(',')
  useEffect(() => {
    let cancelled = false
    for (const p of missingBaseStats) {
      fetchPokemonSpecies(p.speciesId)
        .then(species => {
          if (!cancelled) dispatch({ type: 'SET_BASE_STATS', payload: { uid: p.uid, baseStats: species.baseStats } })
        })
        .catch(() => { /* offline: retry on next visit */ })
    }
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey])

  // Pokémon learn moves as they level up and evolve. Check the party whenever a
  // level or species changes; this also fills in moves missing from older saves.
  const movesKey = trainer.party.map(p => `${p.uid}:${p.speciesId}:${p.level}`).join(',')
  useEffect(() => {
    let cancelled = false
    for (const p of trainer.party) {
      fetchPokemonSpecies(p.speciesId)
        .then(species => {
          const moves = updatedMoveset(p, species)
          if (!cancelled && moves) dispatch({ type: 'SET_MOVES', payload: { uid: p.uid, moves } })
        })
        .catch(() => { /* offline: retry on next visit */ })
    }
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movesKey])

  function handleTravel(areaId: string) {
    setRewardPutOffFor(null)
    dispatch({ type: 'UNLOCK_AREA', payload: { areaId } })
    dispatch({ type: 'SET_CURRENT_AREA', payload: { areaId } })
    // Arriving in a city opens its hub
    if (hasCityHub(AREA_MAP[areaId])) onCityViewChange(true)
  }

  function handleSelectArea(areaId: string | null) {
    setSelectedAreaId(areaId ?? trainer.currentAreaId)
  }

  const partyHasLiveMember = trainer.party.some(p => p.currentHp > 0)
  const selectedIsCurrent = selectedAreaId === trainer.currentAreaId
  const showCity = cityView && hasCityHub(currentArea)
  const selectedIsAdjacent = currentArea.connectedAreaIds.includes(selectedAreaId)
  // Undiscovered areas more than 1 hop away are masked as unknown
  const selectedIsUnknown =
    !trainer.unlockedAreaIds.includes(selectedAreaId) &&
    !selectedIsAdjacent &&
    !selectedIsCurrent
  const meetsBadgeReq = meetsBadgeRequirement(selectedArea, trainer.badges, trainer.unlockedAreaIds)
  const meetsKeyItemReq = meetsKeyItemRequirement(selectedArea, trainer.keyItems, trainer.unlockedAreaIds)
  const neededKeyItem = selectedArea.requiredKeyItem ? ITEM_MAP[selectedArea.requiredKeyItem] : undefined
  const blocker = selectedIsAdjacent ? travelBlocker(currentArea, selectedArea, trainer) : null
  const needsExploring = blocker === 'explore'
  const canTravelToSelected = !selectedIsCurrent && selectedIsAdjacent && blocker === null
  const selectedIsLocked = !selectedIsUnknown && (!meetsBadgeReq || !meetsKeyItemReq || needsExploring)
  const selectedExploresDone = exploresDone(selectedArea, trainer.exploreProgress)
  const selectedExplored = isAreaExplored(selectedArea, trainer.exploreProgress)
  // Finishing an area can earn a gift, handed over once the explore is done
  const pendingReward = !exploring && !showCity && rewardPutOffFor !== currentArea.id
    ? unclaimedReward(currentArea, trainer)
    : null

  return (
    <div className="overworld">

      {/* ── Trainer header ── */}
      <header className="trainer-bar">
        <button className="btn btn-secondary title-btn" onClick={onGoToTitle} title="Title screen">
          🏠
        </button>
        <button className="trainer-bar__name" onClick={onOpenProfile} title="View profile">{trainer.name}</button>
        <div className="trainer-bar__level" title="Gym Badges earned">🏅 {trainer.badges.length}/{KANTO_GYMS.length} Badges</div>
        <button className="btn btn-secondary pokedex-btn" onClick={onOpenPokedex}>
          <PokedexIcon /> Pokédex
        </button>
        <button className="btn btn-secondary bag-btn" onClick={onOpenBag} title="Open Bag">
          🎒 Bag
        </button>
        <span className="trainer-bar__money" title="Pokédollars">💰 ¥{trainer.money.toLocaleString()}</span>
        <button className="btn btn-secondary mute-toggle-btn" onClick={handleMuteToggle} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="overworld__main">

        {showCity ? (
          <CityScreen
            area={currentArea}
            onOpenMap={() => onCityViewChange(false)}
            onStartBattle={onStartBattle}
          />
        ) : (
        <section className="map-section">
          <WorldMapCanvas
            areas={KANTO_AREAS}
            currentAreaId={trainer.currentAreaId}
            unlockedAreaIds={trainer.unlockedAreaIds}
            badges={trainer.badges}
            keyItems={trainer.keyItems}
            exploreProgress={trainer.exploreProgress}
            selectedAreaId={selectedAreaId}
            onSelectArea={handleSelectArea}
            onTravel={handleTravel}
            onOpenFullMap={() => setFullMapOpen(true)}
          />
        </section>
        )}

        {/* Side panel */}
        <aside className="side-panel">

          {/* Area detail (the city screen already covers this when it's open) */}
          {!showCity && (
          <div className="area-detail">
            <h2 className="area-detail__name">{selectedIsUnknown ? '???' : selectedArea.name}</h2>
            <p className="area-detail__desc">
              {selectedIsUnknown
                ? 'An unexplored area hidden beyond the horizon...'
                : selectedArea.description}
            </p>

            {!selectedIsUnknown && selectedArea.exploresToComplete > 0 && (
              <div className={`explore-progress${selectedExplored ? ' explore-progress--done' : ''}`}>
                <div className="explore-progress__label">
                  <span>{selectedExplored ? '✓ Area explored' : 'Explored'}</span>
                  <span>{selectedExploresDone} / {selectedArea.exploresToComplete}</span>
                </div>
                <div className="explore-progress__bar">
                  <div
                    className="explore-progress__fill"
                    style={{ width: `${Math.round((selectedExploresDone / selectedArea.exploresToComplete) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {selectedIsLocked && (
              <div className="area-detail__locked-hint">
                {selectedArea.requiredBadge && !meetsBadgeReq && (
                  <p>🏅 Earn the {BADGE_NAMES[selectedArea.requiredBadge] ?? selectedArea.requiredBadge} to travel here</p>
                )}
                {meetsBadgeReq && !meetsKeyItemReq && neededKeyItem && (
                  <p>🎒 You need the {neededKeyItem.name} to travel here. {neededKeyItem.howToGet}</p>
                )}
                {meetsBadgeReq && meetsKeyItemReq && needsExploring && (
                  <p>🧭 Finish exploring {currentArea.name} to travel here ({exploresDone(currentArea, trainer.exploreProgress)}/{currentArea.exploresToComplete})</p>
                )}
              </div>
            )}

            <div className="area-detail__actions">
              {selectedIsCurrent && (
                <>
                  {canExplore(selectedArea) && (
                    <button
                      className="btn btn-explore btn-explore--large"
                      onClick={() => setExploring(true)}
                      disabled={!partyHasLiveMember}
                      title={!partyHasLiveMember ? 'All your Pokémon have fainted!' : undefined}
                    >
                      🔍 Explore
                    </button>
                  )}
                  {hasCityHub(selectedArea) && (
                    <button className="btn btn-pokecenter" onClick={() => onCityViewChange(true)}>
                      🏙 Enter {selectedArea.name}
                    </button>
                  )}
                  {!partyHasLiveMember && !hasCityHub(selectedArea) && (
                    <p className="area-detail__blackout-warning">
                      All Pokémon fainted — visit the Pokémon Center!
                    </p>
                  )}
                </>
              )}
              {canTravelToSelected && (
                <button className="btn btn-travel-here" onClick={() => handleTravel(selectedAreaId)}>
                  ➜ Go to {selectedArea.name}
                </button>
              )}
            </div>

            {!selectedIsUnknown && selectedArea.encounters.length > 0 && (
              <EncounterPreview encounters={availableEncounters(selectedArea, trainer.keyItems)} />
            )}
          </div>
          )}

          {/* Party panel */}
          <section className="party-panel">
            <div className="party-panel__header">
              <h3 className="party-panel__title">Your Party</h3>
              <button className="btn party-manage-btn" onClick={onOpenParty}>
                ⚙ Manage
              </button>
            </div>
            <div className="party-panel__list">
              {trainer.party.map(p => (
                <PartyMember key={p.uid} pokemon={p} />
              ))}
            </div>
          </section>
        </aside>
      </main>

      {/* ── Full Kanto map ── */}
      {fullMapOpen && <FullMapModal onClose={() => setFullMapOpen(false)} />}

      {/* ── Completion reward ── */}
      {pendingReward && (
        <GiftDialog
          key={currentArea.id}
          place={currentArea.name}
          icon="🎁"
          npcName={pendingReward.npcName}
          lines={pendingReward.lines}
          gift={pendingReward.gift}
          claimId={currentArea.id}
          onClose={() => setRewardPutOffFor(currentArea.id)}
        />
      )}

      {/* ── Explore modal ── */}
      {exploring && (
        <ExploreModal
          area={currentArea}
          onWildEncounter={() => onStartBattle({ kind: 'wild' })}
          onTrainerBattle={routeTrainer => onStartBattle({ kind: 'route-trainer', trainer: routeTrainer })}
          onClose={() => setExploring(false)}
        />
      )}
    </div>
  )
}

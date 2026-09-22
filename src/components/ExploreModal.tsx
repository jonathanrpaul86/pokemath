import { useEffect, useRef, useState } from 'react'
import { useGameStore, useTrainer } from '../store'
import { rollExploreOutcome } from '../utils/explore'
import { exploresDone, isAreaExplored } from '../data/areas'
import { playCorrect } from '../utils/sound'
import { ITEM_MAP, ITEM_EMOJI, BALL_EMOJI } from '../data/items'
import type { Area, ExploreOutcome, RouteTrainer } from '../types'
import './ExploreModal.css'

interface Props {
  area: Area
  onWildEncounter: () => void
  onTrainerBattle: (trainer: RouteTrainer) => void
  onClose: () => void
}

type View =
  | { stage: 'searching' }
  | { stage: 'result'; outcome: ExploreOutcome; finishedArea: boolean }

const SEARCH_MS = 900
const WILD_REVEAL_MS = 800

const FLAVOR: Record<Area['areaType'], { icon: string; searching: string; nothing: string }> = {
  route:   { icon: '🌿', searching: 'Searching the tall grass…',   nothing: 'Just the wind rustling the tall grass.' },
  forest:  { icon: '🌲', searching: 'Peeking between the trees…',  nothing: 'Only birds chirping in the trees.' },
  cave:    { icon: '🔦', searching: 'Exploring the dark tunnels…', nothing: 'Just echoes in the dark.' },
  special: { icon: '🔍', searching: 'Looking around carefully…',   nothing: 'Nothing here right now.' },
  city:    { icon: '🔍', searching: 'Looking around carefully…',   nothing: 'Nothing here right now.' },
  town:    { icon: '🔍', searching: 'Looking around carefully…',   nothing: 'Nothing here right now.' },
}

export default function ExploreModal({ area, onWildEncounter, onTrainerBattle, onClose }: Props) {
  const { dispatch } = useGameStore()
  const trainer = useTrainer()
  const [view, setView] = useState<View>({ stage: 'searching' })
  const flavor = FLAVOR[area.areaType]
  const done = exploresDone(area, trainer.exploreProgress)
  const explored = isAreaExplored(area, trainer.exploreProgress)

  // Search beat → roll the outcome and bank any found reward
  useEffect(() => {
    if (view.stage !== 'searching') return
    const t = setTimeout(() => {
      const outcome = rollExploreOutcome(area)
      if (outcome.kind === 'item') {
        dispatch({ type: 'ADD_ITEM', payload: { itemId: outcome.itemId, quantity: outcome.quantity } })
        playCorrect()
      } else if (outcome.kind === 'money') {
        dispatch({ type: 'GAIN_MONEY', payload: { amount: outcome.amount } })
        playCorrect()
      }
      // Battles count when they end (see App); everything else counts now
      const counted = outcome.kind !== 'wild' && outcome.kind !== 'trainer'
      if (counted) dispatch({ type: 'RECORD_EXPLORE', payload: { areaId: area.id } })
      const finishedArea = counted && !explored && done + 1 >= area.exploresToComplete
      setView({ stage: 'result', outcome, finishedArea })
    }, SEARCH_MS)
    return () => clearTimeout(t)
  }, [view, area, dispatch, done, explored])

  // Wild Pokémon jump straight into battle after a short "!" reveal.
  // Read the callback through a ref so a parent re-render can't restart the timer.
  const outcome = view.stage === 'result' ? view.outcome : null
  const onWildRef = useRef(onWildEncounter)
  useEffect(() => { onWildRef.current = onWildEncounter })
  useEffect(() => {
    if (outcome?.kind !== 'wild') return
    const t = setTimeout(() => onWildRef.current(), WILD_REVEAL_MS)
    return () => clearTimeout(t)
  }, [outcome])

  function exploreAgain() {
    setView({ stage: 'searching' })
  }

  // Enter/Space continues, Escape leaves (trainers can't be dodged, like the real games)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!outcome) return
      if (e.key === 'Escape' && outcome.kind !== 'trainer' && outcome.kind !== 'wild') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (outcome.kind === 'trainer') onTrainerBattle(outcome.trainer)
        else if (outcome.kind !== 'wild') exploreAgain()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [outcome, onClose, onTrainerBattle])

  const canDismiss = outcome !== null && outcome.kind !== 'trainer' && outcome.kind !== 'wild'

  return (
    <div className="explore-overlay" onClick={canDismiss ? onClose : undefined}>
      <div className="explore-modal" onClick={e => e.stopPropagation()}>
        <p className="explore-modal__area">
          {area.name} · {explored ? '✓ Explored' : `${done}/${area.exploresToComplete} explored`}
        </p>

        {outcome === null && (
          <div className="explore-result">
            <span className="explore-result__icon explore-result__icon--searching">{flavor.icon}</span>
            <p className="explore-result__text">{flavor.searching}</p>
          </div>
        )}

        {outcome?.kind === 'wild' && (
          <div className="explore-result">
            <span className="explore-result__icon explore-result__icon--alert">❗</span>
            <p className="explore-result__text">Something is moving… a wild Pokémon appeared!</p>
          </div>
        )}

        {outcome?.kind === 'trainer' && (
          <div className="explore-result">
            <span className="explore-result__icon explore-result__icon--alert">❗</span>
            <p className="explore-result__text">{outcome.trainer.name} wants to battle!</p>
            <p className="explore-result__quote">“{outcome.trainer.quote}”</p>
            <p className="explore-result__team" aria-label={`${outcome.trainer.team.length} Pokémon`}>
              {outcome.trainer.team.map((_, i) => <span key={i}>🔴</span>)}
            </p>
            <div className="explore-actions">
              <button className="btn btn-battle" onClick={() => onTrainerBattle(outcome.trainer)}>
                ⚔ Battle!
              </button>
            </div>
          </div>
        )}

        {outcome?.kind === 'item' && (
          <div className="explore-result">
            <span className="explore-result__icon explore-result__icon--found">
              {ITEM_EMOJI[outcome.itemId] ?? BALL_EMOJI[outcome.itemId] ?? '🎁'}
            </span>
            <p className="explore-result__text">
              You found a {ITEM_MAP[outcome.itemId]?.name ?? outcome.itemId}!
            </p>
            <p className="explore-result__sub">It went into your Bag.</p>
          </div>
        )}

        {outcome?.kind === 'money' && (
          <div className="explore-result">
            <span className="explore-result__icon explore-result__icon--found">💰</span>
            <p className="explore-result__text">You found ¥{outcome.amount} on the ground!</p>
          </div>
        )}

        {outcome?.kind === 'nothing' && (
          <div className="explore-result">
            <span className="explore-result__icon">{flavor.icon}</span>
            <p className="explore-result__text">{flavor.nothing}</p>
            <p className="explore-result__sub">No treasure, but you explored a little more of the area.</p>
          </div>
        )}

        {view.stage === 'result' && view.finishedArea && (
          <p className="explore-finished">🎉 {area.name} is fully explored! New paths are open.</p>
        )}

        {canDismiss && (
          <div className="explore-actions">
            <button className="btn btn-explore" onClick={exploreAgain}>🔍 Explore again</button>
            <button className="btn btn-secondary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

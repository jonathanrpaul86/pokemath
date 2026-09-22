import { useState } from 'react'
import { useGameStore } from './store'
import { AREA_MAP } from './data/areas'
import TitleScreen from './screens/TitleScreen'
import StarterSelect from './screens/StarterSelect'
import OverworldScreen from './screens/OverworldScreen'
import BattleScreen from './screens/BattleScreen'
import PokedexScreen from './screens/PokedexScreen'
import PartyScreen from './screens/PartyScreen'
import ProfileScreen from './screens/ProfileScreen'
import BagScreen from './screens/BagScreen'
import type { RouteTrainer } from './types'
import './index.css'

type GameScreen = 'overworld' | 'battle' | 'pokedex' | 'party' | 'profile' | 'bag'

function App() {
  const { trainer, currentSlot, saves, dispatch, loadSlot, deleteSlot, goToTitle } = useGameStore()
  const [starterSlot, setStarterSlot] = useState<number | null>(null)
  const [gameScreen, setGameScreen] = useState<GameScreen>('overworld')
  const [routeTrainer, setRouteTrainer] = useState<RouteTrainer | null>(null)

  /** Explore battles count toward area progress unless the player blacked out */
  function endExploreBattle(counted: boolean) {
    if (counted && trainer) {
      dispatch({ type: 'RECORD_EXPLORE', payload: { areaId: trainer.currentAreaId } })
    }
    setRouteTrainer(null)
    setGameScreen('overworld')
  }

  // No active slot → show title or starter select
  if (currentSlot === null) {
    if (starterSlot !== null) {
      return (
        <StarterSelect
          slot={starterSlot}
          onBack={() => setStarterSlot(null)}
        />
      )
    }
    return (
      <TitleScreen
        saves={saves}
        onNewGame={slot => setStarterSlot(slot)}
        onPlay={slot => { loadSlot(slot); setGameScreen('overworld') }}
        onDelete={deleteSlot}
      />
    )
  }

  // Active slot, but startNewGame hasn't set trainer yet (shouldn't happen, guard anyway)
  if (!trainer) return null

  if (gameScreen === 'battle') {
    return (
      <BattleScreen
        area={AREA_MAP[trainer.currentAreaId]}
        onBattleEnd={outcome => endExploreBattle(outcome !== 'blacked-out')}
        trainerBattle={routeTrainer ? {
          trainerName: routeTrainer.name,
          isLeader: false,
          team: routeTrainer.team,
          quote: routeTrainer.quote,
          onComplete: won => endExploreBattle(won),
        } : undefined}
      />
    )
  }

  if (gameScreen === 'pokedex') {
    return <PokedexScreen onBack={() => setGameScreen('overworld')} />
  }

  if (gameScreen === 'party') {
    return <PartyScreen onBack={() => setGameScreen('overworld')} />
  }

  if (gameScreen === 'profile') {
    return <ProfileScreen onBack={() => setGameScreen('overworld')} />
  }

  if (gameScreen === 'bag') {
    return <BagScreen onBack={() => setGameScreen('overworld')} />
  }

  return (
    <OverworldScreen
      onStartBattle={rt => { setRouteTrainer(rt ?? null); setGameScreen('battle') }}
      onOpenPokedex={() => setGameScreen('pokedex')}
      onOpenParty={() => setGameScreen('party')}
      onOpenProfile={() => setGameScreen('profile')}
      onOpenBag={() => setGameScreen('bag')}
      onGoToTitle={() => { goToTitle(); setStarterSlot(null) }}
    />
  )
}

export default App

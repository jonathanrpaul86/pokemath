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
import type { BattleRequest } from './types'
import './index.css'

type GameScreen = 'overworld' | 'battle' | 'pokedex' | 'party' | 'profile' | 'bag'

function App() {
  const { trainer, currentSlot, saves, dispatch, loadSlot, deleteSlot, goToTitle } = useGameStore()
  const [starterSlot, setStarterSlot] = useState<number | null>(null)
  const [gameScreen, setGameScreen] = useState<GameScreen>('overworld')
  const [battleRequest, setBattleRequest] = useState<BattleRequest>({ kind: 'wild' })
  /** In a city, show the city screen (true) or the world map (false) */
  const [cityView, setCityView] = useState(true)

  function startBattle(request: BattleRequest) {
    setBattleRequest(request)
    setGameScreen('battle')
  }

  /** Explore battles count toward area progress; rare Storyteller encounters don't */
  function endBattle(countsAsExplore: boolean) {
    if (countsAsExplore && trainer) {
      dispatch({ type: 'RECORD_EXPLORE', payload: { areaId: trainer.currentAreaId } })
    }
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
        onPlay={slot => { loadSlot(slot); setCityView(true); setGameScreen('overworld') }}
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
        onBattleEnd={outcome => endBattle(battleRequest.kind === 'wild' && outcome !== 'blacked-out')}
        wildOverride={battleRequest.kind === 'rare' ? battleRequest.encounter : undefined}
        trainerBattle={battleRequest.kind === 'route-trainer' ? {
          trainerName: battleRequest.trainer.name,
          isLeader: false,
          team: battleRequest.trainer.team,
          quote: battleRequest.trainer.quote,
          onComplete: won => endBattle(won),
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
      onStartBattle={startBattle}
      cityView={cityView}
      onCityViewChange={setCityView}
      onOpenPokedex={() => setGameScreen('pokedex')}
      onOpenParty={() => setGameScreen('party')}
      onOpenProfile={() => setGameScreen('profile')}
      onOpenBag={() => setGameScreen('bag')}
      onGoToTitle={() => { goToTitle(); setStarterSlot(null) }}
    />
  )
}

export default App

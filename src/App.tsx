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
import './index.css'

type GameScreen = 'overworld' | 'battle' | 'pokedex' | 'party' | 'profile'

function App() {
  const { trainer, currentSlot, saves, loadSlot, deleteSlot, goToTitle } = useGameStore()
  const [starterSlot, setStarterSlot] = useState<number | null>(null)
  const [gameScreen, setGameScreen] = useState<GameScreen>('overworld')

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
        onBattleEnd={() => setGameScreen('overworld')}
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

  return (
    <OverworldScreen
      onStartBattle={() => setGameScreen('battle')}
      onOpenPokedex={() => setGameScreen('pokedex')}
      onOpenParty={() => setGameScreen('party')}
      onOpenProfile={() => setGameScreen('profile')}
      onGoToTitle={goToTitle}
    />
  )
}

export default App

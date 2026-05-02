import { useState } from 'react'
import { useGameStore } from './store'
import { AREA_MAP } from './data/areas'
import TitleScreen from './screens/TitleScreen'
import StarterSelect from './screens/StarterSelect'
import OverworldScreen from './screens/OverworldScreen'
import BattleScreen from './screens/BattleScreen'
import PokedexScreen from './screens/PokedexScreen'
import PartyScreen from './screens/PartyScreen'
import './index.css'

type PreGameScreen = 'title' | 'starter-select'
type GameScreen = 'overworld' | 'battle' | 'pokedex' | 'party'

function App() {
  const { trainer } = useGameStore()
  const [preGame, setPreGame] = useState<PreGameScreen>('title')
  const [gameScreen, setGameScreen] = useState<GameScreen>('overworld')

  if (!trainer) {
    if (preGame === 'starter-select') {
      return <StarterSelect onBack={() => setPreGame('title')} />
    }
    return <TitleScreen onNewGame={() => setPreGame('starter-select')} />
  }

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

  return (
    <OverworldScreen
      onStartBattle={() => setGameScreen('battle')}
      onOpenPokedex={() => setGameScreen('pokedex')}
      onOpenParty={() => setGameScreen('party')}
    />
  )
}

export default App

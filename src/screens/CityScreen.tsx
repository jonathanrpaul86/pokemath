import { useEffect, useState } from 'react'
import { useTrainer } from '../store'
import { CITY_HUBS } from '../data/cities'
import { gymForCity } from '../data/gyms'
import { exploresDone, isAreaExplored, hasKeyItem } from '../data/areas'
import { ITEM_MAP } from '../data/items'
import { canExplore } from '../utils/explore'
import { storyStatus } from '../utils/storyteller'
import PokemonCenterModal from '../components/PokemonCenterModal'
import PokeMartModal from '../components/PokeMartModal'
import NpcDialog from '../components/NpcDialog'
import GiftDialog from '../components/GiftDialog'
import StorytellerModal from '../components/StorytellerModal'
import ExploreModal from '../components/ExploreModal'
import GymScreen from './GymScreen'
import type { Area, BattleRequest, GiftDefinition, NpcHouse } from '../types'
import './CityScreen.css'

interface Props {
  area: Area
  onOpenMap: () => void
  onStartBattle: (request: BattleRequest) => void
}

type OpenBuilding =
  | { kind: 'center' }
  | { kind: 'mart' }
  | { kind: 'gym'; gymId: string }
  | { kind: 'house'; house: NpcHouse }
  | { kind: 'gift'; house: NpcHouse; lines: string[]; gift: GiftDefinition; claimId?: string; takesKeyItemId?: string }
  | { kind: 'storyteller' }
  | { kind: 'explore' }

interface BuildingCard {
  key: string
  icon: string
  name: string
  status?: string
  tone?: 'good' | 'locked' | 'new'
  disabled?: boolean
  open: OpenBuilding
}

export default function CityScreen({ area, onOpenMap, onStartBattle }: Props) {
  const trainer = useTrainer()
  const [open, setOpen] = useState<OpenBuilding | null>(null)
  const hub = CITY_HUBS[area.id]
  const gym = gymForCity(area.id)
  const partyHasLiveMember = trainer.party.some(p => p.currentHp > 0)

  const cards: BuildingCard[] = [
    { key: 'center', icon: '🏥', name: 'Pokémon Center', status: 'Heal your team', open: { kind: 'center' } },
  ]
  if (area.martItems?.length) {
    cards.push({ key: 'mart', icon: '🛒', name: 'Poké Mart', status: 'Buy & sell items', open: { kind: 'mart' } })
  }
  if (gym) {
    const cleared = trainer.badges.includes(gym.leader.badge)
    const closed = !cleared && trainer.badges.length < (gym.requiredBadgeCount ?? 0)
    cards.push({
      key: 'gym',
      icon: closed ? '🔒' : '🏆',
      name: `${gym.leader.name}'s Gym`,
      status: cleared ? '✓ Cleared' : closed ? `Needs ${gym.requiredBadgeCount} badges` : `${gym.type} type`,
      tone: cleared ? 'good' : closed ? 'locked' : undefined,
      open: { kind: 'gym', gymId: gym.id },
    })
  }
  for (const house of hub?.houses ?? []) {
    const card = { key: house.id, icon: house.icon, name: house.name }
    const { exchange, gift } = house
    if (exchange && hasKeyItem(trainer.keyItems, exchange.takesKeyItemId)) {
      cards.push({
        ...card, tone: 'new', status: `🎁 Show your ${ITEM_MAP[exchange.takesKeyItemId]?.name ?? 'item'}`,
        open: { kind: 'gift', house, lines: exchange.lines, gift: exchange.gives, takesKeyItemId: exchange.takesKeyItemId },
      })
    } else if (
      gift && !trainer.claimedRewardIds.includes(house.id)
      && (!gift.requiredBadge || trainer.badges.includes(gift.requiredBadge))
    ) {
      cards.push({
        ...card, tone: 'new', status: '🎁 Has a gift for you',
        open: { kind: 'gift', house, lines: gift.lines, gift: gift.gift, claimId: house.id },
      })
    } else {
      cards.push({ ...card, status: house.npcName, open: { kind: 'house', house } })
    }
  }
  if (hub?.storyteller) {
    const status = storyStatus(trainer, area.id)
    cards.push({
      key: 'storyteller',
      icon: '📖',
      name: 'Storyteller',
      status: status.ready ? 'New story!' : `New story in ${status.exploresLeft} ${status.exploresLeft === 1 ? 'explore' : 'explores'}`,
      tone: status.ready ? 'new' : undefined,
      open: { kind: 'storyteller' },
    })
  }
  if (canExplore(area)) {
    const explored = isAreaExplored(area, trainer.exploreProgress)
    cards.push({
      key: 'explore',
      icon: '🔍',
      name: `Explore ${area.name}`,
      status: explored ? '✓ Explored' : `${exploresDone(area, trainer.exploreProgress)} / ${area.exploresToComplete} explored`,
      tone: explored ? 'good' : undefined,
      disabled: !partyHasLiveMember,
      open: { kind: 'explore' },
    })
  }

  // Number keys open buildings; M returns to the world map
  useEffect(() => {
    if (open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); onOpenMap(); return }
      const n = parseInt(e.key, 10)
      const card = cards[n - 1]
      if (card && !card.disabled) { e.preventDefault(); setOpen(card.open) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const close = () => setOpen(null)

  return (
    <section className="city-screen">
      <header className="city-screen__header">
        <div>
          <h2 className="city-screen__name">🏙 {area.name}</h2>
          <p className="city-screen__desc">{area.description}</p>
        </div>
        <button className="btn btn-secondary city-screen__map-btn" onClick={onOpenMap} title="World map (M)">
          🗺 World map
        </button>
      </header>

      <div className="city-screen__grid">
        {cards.map((card, i) => (
          <button
            key={card.key}
            className={`city-building${card.tone ? ` city-building--${card.tone}` : ''}`}
            onClick={() => setOpen(card.open)}
            disabled={card.disabled}
            title={card.disabled ? 'All your Pokémon have fainted!' : undefined}
          >
            <span className="city-building__key">{i + 1}</span>
            <span className="city-building__icon">{card.icon}</span>
            <span className="city-building__name">{card.name}</span>
            {card.status && <span className="city-building__status">{card.status}</span>}
          </button>
        ))}
      </div>

      {open?.kind === 'center' && <PokemonCenterModal onClose={close} />}
      {open?.kind === 'mart' && area.martItems && <PokeMartModal martItems={area.martItems} onClose={close} />}
      {open?.kind === 'gym' && <GymScreen gymId={open.gymId} onExit={close} />}
      {open?.kind === 'house' && <NpcDialog house={open.house} onClose={close} />}
      {open?.kind === 'gift' && (
        <GiftDialog
          place={open.house.name}
          icon={open.house.icon}
          npcName={open.house.npcName}
          lines={open.lines}
          gift={open.gift}
          claimId={open.claimId}
          takesKeyItemId={open.takesKeyItemId}
          onClose={close}
        />
      )}
      {open?.kind === 'storyteller' && hub?.storyteller && (
        <StorytellerModal
          area={area}
          storyteller={hub.storyteller}
          onRareEncounter={encounter => onStartBattle({ kind: 'rare', encounter })}
          onClose={close}
        />
      )}
      {open?.kind === 'explore' && (
        <ExploreModal
          area={area}
          onWildEncounter={() => onStartBattle({ kind: 'wild' })}
          onTrainerBattle={routeTrainer => onStartBattle({ kind: 'route-trainer', trainer: routeTrainer })}
          onClose={close}
        />
      )}
    </section>
  )
}

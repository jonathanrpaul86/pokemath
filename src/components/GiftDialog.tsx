import { useEffect, useState } from 'react'
import { useTrainer, useGameStore } from '../store'
import { ITEM_MAP } from '../data/items'
import { KANTO_NAMES } from '../data/pokedex'
import { fetchPokemonSpecies } from '../services/pokeApi'
import { createOwnedPokemon } from '../utils/formulas'
import { giftChoices } from '../utils/gifts'
import { PARTY_MAX } from '../store/reducer'
import type { GiftDefinition, OwnedPokemon } from '../types'

interface Props {
  place: string
  icon: string
  npcName: string
  /** What the NPC says before handing the gift over */
  lines: string[]
  gift: GiftDefinition
  /** Records the gift as handed out, so it's only given once */
  claimId?: string
  /** A key item the NPC takes in exchange */
  takesKeyItemId?: string
  onClose: () => void
}

type Step =
  | { kind: 'talk'; lineIdx: number }
  | { kind: 'choose'; options: number[] }
  | { kind: 'receiving' }
  | { kind: 'received'; message: string; pokemon?: OwnedPokemon }
  | { kind: 'error'; retry: () => void }

/**
 * An NPC handing over a gift: a key item, or a Pokémon (picked from a few
 * when there's a choice). The gift is only recorded when the player says
 * goodbye, so closing the game mid-way just offers it again next time.
 */
export default function GiftDialog({ place, icon, npcName, lines, gift, claimId, takesKeyItemId, onClose }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()
  const [step, setStep] = useState<Step>({ kind: 'talk', lineIdx: 0 })
  const [sprites, setSprites] = useState<Record<number, string>>({})

  function receivePokemon(speciesId: number, level: number) {
    setStep({ kind: 'receiving' })
    fetchPokemonSpecies(speciesId)
      .then(species => {
        const pokemon = createOwnedPokemon(species, level)
        const toPc = trainer.party.length >= PARTY_MAX
        const name = KANTO_NAMES[speciesId] ?? species.name
        setStep({
          kind: 'received',
          pokemon,
          message: `🎁 You received ${name}!${toPc ? ' Your party is full, so it was sent to your PC.' : ''}`,
        })
      })
      .catch(() => setStep({ kind: 'error', retry: () => receivePokemon(speciesId, level) }))
  }

  function handOver() {
    if (gift.kind === 'key-item') {
      setStep({ kind: 'received', message: `🎁 You got the ${ITEM_MAP[gift.keyItemId]?.name ?? gift.keyItemId}!` })
      return
    }
    const options = giftChoices(gift.speciesIds, trainer.pokedex)
    if (options.length === 1) receivePokemon(options[0], gift.level)
    else setStep({ kind: 'choose', options })
  }

  function finish(pokemon?: OwnedPokemon) {
    dispatch({
      type: 'RECEIVE_GIFT',
      payload: {
        claimId,
        takesKeyItemId,
        keyItemId: gift.kind === 'key-item' ? gift.keyItemId : undefined,
        pokemon,
      },
    })
    onClose()
  }

  function advance() {
    if (step.kind === 'talk') {
      if (step.lineIdx < lines.length - 1) setStep({ kind: 'talk', lineIdx: step.lineIdx + 1 })
      else handOver()
    } else if (step.kind === 'received') {
      finish(step.pokemon)
    }
  }

  function choose(speciesId: number) {
    if (gift.kind === 'pokemon') receivePokemon(speciesId, gift.level)
  }

  // Show the choices' sprites (PokéAPI responses are cached)
  const chooseKey = step.kind === 'choose' ? step.options.join(',') : ''
  useEffect(() => {
    if (step.kind !== 'choose') return
    let cancelled = false
    for (const id of step.options) {
      fetchPokemonSpecies(id)
        .then(species => { if (!cancelled) setSprites(s => ({ ...s, [id]: species.sprites.front })) })
        .catch(() => { /* names still show */ })
    }
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chooseKey])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        advance()
      } else if (step.kind === 'choose') {
        const n = parseInt(e.key, 10)
        if (n >= 1 && n <= step.options.length) { e.preventDefault(); choose(step.options[n - 1]) }
      } else if (step.kind === 'error' && e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const text = step.kind === 'talk' ? lines[step.lineIdx]
    : step.kind === 'choose' ? 'Which one would you like?'
    : step.kind === 'receiving' ? '…'
    : step.kind === 'received' ? step.message
    : 'Hmm, I couldn’t reach the Pokémon data. Check your internet connection and try again.'

  return (
    <div className="city-overlay">
      <div className="city-dialog">
        <p className="city-dialog__place">{icon} {place}</p>
        <p className="city-dialog__speaker">{npcName}</p>
        <p className="city-dialog__line">{text}</p>

        {step.kind === 'choose' && (
          <div className="gift-choices">
            {step.options.map((id, i) => (
              <button key={id} className="gift-choice" onClick={() => choose(id)}>
                <span className="gift-choice__key">{i + 1}</span>
                {sprites[id] ? <img className="gift-choice__sprite" src={sprites[id]} alt="" /> : <span className="gift-choice__sprite" />}
                <span className="gift-choice__name">{KANTO_NAMES[id] ?? `#${id}`}</span>
              </button>
            ))}
          </div>
        )}

        <div className="city-dialog__actions">
          {step.kind === 'talk' && <span className="city-dialog__count">{step.lineIdx + 1} / {lines.length}</span>}
          {step.kind === 'talk' && <button className="btn btn-primary" onClick={advance}>Next ▸</button>}
          {step.kind === 'received' && <button className="btn btn-primary" onClick={advance}>Thanks!</button>}
          {step.kind === 'error' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Later</button>
              <button className="btn btn-primary" onClick={step.retry}>Try again</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

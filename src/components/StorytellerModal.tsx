import { useEffect, useState } from 'react'
import { useGameStore, useTrainer } from '../store'
import { storyStatus, storyTierFor, pickStory, shuffledChoices, storytellerRare, STORY_COOLDOWN_EXPLORES } from '../utils/storyteller'
import { rollLootItem } from '../utils/explore'
import { playCorrect, playWrong } from '../utils/sound'
import { ITEM_MAP } from '../data/items'
import { KANTO_NAMES, spriteUrl } from '../data/pokedex'
import type { Area, StorytellerDefinition, WildOverride } from '../types'

interface Props {
  area: Area
  storyteller: StorytellerDefinition
  onRareEncounter: (encounter: WildOverride) => void
  onClose: () => void
}

type Stage =
  | { kind: 'resting'; exploresLeft: number }
  | { kind: 'tired' }
  | { kind: 'offer' }
  | { kind: 'story' }
  | { kind: 'question' }
  | { kind: 'reward-rare'; rare: { speciesId: number; level: number } }
  | { kind: 'reward-item'; itemId: string; firstTry: boolean }

function readAloud(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export default function StorytellerModal({ area, storyteller, onRareEncounter, onClose }: Props) {
  const trainer = useTrainer()
  const { dispatch } = useGameStore()

  const [stage, setStage] = useState<Stage>(() => {
    const status = storyStatus(trainer, area.id)
    if (!status.ready) return { kind: 'resting', exploresLeft: status.exploresLeft }
    if (!trainer.party.some(p => p.currentHp > 0)) return { kind: 'tired' }
    return { kind: 'offer' }
  })
  const [story] = useState(() => pickStory(storyTierFor(area), trainer.storyteller.heardStoryIds))
  const [choices] = useState(() => shuffledChoices(story))
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [showPassage, setShowPassage] = useState(false)

  const rareName = stage.kind === 'reward-rare' ? KANTO_NAMES[stage.rare.speciesId] ?? 'Pokémon' : ''

  // Stop reading aloud when the modal closes
  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [])

  function close() {
    // A story counts once the player has guessed, so closing can't re-roll a fresh first try
    if (stage.kind === 'question' && wrongPicks.length > 0) {
      dispatch({ type: 'FINISH_STORY', payload: { cityId: area.id, storyId: story.id } })
    }
    onClose()
  }

  function answer(choice: string) {
    if (stage.kind !== 'question' || wrongPicks.includes(choice)) return
    if (choice !== story.correctAnswer) {
      playWrong()
      setWrongPicks(w => [...w, choice])
      return
    }
    playCorrect()
    dispatch({ type: 'FINISH_STORY', payload: { cityId: area.id, storyId: story.id } })
    // A first try earns the rare until the player has it, then the backup item
    const firstTry = wrongPicks.length === 0
    const rare = firstTry ? storytellerRare(storyteller, trainer) : null
    if (rare) {
      setStage({ kind: 'reward-rare', rare })
    } else {
      const itemId = firstTry ? storyteller.backupItemId : rollLootItem(area)
      dispatch({ type: 'ADD_ITEM', payload: { itemId, quantity: 1 } })
      setStage({ kind: 'reward-item', itemId, firstTry })
    }
  }

  function advance() {
    switch (stage.kind) {
      case 'offer': setStage({ kind: 'story' }); break
      case 'story': setStage({ kind: 'question' }); break
      case 'reward-rare': onRareEncounter({ ...stage.rare, intro: `A rare ${rareName} appeared!` }); break
      case 'resting':
      case 'tired':
      case 'reward-item': close(); break
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return }
      if (stage.kind === 'question') {
        const n = parseInt(e.key, 10)
        if (n >= 1 && n <= choices.length) { e.preventDefault(); answer(choices[n - 1]) }
        return
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const passageText = story.passage.join(' ')

  return (
    <div className="city-overlay" onClick={close}>
      <div className="city-dialog storyteller" onClick={e => e.stopPropagation()}>
        <p className="city-dialog__place">📖 Storyteller</p>
        <p className="city-dialog__speaker">{storyteller.npcName}</p>

        {stage.kind === 'resting' && (
          <>
            <p className="city-dialog__line">
              I’m still dreaming up my next story! Go explore a little more and come back.
            </p>
            <p className="storyteller__hint">
              New story after {stage.exploresLeft} more {stage.exploresLeft === 1 ? 'explore' : 'explores'}
              {' '}(out of {STORY_COOLDOWN_EXPLORES}).
            </p>
          </>
        )}

        {stage.kind === 'tired' && (
          <p className="city-dialog__line">
            Oh my, your Pokémon look tired! Visit the Pokémon Center first, then come back for a story.
          </p>
        )}

        {stage.kind === 'offer' && (
          <p className="city-dialog__line">
            Hello there! Would you like to hear a story? Listen closely — I’ll ask you a question at the end!
          </p>
        )}

        {(stage.kind === 'story' || (stage.kind === 'question' && showPassage)) && (
          <div className="storyteller__passage">
            <h3 className="storyteller__title">{story.title}</h3>
            {story.passage.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}

        {stage.kind === 'question' && (
          <>
            <p className="storyteller__question">{story.question}</p>
            <div className="storyteller__choices">
              {choices.map((choice, i) => {
                const wrong = wrongPicks.includes(choice)
                return (
                  <button
                    key={choice}
                    className={`btn storyteller__choice${wrong ? ' storyteller__choice--wrong' : ''}`}
                    disabled={wrong}
                    onClick={() => answer(choice)}
                  >
                    <span className="storyteller__choice-key">{i + 1}</span> {choice}
                  </button>
                )
              })}
            </div>
            {wrongPicks.length > 0 && (
              <p className="storyteller__hint">Not quite! Try again — you can read the story one more time.</p>
            )}
          </>
        )}

        {stage.kind === 'reward-rare' && (
          <div className="storyteller__reward">
            <img className="storyteller__reward-sprite" src={spriteUrl(stage.rare.speciesId)} alt={rareName} />
            <p className="city-dialog__line">
              Wonderful — you were listening closely! Here’s a secret: a rare {rareName} is hiding nearby.
            </p>
          </div>
        )}

        {stage.kind === 'reward-item' && (
          <p className="city-dialog__line">
            {stage.firstTry ? 'Wonderful — you got it on the first try!' : 'You got it!'}
            {' '}Take this {ITEM_MAP[stage.itemId]?.name ?? stage.itemId} for listening so well.
          </p>
        )}

        <div className="city-dialog__actions">
          {(stage.kind === 'story' || stage.kind === 'question') && (
            <button className="btn btn-secondary" onClick={() => readAloud(stage.kind === 'story' ? passageText : `${story.question} ${choices.join('. ')}`)}>
              🔊 Read to me
            </button>
          )}
          {stage.kind === 'question' && (
            <button className="btn btn-secondary" onClick={() => setShowPassage(v => !v)}>
              {showPassage ? 'Hide story' : '📖 Read the story again'}
            </button>
          )}
          {stage.kind === 'offer' && <button className="btn btn-secondary" onClick={close}>Not now</button>}
          {stage.kind !== 'question' && (
            <button className="btn btn-primary" onClick={advance}>
              {stage.kind === 'offer' ? 'Yes, please!'
                : stage.kind === 'story' ? 'I’m ready for the question!'
                : stage.kind === 'reward-rare' ? `Find ${rareName}!`
                : 'Bye!'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const MUTE_KEY = 'pokemath_muted'

let _muted: boolean = localStorage.getItem(MUTE_KEY) === 'true'

export function isMuted(): boolean { return _muted }

export function setMuted(val: boolean) {
  _muted = val
  localStorage.setItem(MUTE_KEY, String(val))
}

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(
  ac: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.28,
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
}

/** A tone that glides from one pitch to another, fading in and out */
function sweep(
  ac: AudioContext,
  from: number,
  to: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.2,
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = type
  osc.frequency.setValueAtTime(from, startTime)
  osc.frequency.exponentialRampToValueAtTime(to, startTime + duration)
  gain.gain.setValueAtTime(0.001, startTime)
  gain.gain.exponentialRampToValueAtTime(gainPeak, startTime + duration * 0.4)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
}

/** Short ascending two-note chime — correct answer */
export function playCorrect() {
  if (_muted) return
  const ac = getCtx()
  const t = ac.currentTime
  tone(ac, 523, t,       0.14, 'sine', 0.3)   // C5
  tone(ac, 784, t + 0.1, 0.22, 'sine', 0.3)   // G5
}

/** Low descending buzz — wrong answer / timeout */
export function playWrong() {
  if (_muted) return
  const ac = getCtx()
  const t = ac.currentTime
  tone(ac, 220, t,        0.08, 'sawtooth', 0.18)
  tone(ac, 160, t + 0.07, 0.28, 'sawtooth', 0.14)
}

/** 4-note ascending arpeggio — successful catch */
export function playCatch() {
  if (_muted) return
  const ac = getCtx()
  const t = ac.currentTime
  tone(ac, 523,  t,        0.14, 'triangle', 0.28)  // C5
  tone(ac, 659,  t + 0.12, 0.14, 'triangle', 0.28)  // E5
  tone(ac, 784,  t + 0.24, 0.14, 'triangle', 0.28)  // G5
  tone(ac, 1047, t + 0.36, 0.35, 'triangle', 0.32)  // C6
}

/** Short fanfare — enemy fainted / victory */
export function playVictory() {
  if (_muted) return
  const ac = getCtx()
  const t = ac.currentTime
  tone(ac, 392,  t,        0.09, 'square', 0.14)  // G4
  tone(ac, 523,  t + 0.1,  0.09, 'square', 0.14)  // C5
  tone(ac, 659,  t + 0.2,  0.09, 'square', 0.14)  // E5
  tone(ac, 784,  t + 0.3,  0.28, 'square', 0.14)  // G5
}

/** Ascending scale — Pokémon levelled up */
export function playLevelUp() {
  if (_muted) return
  const ac = getCtx()
  const t = ac.currentTime
  tone(ac, 523,  t,        0.1, 'square', 0.14)  // C5
  tone(ac, 587,  t + 0.1,  0.1, 'square', 0.14)  // D5
  tone(ac, 659,  t + 0.2,  0.1, 'square', 0.14)  // E5
  tone(ac, 698,  t + 0.3,  0.1, 'square', 0.14)  // F5
  tone(ac, 784,  t + 0.4,  0.1, 'square', 0.14)  // G5
  tone(ac, 880,  t + 0.5,  0.1, 'square', 0.14)  // A5
  tone(ac, 988,  t + 0.6,  0.1, 'square', 0.14)  // B5
  tone(ac, 1047, t + 0.7,  0.3, 'square', 0.18)  // C6
}

/** Bright "item get" jingle — an NPC hands over a gift */
export function playGift() {
  if (_muted) return
  const ac = getCtx()
  const t = ac.currentTime
  tone(ac, 784,  t,        0.1,  'triangle', 0.26)  // G5
  tone(ac, 988,  t + 0.09, 0.1,  'triangle', 0.26)  // B5
  tone(ac, 1175, t + 0.18, 0.1,  'triangle', 0.26)  // D6
  tone(ac, 1568, t + 0.27, 0.45, 'triangle', 0.3)   // G6
  tone(ac, 1175, t + 0.27, 0.45, 'sine',     0.14)  // D6 harmony
}

/** Low rumbling swell rising into a shimmer — a legendary Pokémon appears */
export function playLegendary() {
  if (_muted) return
  const ac = getCtx()
  const t = ac.currentTime
  sweep(ac, 55,  110, t,       1.4, 'sawtooth', 0.12)  // rumble
  sweep(ac, 82,  165, t,       1.4, 'triangle', 0.16)
  tone(ac, 220, t + 0.9,  0.5, 'square', 0.1)          // A3
  tone(ac, 311, t + 1.05, 0.5, 'square', 0.1)          // Eb4: an eerie tritone
  sweep(ac, 880, 1760, t + 1.2, 0.8, 'sine', 0.14)     // shimmer
}

/** Two-part fanfare — entering the Hall of Fame */
export function playHallOfFame() {
  if (_muted) return
  const ac = getCtx()
  const t = ac.currentTime
  const melody: [number, number, number][] = [
    // [frequency, start, length]
    [523, 0,    0.14], [659, 0.15, 0.14], [784, 0.3,  0.14], [1047, 0.45, 0.4],   // C E G C
    [880, 0.9,  0.14], [988, 1.05, 0.14], [1047, 1.2, 0.14], [1319, 1.35, 0.8],  // A B C E
  ]
  for (const [f, start, len] of melody) tone(ac, f, t + start, len, 'square', 0.13)
  // Harmony underneath
  tone(ac, 262, t,        0.9, 'triangle', 0.16)  // C4
  tone(ac, 349, t + 0.9,  0.5, 'triangle', 0.16)  // F4
  tone(ac, 392, t + 1.35, 0.9, 'triangle', 0.18)  // G4
  tone(ac, 523, t + 1.35, 0.9, 'triangle', 0.14)  // C5
}

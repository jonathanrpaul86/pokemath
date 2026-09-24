import { describe, expect, it } from 'vitest'
import { moveMenuOptions } from './battle'
import type { Move } from '../types'

const SCRATCH: Move = { id: 10, name: 'scratch', type: 'normal', power: 40, accuracy: 100, damageClass: 'physical' }
const EMBER: Move = { id: 52, name: 'ember', type: 'fire', power: 40, accuracy: 100, damageClass: 'special' }
const GROWL: Move = { id: 45, name: 'growl', type: 'normal', power: null, accuracy: 100, damageClass: 'status' }

describe('moveMenuOptions', () => {
  it('offers nothing when choosing moves is off', () => {
    expect(moveMenuOptions([SCRATCH, EMBER], false)).toEqual([])
    expect(moveMenuOptions([SCRATCH, EMBER], undefined)).toEqual([])
  })

  it('offers only moves that deal damage', () => {
    expect(moveMenuOptions([SCRATCH, GROWL, EMBER], true)).toEqual([SCRATCH, EMBER])
  })

  it('skips the menu when there is at most one attack to pick', () => {
    expect(moveMenuOptions([SCRATCH, GROWL], true)).toEqual([])
    expect(moveMenuOptions([], true)).toEqual([])
    expect(moveMenuOptions(undefined, true)).toEqual([])
  })
})

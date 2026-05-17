export type ItemPocket = 'item' | 'ball' | 'key-item'

export interface ItemDefinition {
  id: string
  name: string
  description: string
  pocket: ItemPocket
  /** Buy price in Pokédollars; 0 = not sold in shops */
  buyPrice: number
  /** Sell price; 0 = cannot be sold */
  sellPrice: number
  /** Balls only: multiplier on problemsRequired — lower = easier catch */
  catchMultiplier?: number
  /** Healing items: HP restored; 0 = full restore */
  healAmount?: number
  /** Revive items: fraction of maxHp to restore (targets fainted Pokémon only) */
  revivePercent?: number
}

export interface InventorySlot {
  itemId: string
  quantity: number
}

export type BadgeId =
  | 'boulder-badge'
  | 'cascade-badge'
  | 'thunder-badge'
  | 'rainbow-badge'
  | 'soul-badge'
  | 'marsh-badge'
  | 'volcano-badge'
  | 'earth-badge'

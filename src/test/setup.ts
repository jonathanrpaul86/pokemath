import { beforeEach } from 'vitest'
import { installMemoryStorage } from './memoryStorage'

// Some modules read localStorage as soon as they're imported, so install one up front
installMemoryStorage()

beforeEach(() => {
  installMemoryStorage()
})

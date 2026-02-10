import { GenerationStrategyHandler } from './base-strategy'
import { StrategyContext, TOTO_CONSTANTS } from '@/types/lottery'

export class ColdDiversificationStrategy implements GenerationStrategyHandler {
  generateCandidate(context: StrategyContext): number[] {
    const sorted = [...context.frequencyData].sort((a, b) => b.frequency - a.frequency)

    // Top 10 = hot pool, bottom 10 = cold pool
    const hotPool = sorted.slice(0, 10).map(d => d.number)
    const coldPool = sorted.slice(-10).map(d => d.number)

    // If not enough frequency data, fall back to random
    if (hotPool.length < 3 || coldPool.length < 3) {
      const numbers = new Set<number>()
      while (numbers.size < TOTO_CONSTANTS.WINNING_NUMBERS_COUNT) {
        numbers.add(Math.floor(Math.random() * TOTO_CONSTANTS.MAX_NUMBER) + 1)
      }
      return Array.from(numbers)
    }

    const selected = new Set<number>()

    // Pick 3 from hot pool
    while (selected.size < 3) {
      const idx = Math.floor(Math.random() * hotPool.length)
      selected.add(hotPool[idx])
    }

    // Pick 3 from cold pool
    while (selected.size < 6) {
      const idx = Math.floor(Math.random() * coldPool.length)
      const num = coldPool[idx]
      if (!selected.has(num)) {
        selected.add(num)
      }
    }

    return Array.from(selected)
  }
}

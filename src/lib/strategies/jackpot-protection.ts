import { GenerationStrategyHandler } from './base-strategy'
import { StrategyOptions, TOTO_CONSTANTS } from '@/types/lottery'

export class JackpotProtectionStrategy implements GenerationStrategyHandler {
  generateCandidate(_context: unknown, options?: StrategyOptions): number[] {
    const avoidRange = options?.avoidRange ?? [1, 12]
    const [avoidMin, avoidMax] = avoidRange

    const selected = new Set<number>()

    // Allow at most 1 number from the avoid range
    const includeOneFromRange = Math.random() < 0.5
    if (includeOneFromRange) {
      const num = Math.floor(Math.random() * (avoidMax - avoidMin + 1)) + avoidMin
      selected.add(num)
    }

    // Fill rest from outside the avoid range
    const outsideRange: number[] = []
    for (let i = TOTO_CONSTANTS.MIN_NUMBER; i <= TOTO_CONSTANTS.MAX_NUMBER; i++) {
      if (i < avoidMin || i > avoidMax) {
        outsideRange.push(i)
      }
    }

    while (selected.size < TOTO_CONSTANTS.WINNING_NUMBERS_COUNT) {
      const idx = Math.floor(Math.random() * outsideRange.length)
      selected.add(outsideRange[idx])
    }

    return Array.from(selected)
  }
}

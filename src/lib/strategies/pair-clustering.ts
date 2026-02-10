import { GenerationStrategyHandler } from './base-strategy'
import { StrategyContext, StrategyOptions, TOTO_CONSTANTS } from '@/types/lottery'

export class PairClusteringStrategy implements GenerationStrategyHandler {
  generateCandidate(context: StrategyContext, options?: StrategyOptions): number[] {
    const minFreq = options?.minPairFrequency ?? 0

    // Get common pairs sorted by frequency
    const validPairs = context.pairFrequencies
      .filter(p => p.frequency > minFreq)
      .sort((a, b) => b.frequency - a.frequency)

    const selected = new Set<number>()

    if (validPairs.length > 0) {
      // Pick a random pair from the top 20 most common pairs
      const topPairs = validPairs.slice(0, Math.min(20, validPairs.length))
      const chosenPair = topPairs[Math.floor(Math.random() * topPairs.length)]
      selected.add(chosenPair.pair[0])
      selected.add(chosenPair.pair[1])
    }

    // Fill remaining slots randomly
    while (selected.size < TOTO_CONSTANTS.WINNING_NUMBERS_COUNT) {
      const num = Math.floor(Math.random() * TOTO_CONSTANTS.MAX_NUMBER) + 1
      selected.add(num)
    }

    return Array.from(selected)
  }
}

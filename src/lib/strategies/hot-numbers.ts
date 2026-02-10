import { GenerationStrategyHandler } from './base-strategy'
import { StrategyContext, StrategyOptions, TOTO_CONSTANTS } from '@/types/lottery'

export class HotNumbersStrategy implements GenerationStrategyHandler {
  generateCandidate(context: StrategyContext, options?: StrategyOptions): number[] {
    const multiplier = options?.hotWeightMultiplier ?? 1.17

    // Build weighted pool: each number gets a weight based on frequency
    const maxFreq = Math.max(...context.frequencyData.map(d => d.frequency), 1)
    const minFreq = Math.min(...context.frequencyData.map(d => d.frequency), 0)
    const range = maxFreq - minFreq || 1

    const weights: { number: number; weight: number }[] = context.frequencyData.map(d => {
      // Normalize frequency to 0-1, then apply multiplier for hot numbers
      const normalized = (d.frequency - minFreq) / range
      const weight = 1 + (normalized * (multiplier - 1))
      return { number: d.number, weight }
    })

    // Fill in any missing numbers (1-49) with weight 1
    const existingNumbers = new Set(weights.map(w => w.number))
    for (let i = TOTO_CONSTANTS.MIN_NUMBER; i <= TOTO_CONSTANTS.MAX_NUMBER; i++) {
      if (!existingNumbers.has(i)) {
        weights.push({ number: i, weight: 1 })
      }
    }

    return this.weightedSample(weights, TOTO_CONSTANTS.WINNING_NUMBERS_COUNT)
  }

  private weightedSample(items: { number: number; weight: number }[], count: number): number[] {
    const selected: number[] = []
    const remaining = [...items]

    for (let i = 0; i < count; i++) {
      const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0)
      let random = Math.random() * totalWeight
      let chosenIdx = 0

      for (let j = 0; j < remaining.length; j++) {
        random -= remaining[j].weight
        if (random <= 0) {
          chosenIdx = j
          break
        }
      }

      selected.push(remaining[chosenIdx].number)
      remaining.splice(chosenIdx, 1)
    }

    return selected
  }
}

import { GenerationStrategyHandler } from './base-strategy'
import { generateRandomCombination } from '@/lib/utils'

export class PureRandomStrategy implements GenerationStrategyHandler {
  generateCandidate(): number[] {
    return generateRandomCombination()
  }
}

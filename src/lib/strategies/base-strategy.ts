import { StrategyContext, StrategyOptions } from '@/types/lottery'

export interface GenerationStrategyHandler {
  generateCandidate(context: StrategyContext, options?: StrategyOptions): number[]
}

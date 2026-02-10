import { GenerationStrategy, StrategyInfo, SystemEntryType } from '@/types/lottery'

export const STRATEGY_METADATA: StrategyInfo[] = [
  {
    id: GenerationStrategy.PURE_RANDOM,
    name: 'Pure Random',
    shortDescription: 'Equal probability for all numbers',
    description: 'Standard random generation where every number from 1-49 has an equal chance of being selected. This is the mathematically "fair" approach - no bias, no patterns.',
    icon: 'Dice5',
  },
  {
    id: GenerationStrategy.HOT_NUMBERS,
    name: 'Hot Numbers',
    shortDescription: 'Favor frequently drawn numbers',
    description: 'Weights selection toward numbers that appear more often in historical draws. Hot numbers get a 1.15-1.19x selection multiplier. Based on the theory that some numbers may continue trending.',
    icon: 'Flame',
  },
  {
    id: GenerationStrategy.COLD_DIVERSIFICATION,
    name: 'Cold Diversification',
    shortDescription: 'Mix of hot and cold numbers',
    description: 'Picks 3 numbers from the top-10 most frequent (hot) and 3 from the bottom-10 least frequent (cold). Diversifies across the frequency spectrum for balanced coverage.',
    icon: 'Snowflake',
  },
  {
    id: GenerationStrategy.PAIR_CLUSTERING,
    name: 'Pair Clustering',
    shortDescription: 'Include historically common pairs',
    description: 'Guarantees at least one pair of numbers that has appeared together frequently in past draws. The remaining 4 numbers are selected randomly. Based on co-occurrence patterns.',
    icon: 'Link',
  },
  {
    id: GenerationStrategy.JACKPOT_PROTECTION,
    name: 'Jackpot Protection',
    shortDescription: 'Avoid popular number ranges',
    description: 'Limits numbers from the 1-12 range (most popular due to birthdays/dates) to at most 1. If you win, fewer people share the jackpot. Optimizes expected payout, not odds.',
    icon: 'Shield',
  },
]

export const SYSTEM_ENTRIES: SystemEntryType[] = [
  { type: 'System 7', numbersSelected: 7, combinations: 7, cost: 7 },
  { type: 'System 8', numbersSelected: 8, combinations: 28, cost: 28 },
  { type: 'System 9', numbersSelected: 9, combinations: 84, cost: 84 },
  { type: 'System 10', numbersSelected: 10, combinations: 210, cost: 210 },
  { type: 'System 11', numbersSelected: 11, combinations: 462, cost: 462 },
  { type: 'System 12', numbersSelected: 12, combinations: 924, cost: 924 },
]

export function getStrategyInfo(strategy: GenerationStrategy): StrategyInfo {
  return STRATEGY_METADATA.find(s => s.id === strategy) ?? STRATEGY_METADATA[0]
}

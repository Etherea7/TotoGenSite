import { lotteryDb } from './convex'
import { createCombinationKey, sleep } from './utils'
import {
  TOTO_CONSTANTS,
  GenerationStrategy,
  StrategyOptions,
  NumberFrequency,
  PairFrequency,
  StrategyContext,
} from '@/types/lottery'
import {
  GenerationStrategyHandler,
  PureRandomStrategy,
  HotNumbersStrategy,
  ColdDiversificationStrategy,
  PairClusteringStrategy,
  JackpotProtectionStrategy,
} from './strategies'

export interface GenerationResult {
  combinations: number[][];
  processingTime: number;
  totalExistingCombinations: number;
  remainingPossible: number;
  attempts: number;
  strategy: GenerationStrategy;
}

export class CombinationGenerator {
  private existingCombinations: Set<string> = new Set();
  private temporaryCombinations: Set<string> = new Set();
  private lastRefresh: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Strategy data caches
  private frequencyData: NumberFrequency[] = [];
  private pairFrequencies: PairFrequency[] = [];
  private lastStrategyDataRefresh: number = 0;

  private async loadExistingCombinations(): Promise<void> {
    const now = Date.now();

    if (this.existingCombinations.size === 0 || (now - this.lastRefresh) > this.CACHE_DURATION) {
      try {
        this.existingCombinations = await lotteryDb.getExistingCombinations();
        this.lastRefresh = now;
        console.log(`Loaded ${this.existingCombinations.size} existing combinations`);
      } catch (error) {
        console.error('Failed to load existing combinations:', error);
      }
    }
  }

  private async loadStrategyData(): Promise<void> {
    const now = Date.now();

    if (this.frequencyData.length === 0 || (now - this.lastStrategyDataRefresh) > this.CACHE_DURATION) {
      try {
        const allDraws = await lotteryDb.getAllDrawNumbers();

        // Calculate per-number frequency
        const freqMap = new Map<number, number>();
        for (const draw of allDraws) {
          for (const num of draw) {
            freqMap.set(num, (freqMap.get(num) || 0) + 1);
          }
        }
        this.frequencyData = Array.from(freqMap.entries()).map(([number, frequency]) => ({
          number,
          frequency,
        }));

        // Calculate pair frequencies
        const pairMap = new Map<string, number>();
        for (const draw of allDraws) {
          const sorted = [...draw].sort((a, b) => a - b);
          for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
              const key = `${sorted[i]},${sorted[j]}`;
              pairMap.set(key, (pairMap.get(key) || 0) + 1);
            }
          }
        }
        this.pairFrequencies = Array.from(pairMap.entries()).map(([key, frequency]) => {
          const [a, b] = key.split(',').map(Number);
          return { pair: [a, b] as [number, number], frequency };
        });

        this.lastStrategyDataRefresh = now;
        console.log(`Loaded strategy data: ${this.frequencyData.length} numbers, ${this.pairFrequencies.length} pairs`);
      } catch (error) {
        console.error('Failed to load strategy data:', error);
      }
    }
  }

  private getStrategyHandler(strategy: GenerationStrategy): GenerationStrategyHandler {
    switch (strategy) {
      case GenerationStrategy.HOT_NUMBERS:
        return new HotNumbersStrategy();
      case GenerationStrategy.COLD_DIVERSIFICATION:
        return new ColdDiversificationStrategy();
      case GenerationStrategy.PAIR_CLUSTERING:
        return new PairClusteringStrategy();
      case GenerationStrategy.JACKPOT_PROTECTION:
        return new JackpotProtectionStrategy();
      case GenerationStrategy.PURE_RANDOM:
      default:
        return new PureRandomStrategy();
    }
  }

  async generateUniqueCombinations(
    count: number,
    strategy: GenerationStrategy = GenerationStrategy.PURE_RANDOM,
    options?: StrategyOptions,
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    if (count < 1 || count > TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST) {
      throw new Error(`Count must be between 1 and ${TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST}`);
    }

    await this.loadExistingCombinations();

    // Load strategy data for non-random strategies
    if (strategy !== GenerationStrategy.PURE_RANDOM) {
      await this.loadStrategyData();
    }

    const handler = this.getStrategyHandler(strategy);
    const context: StrategyContext = {
      frequencyData: this.frequencyData,
      pairFrequencies: this.pairFrequencies,
    };

    const results: number[][] = [];
    this.temporaryCombinations.clear();

    let attempts = 0;
    const maxAttempts = count * 1000;
    const maxConsecutiveFailures = 10000;
    let consecutiveFailures = 0;

    const totalExisting = this.existingCombinations.size;
    const remainingPossible = TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS - totalExisting;

    if (remainingPossible < count) {
      throw new Error(`Only ${remainingPossible} unique combinations remaining, but ${count} requested`);
    }

    console.log(`Generating ${count} combinations with strategy ${strategy}. Existing: ${totalExisting}, Remaining: ${remainingPossible}`);

    while (results.length < count && attempts < maxAttempts && consecutiveFailures < maxConsecutiveFailures) {
      const combination = handler.generateCandidate(context, options);
      const sortedKey = createCombinationKey(combination);

      if (!this.existingCombinations.has(sortedKey) && !this.temporaryCombinations.has(sortedKey)) {
        this.temporaryCombinations.add(sortedKey);
        results.push(combination);
        consecutiveFailures = 0;

        if (results.length % 10 === 0) {
          await sleep(1);
        }
      } else {
        consecutiveFailures++;
      }

      attempts++;
    }

    const processingTime = Date.now() - startTime;
    console.log(`Generation completed: ${results.length}/${count} combinations in ${attempts} attempts (${processingTime}ms)`);

    if (results.length < count) {
      const message = consecutiveFailures >= maxConsecutiveFailures
        ? 'Hit maximum consecutive failures - may be running out of unique combinations'
        : 'Hit maximum attempts limit';
      throw new Error(`Could only generate ${results.length} unique combinations out of ${count} requested. ${message}`);
    }

    return {
      combinations: results,
      processingTime,
      totalExistingCombinations: totalExisting,
      remainingPossible: remainingPossible - results.length,
      attempts,
      strategy,
    };
  }

  async generateSingleCombination(): Promise<number[]> {
    const result = await this.generateUniqueCombinations(1);
    return result.combinations[0];
  }

  clearCache(): void {
    this.existingCombinations.clear();
    this.temporaryCombinations.clear();
    this.frequencyData = [];
    this.pairFrequencies = [];
    this.lastRefresh = 0;
    this.lastStrategyDataRefresh = 0;
  }

  getCacheStats(): {
    existingCount: number;
    temporaryCount: number;
    lastRefresh: Date | null;
    cacheAge: number;
  } {
    return {
      existingCount: this.existingCombinations.size,
      temporaryCount: this.temporaryCombinations.size,
      lastRefresh: this.lastRefresh ? new Date(this.lastRefresh) : null,
      cacheAge: this.lastRefresh ? Date.now() - this.lastRefresh : 0
    };
  }

  async isUniqueCombination(numbers: number[]): Promise<boolean> {
    await this.loadExistingCombinations();
    const sortedKey = createCombinationKey(numbers);
    return !this.existingCombinations.has(sortedKey);
  }

  async getRemainingCombinationsCount(): Promise<number> {
    await this.loadExistingCombinations();
    return TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS - this.existingCombinations.size;
  }
}

// Export singleton instance
export const combinationGenerator = new CombinationGenerator();

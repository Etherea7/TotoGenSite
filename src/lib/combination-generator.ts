import { lotteryDb } from './supabase'
import { generateRandomCombination, createCombinationKey, sleep } from './utils'
import { TOTO_CONSTANTS } from '@/types/lottery'

export interface GenerationResult {
  combinations: number[][];
  processingTime: number;
  totalExistingCombinations: number;
  remainingPossible: number;
  attempts: number;
}

export class CombinationGenerator {
  private existingCombinations: Set<string> = new Set();
  private temporaryCombinations: Set<string> = new Set();
  private lastRefresh: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Load existing combinations from database if cache is stale
   */
  private async loadExistingCombinations(): Promise<void> {
    const now = Date.now();

    // Only refresh if cache is stale or empty
    if (this.existingCombinations.size === 0 || (now - this.lastRefresh) > this.CACHE_DURATION) {
      try {
        this.existingCombinations = await lotteryDb.getExistingCombinations();
        this.lastRefresh = now;
        console.log(`Loaded ${this.existingCombinations.size} existing combinations`);
      } catch (error) {
        console.error('Failed to load existing combinations:', error);
        // Continue with cached data or empty set
      }
    }
  }

  /**
   * Generate unique lottery combinations that haven't appeared before
   */
  async generateUniqueCombinations(count: number): Promise<GenerationResult> {
    const startTime = Date.now();

    // Validate input
    if (count < 1 || count > TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST) {
      throw new Error(`Count must be between 1 and ${TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST}`);
    }

    // Load existing combinations from database
    await this.loadExistingCombinations();

    const results: number[][] = [];
    this.temporaryCombinations.clear();

    let attempts = 0;
    const maxAttempts = count * 1000; // Safety limit to prevent infinite loops
    const maxConsecutiveFailures = 10000; // If we fail this many times in a row, likely no more combinations
    let consecutiveFailures = 0;

    // Check if we have enough remaining combinations
    const totalExisting = this.existingCombinations.size;
    const remainingPossible = TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS - totalExisting;

    if (remainingPossible < count) {
      throw new Error(`Only ${remainingPossible} unique combinations remaining, but ${count} requested`);
    }

    console.log(`Generating ${count} combinations. Existing: ${totalExisting}, Remaining: ${remainingPossible}`);

    while (results.length < count && attempts < maxAttempts && consecutiveFailures < maxConsecutiveFailures) {
      const combination = generateRandomCombination();
      const sortedKey = createCombinationKey(combination);

      // Check against both existing database combinations and temporary ones from this session
      if (!this.existingCombinations.has(sortedKey) && !this.temporaryCombinations.has(sortedKey)) {
        this.temporaryCombinations.add(sortedKey);
        results.push(combination);
        consecutiveFailures = 0;

        // Optional: Add small delay to prevent overwhelming the system
        if (results.length % 10 === 0) {
          await sleep(1);
        }
      } else {
        consecutiveFailures++;
      }

      attempts++;
    }

    const processingTime = Date.now() - startTime;

    // Log generation stats
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
      remainingPossible: remainingPossible - results.length, // Account for newly generated ones
      attempts
    };
  }

  /**
   * Generate a single unique combination (convenience method)
   */
  async generateSingleCombination(): Promise<number[]> {
    const result = await this.generateUniqueCombinations(1);
    return result.combinations[0];
  }

  /**
   * Clear the internal cache (force refresh on next generation)
   */
  clearCache(): void {
    this.existingCombinations.clear();
    this.temporaryCombinations.clear();
    this.lastRefresh = 0;
  }

  /**
   * Get cache statistics
   */
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

  /**
   * Check if a specific combination has been used before
   */
  async isUniqueCombination(numbers: number[]): Promise<boolean> {
    await this.loadExistingCombinations();
    const sortedKey = createCombinationKey(numbers);
    return !this.existingCombinations.has(sortedKey);
  }

  /**
   * Estimate how many unique combinations are remaining
   */
  async getRemainingCombinationsCount(): Promise<number> {
    await this.loadExistingCombinations();
    return TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS - this.existingCombinations.size;
  }
}

// Export singleton instance
export const combinationGenerator = new CombinationGenerator();
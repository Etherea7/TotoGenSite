import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TOTO_CONSTANTS } from "@/types/lottery"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random combination of 6 unique numbers between 1-49
 */
export function generateRandomCombination(): number[] {
  const numbers = new Set<number>();
  while (numbers.size < TOTO_CONSTANTS.WINNING_NUMBERS_COUNT) {
    numbers.add(Math.floor(Math.random() * TOTO_CONSTANTS.MAX_NUMBER) + 1);
  }
  return Array.from(numbers);
}

/**
 * Sort a combination and create a string key for comparison
 */
export function createCombinationKey(numbers: number[]): string {
  return [...numbers].sort((a, b) => a - b).join(',');
}

/**
 * Validate if a combination is valid (6 unique numbers between 1-49)
 */
export function isValidCombination(numbers: number[]): boolean {
  if (numbers.length !== TOTO_CONSTANTS.WINNING_NUMBERS_COUNT) return false;

  const uniqueNumbers = new Set(numbers);
  if (uniqueNumbers.size !== TOTO_CONSTANTS.WINNING_NUMBERS_COUNT) return false;

  return numbers.every(num =>
    num >= TOTO_CONSTANTS.MIN_NUMBER &&
    num <= TOTO_CONSTANTS.MAX_NUMBER
  );
}

/**
 * Format numbers for display (e.g., "1, 6, 9, 11, 29, 36")
 */
export function formatCombination(numbers: number[]): string {
  return numbers.sort((a, b) => a - b).join(', ');
}

/**
 * Parse prize value from string (handles empty values and formatting)
 */
export function parsePrize(value: string): number {
  if (!value || value.trim() === '' || value === '0.00') return 0;
  return parseFloat(value.replace(/,/g, ''));
}

/**
 * Parse integer from string (handles empty values)
 */
export function parseInteger(value: string): number {
  if (!value || value.trim() === '') return 0;
  return parseInt(value, 10) || 0;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return '-';
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-SG').format(num);
}

/**
 * Calculate coverage percentage
 */
export function calculateCoverage(existingCombinations: number): number {
  return (existingCombinations / TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS) * 100;
}

/**
 * Get time ago string
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diff = now.getTime() - past.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) break;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError!;
}
// Types for Singapore Toto Lottery System

export interface LotteryDraw {
  id?: number;
  draw_number: number;
  date: string;
  winning_number_1: number;
  winning_number_2: number;
  winning_number_3: number;
  winning_number_4: number;
  winning_number_5: number;
  winning_number_6: number;
  additional_number: number;

  // Statistical fields
  from_last?: string;
  low_numbers?: number;
  high_numbers?: number;
  odd_numbers?: number;
  even_numbers?: number;
  range_1_10?: number;
  range_11_20?: number;
  range_21_30?: number;
  range_31_40?: number;
  range_41_50?: number;

  // Prize information
  division_1_winners?: number;
  division_1_prize?: number;
  division_2_winners?: number;
  division_2_prize?: number;
  division_3_winners?: number;
  division_3_prize?: number;
  division_4_winners?: number;
  division_4_prize?: number;
  division_5_winners?: number;
  division_5_prize?: number;
  division_6_winners?: number;
  division_6_prize?: number;
  division_7_winners?: number;
  division_7_prize?: number;

  created_at?: string;
  updated_at?: string;
}

export interface LotteryCombination {
  numbers: number[];
  sortedKey: string;
}

export interface GenerateRequest {
  count: number; // 1-50
}

export interface GenerateResponse {
  success: boolean;
  combinations: number[][];
  processingTime: number;
  totalExistingCombinations: number;
  remainingPossible: number;
  message?: string;
}

export interface ScrapeResponse {
  success: boolean;
  newRecords: number;
  latestDraw: number;
  message: string;
  processingTime: number;
  error?: string;
}

export interface StatsResponse {
  totalDraws: number;
  uniqueCombinations: number;
  latestDraw: number;
  latestDate: string;
  coverage: number; // percentage of all possible combinations
  lastUpdated: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  database: boolean;
  cache?: boolean;
  lastScrape?: string;
  timestamp: string;
}

// CSV parsing types
export interface CSVRow {
  Draw: string;
  Date: string;
  'Winning Number 1': string;
  '2': string;
  '3': string;
  '4': string;
  '5': string;
  '6': string;
  'Additional Number': string;
  'From Last': string;
  Low: string;
  High: string;
  Odd: string;
  Even: string;
  '1-10': string;
  '11-20': string;
  '21-30': string;
  '31-40': string;
  '41-50': string;
  'Division 1 Winners': string;
  'Division 1 Prize': string;
  'Division 2 Winners': string;
  'Division 2 Prize': string;
  'Division 3 Winners': string;
  'Division 3 Prize': string;
  'Division 4 Winners': string;
  'Division 4 Prize': string;
  'Division 5 Winners': string;
  'Division 5 Prize': string;
  'Division 6 Winners': string;
  'Division 6 Prize': string;
  'Division 7 Winners': string;
  'Division 7 Prize': string;
}

// UI State types
export interface AppState {
  isGenerating: boolean;
  isScraping: boolean;
  lastGenerated: number[][];
  stats: StatsResponse | null;
  error: string | null;
}

// Constants
export const TOTO_CONSTANTS = {
  MIN_NUMBER: 1,
  MAX_NUMBER: 49,
  WINNING_NUMBERS_COUNT: 6,
  MAX_COMBINATIONS_PER_REQUEST: 50,
  TOTAL_POSSIBLE_COMBINATIONS: 13983816, // C(49,6)
} as const;
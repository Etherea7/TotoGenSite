import { createClient } from '@supabase/supabase-js'
import { LotteryDraw } from '@/types/lottery'

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing env.SUPABASE_URL')
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing env.SUPABASE_ANON_KEY')
}

// Create Supabase client for client-side operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Create Supabase client for server-side operations (with service role key)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
)

// Database operations for lottery draws
export class LotteryDatabase {
  private client = supabaseAdmin;

  /**
   * Insert a new lottery draw
   */
  async insertDraw(draw: Omit<LotteryDraw, 'id' | 'created_at' | 'updated_at'>): Promise<LotteryDraw | null> {
    const { data, error } = await this.client
      .from('lottery_draws')
      .insert(draw)
      .select()
      .single();

    if (error) {
      console.error('Error inserting draw:', error);
      throw new Error(`Failed to insert draw: ${error.message}`);
    }

    return data;
  }

  /**
   * Insert multiple draws (batch operation)
   */
  async insertDraws(draws: Omit<LotteryDraw, 'id' | 'created_at' | 'updated_at'>[]): Promise<LotteryDraw[]> {
    if (draws.length === 0) return [];

    const { data, error } = await this.client
      .from('lottery_draws')
      .insert(draws)
      .select();

    if (error) {
      console.error('Error inserting draws:', error);
      throw new Error(`Failed to insert draws: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all existing winning combinations as a Set
   */
  async getExistingCombinations(): Promise<Set<string>> {
    // Try to use the materialized view first for better performance
    const { data: viewData, error: viewError } = await this.client
      .from('winning_combinations')
      .select('sorted_combination_text');

    if (!viewError && viewData) {
      const combinations = new Set<string>();
      viewData.forEach(row => {
        if (row.sorted_combination_text) {
          combinations.add(row.sorted_combination_text);
        }
      });
      return combinations;
    }

    // Fallback to main table if view doesn't exist or fails
    console.warn('Materialized view not available, falling back to main table:', viewError?.message);

    const { data, error } = await this.client
      .from('lottery_draws')
      .select('"Winning Number 1", "2", "3", "4", "5", "6"');

    if (error) {
      console.error('Error fetching combinations:', error);
      throw new Error(`Failed to fetch combinations: ${error.message}`);
    }

    const combinations = new Set<string>();

    if (data) {
      data.forEach(row => {
        const numbers = [
          row["Winning Number 1"],
          row["2"],
          row["3"],
          row["4"],
          row["5"],
          row["6"]
        ].sort((a, b) => a - b);
        combinations.add(numbers.join(','));
      });
    }

    return combinations;
  }

  /**
   * Get statistics about the database
   */
  async getStatistics(): Promise<{
    totalDraws: number;
    uniqueCombinations: number;
    latestDraw: number;
    latestDate: string;
    lastUpdated: string;
  }> {
    // Get total draws and latest draw info
    const { data: drawsData, error: drawsError } = await this.client
      .from('lottery_draws')
      .select('"Draw", "Date"')
      .order('"Draw"', { ascending: false })
      .limit(1);

    if (drawsError) {
      throw new Error(`Failed to fetch statistics: ${drawsError.message}`);
    }

    // Get total count
    const { count, error: countError } = await this.client
      .from('lottery_draws')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to fetch count: ${countError.message}`);
    }

    const totalDraws = count || 0;
    const latest = drawsData?.[0];

    return {
      totalDraws,
      uniqueCombinations: totalDraws, // Each draw is unique
      latestDraw: latest?.["Draw"] || 0,
      latestDate: latest?.["Date"] || '',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get the latest draw number from database
   */
  async getLatestDrawNumber(): Promise<number> {
    const { data, error } = await this.client
      .from('lottery_draws')
      .select('"Draw"')
      .order('"Draw"', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to fetch latest draw: ${error.message}`);
    }

    return data?.["Draw"] || 0;
  }

  /**
   * Check if a draw number already exists
   */
  async drawExists(drawNumber: number): Promise<boolean> {
    const { data, error } = await this.client
      .from('lottery_draws')
      .select('"Draw"')
      .eq('"Draw"', drawNumber)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to check draw existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('lottery_draws')
        .select('"Draw"')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Refresh the materialized view for combination lookups
   */
  async refreshCombinationsView(): Promise<void> {
    const { error } = await this.client.rpc('refresh_winning_combinations');

    if (error) {
      console.error('Error refreshing combinations view:', error);
      // Don't throw - this is not critical for basic functionality
    }
  }
}

export const lotteryDb = new LotteryDatabase();
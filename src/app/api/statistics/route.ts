import { NextRequest, NextResponse } from 'next/server'
import { lotteryDb } from '@/lib/supabase'
import { StatsResponse } from '@/types/lottery'
import { calculateCoverage } from '@/lib/utils'

export async function GET(_request: NextRequest) {
  try {
    const stats = await lotteryDb.getStatistics()

    const response: StatsResponse = {
      totalDraws: stats.totalDraws,
      uniqueCombinations: stats.uniqueCombinations,
      latestDraw: stats.latestDraw,
      latestDate: stats.latestDate,
      coverage: calculateCoverage(stats.uniqueCombinations),
      lastUpdated: stats.lastUpdated,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Statistics API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { lotteryDb } from '@/lib/supabase'
import { HealthResponse } from '@/types/lottery'

export async function GET(_request: NextRequest) {
  try {
    const dbHealthy = await lotteryDb.healthCheck()

    // Get last scrape information if available
    let lastScrape: string | undefined
    try {
      const stats = await lotteryDb.getStatistics()
      lastScrape = stats.lastUpdated
    } catch {
      // Ignore error - just won't have last scrape info
    }

    const response: HealthResponse = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy,
      lastScrape,
      timestamp: new Date().toISOString(),
    }

    const httpStatus = dbHealthy ? 200 : 503

    return NextResponse.json(response, { status: httpStatus })
  } catch (error) {
    console.error('Health check error:', error)

    const response: HealthResponse = {
      status: 'unhealthy',
      database: false,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, { status: 503 })
  }
}
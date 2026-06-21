import { NextRequest, NextResponse } from 'next/server'
import { lotteryDb } from '@/lib/convex'
import { scrapeAndImportLatestDraws } from '@/lib/scrape-runner'

export async function POST(_request: NextRequest) {
  try {
    const response = await scrapeAndImportLatestDraws()
    return NextResponse.json(response, { status: response.success ? 200 : 500 })

  } catch (error) {
    console.error('Scrape API error:', error)

    const response = {
      success: false,
      newRecords: 0,
      latestDraw: 0,
      message: 'Scraping failed due to an unexpected error',
      processingTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// GET endpoint to check scraping status
export async function GET() {
  try {
    const stats = await lotteryDb.getStatistics()

    return NextResponse.json({
      status: 'ready',
      currentDrawCount: stats.totalDraws,
      latestDraw: stats.latestDraw,
      latestDate: stats.latestDate,
      lastUpdated: stats.lastUpdated,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

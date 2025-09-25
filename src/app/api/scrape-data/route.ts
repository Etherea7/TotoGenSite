import { NextRequest, NextResponse } from 'next/server'
import { totoScraper } from '@/lib/scraper'
import { lotteryDb } from '@/lib/supabase'
import { ScrapeResponse } from '@/types/lottery'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('Starting data scraping process...')

    // Get current latest draw number to avoid duplicates
    const currentLatestDraw = await lotteryDb.getLatestDrawNumber()
    console.log(`Current latest draw in DB: ${currentLatestDraw}`)

    // Scrape data from website
    const scrapingResult = await totoScraper.scrapeLotteryData()

    if (!scrapingResult.success) {
      console.error('Scraping failed:', scrapingResult.error)

      const response: ScrapeResponse = {
        success: false,
        newRecords: 0,
        latestDraw: currentLatestDraw,
        message: scrapingResult.message,
        processingTime: Date.now() - startTime,
        error: scrapingResult.error,
      }

      return NextResponse.json(response, { status: 500 })
    }

    // Filter out draws that already exist in the database
    const newDraws = scrapingResult.draws.filter(draw => draw.draw_number > currentLatestDraw)
    console.log(`Found ${newDraws.length} new draws to insert`)

    let insertedCount = 0
    let latestDrawNumber = currentLatestDraw

    if (newDraws.length > 0) {
      try {
        // Sort by draw number to insert in order
        newDraws.sort((a, b) => a.draw_number - b.draw_number)

        // Insert new draws
        const insertedDraws = await lotteryDb.insertDraws(newDraws)
        insertedCount = insertedDraws.length
        latestDrawNumber = Math.max(...newDraws.map(d => d.draw_number), currentLatestDraw)

        console.log(`Successfully inserted ${insertedCount} new draws`)

        // Refresh the materialized view for better performance
        try {
          await lotteryDb.refreshCombinationsView()
          console.log('Refreshed combinations view')
        } catch (viewError) {
          console.warn('Failed to refresh combinations view:', viewError)
          // Don't fail the entire operation for this
        }
      } catch (insertError) {
        console.error('Failed to insert draws:', insertError)

        const response: ScrapeResponse = {
          success: false,
          newRecords: 0,
          latestDraw: currentLatestDraw,
          message: 'Failed to insert new draws into database',
          processingTime: Date.now() - startTime,
          error: insertError instanceof Error ? insertError.message : 'Database insertion failed',
        }

        return NextResponse.json(response, { status: 500 })
      }
    }

    const processingTime = Date.now() - startTime
    let message = `Scraping completed successfully. `

    if (insertedCount > 0) {
      message += `Added ${insertedCount} new draws to database.`
    } else {
      message += `No new draws found. Database is up to date.`
    }

    const response: ScrapeResponse = {
      success: true,
      newRecords: insertedCount,
      latestDraw: latestDrawNumber,
      message,
      processingTime,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Scrape API error:', error)

    const response: ScrapeResponse = {
      success: false,
      newRecords: 0,
      latestDraw: 0,
      message: 'Scraping failed due to an unexpected error',
      processingTime: Date.now() - startTime,
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
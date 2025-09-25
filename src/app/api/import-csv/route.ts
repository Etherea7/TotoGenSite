import { NextRequest, NextResponse } from 'next/server'
import { lotteryDb } from '@/lib/supabase'
import { totoScraper } from '@/lib/scraper'
import { LotteryDraw } from '@/types/lottery'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      )
    }

    // Read file content
    const csvContent = await file.text()
    console.log(`Processing CSV file: ${file.name} (${csvContent.length} characters)`)

    // Parse CSV data
    const draws = totoScraper.parseCSVData(csvContent)
    console.log(`Parsed ${draws.length} draws from CSV`)

    if (draws.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in CSV file' },
        { status: 400 }
      )
    }

    // Get existing latest draw to avoid duplicates
    const latestDraw = await lotteryDb.getLatestDrawNumber()
    const newDraws = draws.filter(draw => (draw["Draw"] || 0) > latestDraw)

    console.log(`Found ${newDraws.length} new draws to import (latest in DB: ${latestDraw})`)

    if (newDraws.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new draws to import. Database is already up to date.',
        importedCount: 0,
        totalDraws: draws.length,
        existingLatest: latestDraw
      })
    }

    // Sort by draw number
    newDraws.sort((a, b) => (a["Draw"] || 0) - (b["Draw"] || 0))

    // Insert new draws in batches
    const BATCH_SIZE = 50
    let totalInserted = 0
    const errors: string[] = []

    for (let i = 0; i < newDraws.length; i += BATCH_SIZE) {
      const batch = newDraws.slice(i, i + BATCH_SIZE)

      try {
        const insertedDraws = await lotteryDb.insertDraws(batch)
        totalInserted += insertedDraws.length
        console.log(`Inserted batch ${Math.floor(i/BATCH_SIZE) + 1}: ${insertedDraws.length} draws`)
      } catch (error) {
        const errorMsg = `Failed to insert batch starting at draw ${batch[0]["Draw"]}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Refresh materialized view
    try {
      await lotteryDb.refreshCombinationsView()
      console.log('Materialized view refreshed successfully')
    } catch (viewError) {
      console.warn('Failed to refresh materialized view:', viewError)
      errors.push('Failed to refresh materialized view')
    }

    const response = {
      success: totalInserted > 0,
      message: totalInserted > 0
        ? `Successfully imported ${totalInserted} new draws`
        : 'No draws were imported due to errors',
      importedCount: totalInserted,
      totalDrawsInFile: draws.length,
      newDrawsFound: newDraws.length,
      errors: errors.length > 0 ? errors : undefined
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process CSV file',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
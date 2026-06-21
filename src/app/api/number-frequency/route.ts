import { NextResponse } from 'next/server'
import { lotteryDb } from '@/lib/convex'

export interface NumberFrequency {
  number: number 
  frequency: number
  winningCount: number
  additionalCount?: number
}

export interface NumberFrequencyResponse {
  success: boolean
  data: NumberFrequency[]
  includeAdditional: boolean
  totalDraws: number
  dateRange?: {
    startDate?: string
    endDate?: string
  }
  message?: string
  error?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAdditional = searchParams.get('includeAdditional') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const draws = await lotteryDb.getDrawsForAnalysis({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    })

    if (!draws || draws.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        includeAdditional,
        totalDraws: 0,
        message: 'No lottery data found'
      })
    }

    // Initialize frequency counters for numbers 1-49
    const frequencies: Record<number, { winningCount: number, additionalCount: number }> = {}
    for (let i = 1; i <= 49; i++) {
      frequencies[i] = { winningCount: 0, additionalCount: 0 }
    }

    // Count frequencies
    draws.forEach(draw => {
      // Count winning numbers (columns 1-6)
      const winningNumbers = [
        ...draw.numbers
      ].filter((num): num is number => num >= 1 && num <= 49)

      winningNumbers.forEach(num => {
        if (frequencies[num]) {
          frequencies[num].winningCount++
        }
      })

      // Count additional number if requested
      if (includeAdditional && draw.additionalNumber &&
          draw.additionalNumber >= 1 && draw.additionalNumber <= 49) {
        const additionalNum = draw.additionalNumber
        if (frequencies[additionalNum]) {
          frequencies[additionalNum].additionalCount++
        }
      }
    })

    // Transform to response format
    const data: NumberFrequency[] = Object.entries(frequencies).map(([numberStr, counts]) => {
      const number = parseInt(numberStr)
      return {
        number,
        frequency: includeAdditional
          ? counts.winningCount + counts.additionalCount
          : counts.winningCount,
        winningCount: counts.winningCount,
        ...(includeAdditional && { additionalCount: counts.additionalCount })
      }
    })

    return NextResponse.json({
      success: true,
      data,
      includeAdditional,
      totalDraws: draws.length,
      dateRange: {
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      },
      message: `Successfully retrieved frequency data for ${draws.length} draws${startDate || endDate ? ` (filtered by date range)` : ''}`
    })

  } catch (error) {
    console.error('Error in number-frequency API:', error)
    return NextResponse.json({
      success: false,
      data: [],
      includeAdditional: false,
      totalDraws: 0,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

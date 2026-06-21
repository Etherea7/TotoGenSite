import { NextResponse } from 'next/server'
import { lotteryDb } from '@/lib/convex'

export interface RangeData {
  range: string
  count: number
  percentage: number
  color?: string
}

export interface NumberRangeResponse {
  success: boolean
  data: RangeData[]
  totalNumbers: number
  totalDraws: number
  includeAdditional: boolean
  dateRange?: {
    startDate?: string
    endDate?: string
  }
  message?: string
  error?: string
}

const NUMBER_RANGES = [
  { range: '1-10', min: 1, max: 10 },
  { range: '11-20', min: 11, max: 20 },
  { range: '21-30', min: 21, max: 30 },
  { range: '31-40', min: 31, max: 40 },
  { range: '41-49', min: 41, max: 49 }
]

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
        data: NUMBER_RANGES.map(range => ({
          range: range.range,
          count: 0,
          percentage: 0
        })),
        totalNumbers: 0,
        totalDraws: 0,
        includeAdditional,
        dateRange: {
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        },
        message: 'No lottery data found'
      })
    }

    // Initialize range counters
    const rangeCounts: Record<string, number> = {}
    NUMBER_RANGES.forEach(range => {
      rangeCounts[range.range] = 0
    })

    let totalNumbers = 0

    // Count numbers in each range
    draws.forEach(draw => {
      // Count winning numbers (columns 1-6)
      const winningNumbers = [
        ...draw.numbers
      ].filter((num): num is number => num >= 1 && num <= 49)

      winningNumbers.forEach(num => {
        totalNumbers++

        // Find which range this number belongs to
        const range = NUMBER_RANGES.find(r => num >= r.min && num <= r.max)
        if (range) {
          rangeCounts[range.range]++
        }
      })

      // Count additional number if requested
      if (includeAdditional && draw.additionalNumber &&
          draw.additionalNumber >= 1 && draw.additionalNumber <= 49) {
        const additionalNum = draw.additionalNumber
        totalNumbers++

        const range = NUMBER_RANGES.find(r => additionalNum >= r.min && additionalNum <= r.max)
        if (range) {
          rangeCounts[range.range]++
        }
      }
    })

    // Transform to response format with percentages
    const data: RangeData[] = NUMBER_RANGES.map(range => {
      const count = rangeCounts[range.range]
      const percentage = totalNumbers > 0 ? (count / totalNumbers) * 100 : 0

      return {
        range: range.range,
        count,
        percentage
      }
    })

    return NextResponse.json({
      success: true,
      data,
      totalNumbers,
      totalDraws: draws.length,
      includeAdditional,
      dateRange: {
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      },
      message: `Successfully retrieved range data for ${draws.length} draws${startDate || endDate ? ` (filtered by date range)` : ''}`
    })

  } catch (error) {
    console.error('Error in number-ranges API:', error)
    return NextResponse.json({
      success: false,
      data: [],
      totalNumbers: 0,
      totalDraws: 0,
      includeAdditional: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

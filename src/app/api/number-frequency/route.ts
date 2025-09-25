import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
  message?: string
  error?: string
}

interface DrawData {
  'Winning Number 1': number | null
  '2': number | null
  '3': number | null
  '4': number | null
  '5': number | null
  '6': number | null
  'Additional Number'?: number | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAdditional = searchParams.get('includeAdditional') === 'true'

    // Get all draws data
    const { data: draws, error } = await supabase
      .from('lottery_draws')
      .select(`
        "Winning Number 1",
        "2",
        "3",
        "4",
        "5",
        "6"
        ${includeAdditional ? ', "Additional Number"' : ''}
      `) as { data: DrawData[] | null, error: any }

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        data: [],
        includeAdditional,
        totalDraws: 0,
        error: 'Failed to fetch lottery data'
      }, { status: 500 })
    }

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
        draw["Winning Number 1"],
        draw["2"],
        draw["3"],
        draw["4"],
        draw["5"],
        draw["6"]
      ].filter((num): num is number => num !== null && num >= 1 && num <= 49)

      winningNumbers.forEach(num => {
        if (frequencies[num]) {
          frequencies[num].winningCount++
        }
      })

      // Count additional number if requested
      if (includeAdditional && draw["Additional Number"] &&
          draw["Additional Number"] >= 1 && draw["Additional Number"] <= 49) {
        const additionalNum = draw["Additional Number"]!
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
      message: `Successfully retrieved frequency data for ${draws.length} draws`
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
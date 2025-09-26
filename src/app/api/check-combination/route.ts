import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isValidCombination, createCombinationKey } from '@/lib/utils'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export interface CheckCombinationRequest {
  numbers: number[]
}

export interface CheckCombinationResponse {
  success: boolean
  exists: boolean
  combination: number[]
  sortedKey: string
  matchedDraw?: {
    drawNumber: number
    date: string
    isWinning: boolean
    isAdditional: boolean
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckCombinationRequest = await request.json()
    const { numbers } = body

    // Validate the combination
    if (!isValidCombination(numbers)) {
      return NextResponse.json(
        {
          success: false,
          exists: false,
          combination: numbers,
          sortedKey: '',
          error: 'Invalid combination. Must be 6 unique numbers between 1-49.',
        } as CheckCombinationResponse,
        { status: 400 }
      )
    }

    const sortedNumbers = [...numbers].sort((a, b) => a - b)
    const sortedKey = createCombinationKey(numbers)

    // Check if this exact combination exists in historical data
    const { data: existingDraw, error: queryError } = await supabase
      .from('lottery_draws')
      .select('*')
      .or(
        `and("Winning Number 1".eq.${sortedNumbers[0]},"2".eq.${sortedNumbers[1]},"3".eq.${sortedNumbers[2]},"4".eq.${sortedNumbers[3]},"5".eq.${sortedNumbers[4]},"6".eq.${sortedNumbers[5]})`
      )
      .limit(1)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Database query error:', queryError)
      return NextResponse.json(
        {
          success: false,
          exists: false,
          combination: numbers,
          sortedKey,
          error: 'Database query failed',
        } as CheckCombinationResponse,
        { status: 500 }
      )
    }

    const exists = !!existingDraw
    const response: CheckCombinationResponse = {
      success: true,
      exists,
      combination: sortedNumbers,
      sortedKey,
    }

    if (exists) {
      response.matchedDraw = {
        drawNumber: existingDraw.Draw,
        date: existingDraw.Date,
        isWinning: true,
        isAdditional: false,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Check combination error:', error)
    return NextResponse.json(
      {
        success: false,
        exists: false,
        combination: [],
        sortedKey: '',
        error: 'Internal server error',
      } as CheckCombinationResponse,
      { status: 500 }
    )
  }
}
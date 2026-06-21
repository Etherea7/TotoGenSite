import { NextRequest, NextResponse } from 'next/server'
import { isValidCombination, createCombinationKey } from '@/lib/utils'
import { lotteryDb } from '@/lib/convex'

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

    const existingDraw = await lotteryDb.checkCombination(sortedNumbers)
    const exists = !!existingDraw
    const response: CheckCombinationResponse = {
      success: true,
      exists,
      combination: sortedNumbers,
      sortedKey,
    }

    if (exists) {
      response.matchedDraw = {
        drawNumber: existingDraw.drawNumber,
        date: existingDraw.date,
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

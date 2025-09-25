import { NextRequest, NextResponse } from 'next/server'
import { combinationGenerator } from '@/lib/combination-generator'
import { GenerateRequest, GenerateResponse } from '@/types/lottery'
import { TOTO_CONSTANTS } from '@/types/lottery'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GenerateRequest = await request.json()
    const { count } = body

    // Validate input
    if (!count || typeof count !== 'number') {
      return NextResponse.json(
        {
          success: false,
          message: 'Count is required and must be a number',
          combinations: [],
          processingTime: 0,
          totalExistingCombinations: 0,
          remainingPossible: 0,
        },
        { status: 400 }
      )
    }

    if (count < 1 || count > TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST) {
      return NextResponse.json(
        {
          success: false,
          message: `Count must be between 1 and ${TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST}`,
          combinations: [],
          processingTime: 0,
          totalExistingCombinations: 0,
          remainingPossible: 0,
        },
        { status: 400 }
      )
    }

    // Generate combinations
    const result = await combinationGenerator.generateUniqueCombinations(count)

    const response: GenerateResponse = {
      success: true,
      combinations: result.combinations,
      processingTime: result.processingTime,
      totalExistingCombinations: result.totalExistingCombinations,
      remainingPossible: result.remainingPossible,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Generate combinations API error:', error)

    const response: GenerateResponse = {
      success: false,
      combinations: [],
      processingTime: Date.now() - startTime,
      totalExistingCombinations: 0,
      remainingPossible: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// Add a simple GET endpoint for testing
export async function GET() {
  try {
    const cacheStats = combinationGenerator.getCacheStats()
    const remainingCombinations = await combinationGenerator.getRemainingCombinationsCount()

    return NextResponse.json({
      status: 'ready',
      cacheStats,
      remainingCombinations,
      maxCombinationsPerRequest: TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST,
      totalPossibleCombinations: TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS,
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
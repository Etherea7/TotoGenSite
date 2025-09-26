'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { SearchIcon, CheckIcon, XIcon, InfoIcon } from 'lucide-react'
import { isValidCombination } from '@/lib/utils'
import type { CheckCombinationResponse } from '@/app/api/check-combination/route'

export function CombinationChecker() {
  const [numbers, setNumbers] = useState<string[]>(['', '', '', '', '', ''])
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<CheckCombinationResponse | null>(null)
  const [error, setError] = useState<string>('')

  const handleNumberChange = (index: number, value: string) => {
    // Only allow numbers between 1-49
    const numValue = parseInt(value)
    if (value === '' || (numValue >= 1 && numValue <= 49)) {
      const newNumbers = [...numbers]
      newNumbers[index] = value
      setNumbers(newNumbers)
      setError('')
      setResult(null)
    }
  }

  const handleCheck = async () => {
    // Validate input
    const numbersArray = numbers.map(n => parseInt(n)).filter(n => !isNaN(n))

    if (numbersArray.length !== 6) {
      setError('Please enter all 6 numbers')
      return
    }

    // Check for duplicates
    const uniqueNumbers = new Set(numbersArray)
    if (uniqueNumbers.size !== 6) {
      setError('All numbers must be unique')
      return
    }

    if (!isValidCombination(numbersArray)) {
      setError('Invalid combination. All numbers must be between 1-49.')
      return
    }

    setIsChecking(true)
    setError('')

    try {
      const response = await fetch('/api/check-combination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numbers: numbersArray }),
      })

      const data: CheckCombinationResponse = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to check combination')
        return
      }

      setResult(data)
    } catch (err) {
      setError('Failed to check combination. Please try again.')
      console.error('Check combination error:', err)
    } finally {
      setIsChecking(false)
    }
  }

  const handleClear = () => {
    setNumbers(['', '', '', '', '', ''])
    setResult(null)
    setError('')
  }

  const isFormValid = numbers.every(n => n !== '' && parseInt(n) >= 1 && parseInt(n) <= 49)

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
            Combination Checker
          </h2>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Enter 6 numbers (1-49) to check if this combination has appeared in history
          </p>
        </div>

        {/* Number Inputs */}
        <div className="grid grid-cols-6 gap-3">
          {numbers.map((number, index) => (
            <div key={index} className="space-y-1">
              <Input
                type="number"
                min="1"
                max="49"
                value={number}
                onChange={(e) => handleNumberChange(index, e.target.value)}
                placeholder={`${index + 1}`}
                className="text-center text-lg font-semibold h-12 bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <XIcon className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleCheck}
            disabled={!isFormValid || isChecking}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 transition-all duration-200 transform hover:scale-105"
          >
            {isChecking ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4" />
                Check Combination
              </div>
            )}
          </Button>

          <Button
            onClick={handleClear}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/20"
          >
            Clear
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 p-4 rounded-lg border">
            {result.exists ? (
              <div className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <InfoIcon className="h-6 w-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                    Combination Found!
                  </h3>
                </div>
                <p className="text-orange-700 dark:text-orange-300 mb-2">
                  This combination has appeared before:
                </p>
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-orange-200 dark:border-orange-700">
                  <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                    {result.combination.join(' - ')}
                  </p>
                  {result.matchedDraw && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>Draw #{result.matchedDraw.drawNumber}</p>
                      <p>Date: {new Date(result.matchedDraw.date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <CheckIcon className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Unique Combination!
                  </h3>
                </div>
                <p className="text-green-700 dark:text-green-300 mb-2">
                  This combination has never appeared in history:
                </p>
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-700">
                  <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                    {result.combination.join(' - ')}
                  </p>
                </div>
                <p className="text-green-600 dark:text-green-400 text-sm mt-2">
                  ✨ This could be your lucky combination!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
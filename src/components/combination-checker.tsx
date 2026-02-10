'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { SearchIcon, CheckIcon, XIcon, InfoIcon } from 'lucide-react'
import { isValidCombination } from '@/lib/utils'
import type { CheckCombinationResponse } from '@/app/api/check-combination/route'

export function CombinationChecker() {
  const [numbers, setNumbers] = useState<string[]>(['', '', '', '', '', ''])
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<CheckCombinationResponse | null>(null)
  const [error, setError] = useState<string>('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleNumberChange = (index: number, value: string) => {
    const numValue = parseInt(value)
    if (value === '' || (numValue >= 1 && numValue <= 49)) {
      const newNumbers = [...numbers]
      newNumbers[index] = value
      setNumbers(newNumbers)
      setError('')
      setResult(null)

      // Auto-advance to next input when 2 digits entered
      if (value.length === 2 && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleCheck = async () => {
    const numbersArray = numbers.map(n => parseInt(n)).filter(n => !isNaN(n))

    if (numbersArray.length !== 6) {
      setError('Please enter all 6 numbers')
      return
    }

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
        headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gold-dark dark:text-gold-mid mb-1">
          Combination Checker
        </h2>
        <p className="text-muted-foreground text-sm">
          Check if a combination has appeared in history
        </p>
      </div>

      {/* Ball-style inputs */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {numbers.map((number, index) => (
          <div key={index} className="relative">
            <input
              ref={el => { inputRefs.current[index] = el }}
              type="number"
              min="1"
              max="49"
              value={number}
              onChange={(e) => handleNumberChange(index, e.target.value)}
              placeholder={`${index + 1}`}
              className={`
                w-12 h-12 sm:w-14 sm:h-14 rounded-full text-center text-lg font-bold
                transition-all duration-200 outline-none
                ${number
                  ? 'bg-gradient-to-br from-lucky-red to-lucky-red-dark text-white border-2 border-lucky-red shadow-md'
                  : 'bg-transparent border-2 border-dashed border-gold-mid/50 text-foreground hover:border-gold-mid'
                }
                focus:ring-2 focus:ring-gold-mid focus:border-gold-mid
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              `}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg justify-center">
          <XIcon className="h-4 w-4 text-lucky-red" />
          <span className="text-lucky-red dark:text-lucky-red-light text-sm">{error}</span>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleCheck}
          disabled={!isFormValid || isChecking}
          className="bg-gradient-to-r from-lucky-red to-lucky-red-dark hover:from-lucky-red-light hover:to-lucky-red text-white px-6 btn-enhance"
        >
          {isChecking ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Checking...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4" />
              Check
            </div>
          )}
        </Button>

        <Button
          onClick={handleClear}
          variant="outline"
          className="border-gold-mid/50 text-gold-dark hover:bg-gold-mid/10 dark:text-gold-mid dark:hover:bg-gold-dark/20"
        >
          Clear
        </Button>
      </div>

      {result && (
        <div className="mt-4 p-4 rounded-lg border">
          {result.exists ? (
            <div className="bg-gold-mid/10 border-gold-mid/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <InfoIcon className="h-5 w-5 text-gold-dark" />
                <h3 className="text-base font-semibold text-gold-dark dark:text-gold-mid">
                  Combination Found!
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                This combination has appeared before:
              </p>
              <p className="text-lg font-mono font-bold">
                {result.combination.join(' - ')}
              </p>
              {result.matchedDraw && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Draw #{result.matchedDraw.drawNumber} | {new Date(result.matchedDraw.date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-base font-semibold text-green-800 dark:text-green-200">
                  Unique Combination!
                </h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                This combination has never appeared in history
              </p>
              <p className="text-lg font-mono font-bold">
                {result.combination.join(' - ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

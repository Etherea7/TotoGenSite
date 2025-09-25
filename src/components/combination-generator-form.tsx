'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LotteryNumbers } from "@/components/lottery-numbers"
import { Loader2, Shuffle } from "lucide-react"
import { TOTO_CONSTANTS } from "@/types/lottery"
import { formatNumber } from "@/lib/utils"

interface CombinationGeneratorFormProps {
  onGenerate: (count: number) => Promise<number[][]>
  isLoading: boolean
}

export function CombinationGeneratorForm({
  onGenerate,
  isLoading
}: CombinationGeneratorFormProps) {
  const [count, setCount] = useState(1)
  const [results, setResults] = useState<number[][]>([])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    try {
      setError(null)
      const combinations = await onGenerate(count)
      setResults(combinations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate combinations')
      setResults([])
    }
  }

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(parseInt(e.target.value) || 1, TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST))
    setCount(value)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5" />
            Generate Unique Combinations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="count" className="block text-sm font-medium mb-2">
                  Number of combinations
                </label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max={TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST}
                  value={count}
                  onChange={handleCountChange}
                  disabled={isLoading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST} combinations
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Generated Combinations ({formatNumber(results.length)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((combination, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm text-muted-foreground font-medium">
                    #{index + 1}
                  </span>
                  <LotteryNumbers numbers={combination} size="sm" />
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> These combinations have never appeared in Singapore Toto history.
                Each combination has an equal probability of being drawn.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
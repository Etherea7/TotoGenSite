'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LotteryNumbers } from "@/components/lottery-numbers"
import { StrategySelector } from "@/components/strategy-selector"
import { AnimatedDraw } from "@/components/animated-draw"
import { SoundToggle } from "@/components/sound-toggle"
import { Loader2, Shuffle } from "lucide-react"
import { TOTO_CONSTANTS, GenerationStrategy, StrategyOptions } from "@/types/lottery"
import { formatNumber } from "@/lib/utils"
import { getStrategyInfo } from "@/lib/strategy-metadata"

interface CombinationGeneratorFormProps {
  onGenerate: (count: number, strategy: GenerationStrategy, options?: StrategyOptions) => Promise<number[][]>
  isLoading: boolean
}

export function CombinationGeneratorForm({
  onGenerate,
  isLoading
}: CombinationGeneratorFormProps) {
  const [count, setCount] = useState(1)
  const [strategy, setStrategy] = useState<GenerationStrategy>(GenerationStrategy.PURE_RANDOM)
  const [strategyOptions, setStrategyOptions] = useState<StrategyOptions>({
    avoidRange: [1, 12],
  })
  const [results, setResults] = useState<number[][]>([])
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  const handleGenerate = async () => {
    try {
      setError(null)
      setAnimationComplete(false)
      const combinations = await onGenerate(count, strategy, strategyOptions)
      setResults(combinations)
      setIsAnimating(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate combinations')
      setResults([])
      setIsAnimating(false)
    }
  }

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    setAnimationComplete(true)
  }, [])

  const handleAnimationSkip = useCallback(() => {
    setIsAnimating(false)
    setAnimationComplete(true)
  }, [])

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(parseInt(e.target.value) || 1, TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST))
    setCount(value)
  }

  const strategyInfo = getStrategyInfo(strategy)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5" />
            <span className="flex-1">Generate Unique Combinations</span>
            <SoundToggle />
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
                  disabled={isLoading || isAnimating}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST} combinations
                </p>
              </div>
            </div>

            <StrategySelector
              selected={strategy}
              options={strategyOptions}
              onStrategyChange={setStrategy}
              onOptionsChange={setStrategyOptions}
              disabled={isLoading || isAnimating}
            />

            <Button
              onClick={handleGenerate}
              disabled={isLoading || isAnimating}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate with {strategyInfo.name}
                </>
              )}
            </Button>

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
            {/* Animated draw */}
            {isAnimating && (
              <AnimatedDraw
                combinations={results}
                isActive={isAnimating}
                onComplete={handleAnimationComplete}
                onSkip={handleAnimationSkip}
              />
            )}

            {/* Static results after animation completes */}
            {animationComplete && !isAnimating && (
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
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Strategy:</strong> {strategyInfo.name} — {strategyInfo.shortDescription}.
                These combinations have never appeared in Singapore Toto history.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

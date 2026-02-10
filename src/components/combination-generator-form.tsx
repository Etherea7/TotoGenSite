'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LotteryNumbers } from "@/components/lottery-numbers"
import { StrategySelector } from "@/components/strategy-selector"
import { AnimatedDraw } from "@/components/animated-draw"
import { SoundToggle } from "@/components/sound-toggle"
import { Loader2, Shuffle } from "lucide-react"
import { TOTO_CONSTANTS, GenerationStrategy, StrategyOptions } from "@/types/lottery"
import { getStrategyInfo } from "@/lib/strategy-metadata"

interface CombinationGeneratorFormProps {
  onGenerate: (count: number, strategy: GenerationStrategy, options?: StrategyOptions) => Promise<number[][]>
  isLoading: boolean
  onSaveHistory?: (combos: number[][], strategy: string) => void
}

export function CombinationGeneratorForm({
  onGenerate,
  isLoading,
  onSaveHistory,
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

  const strategyInfo = getStrategyInfo(strategy)

  const saveToHistory = useCallback((combos: number[][]) => {
    if (onSaveHistory && combos.length > 0) {
      onSaveHistory(combos, strategyInfo.name)
    }
  }, [onSaveHistory, strategyInfo.name])

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
    saveToHistory(results)
  }, [results, saveToHistory])

  const handleAnimationSkip = useCallback(() => {
    setIsAnimating(false)
    setAnimationComplete(true)
    saveToHistory(results)
  }, [results, saveToHistory])

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(parseInt(e.target.value) || 1, TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST))
    setCount(value)
  }

  return (
    <div className="space-y-6">
      {/* Strategy selector */}
      <StrategySelector
        selected={strategy}
        options={strategyOptions}
        onStrategyChange={setStrategy}
        onOptionsChange={setStrategyOptions}
        disabled={isLoading || isAnimating}
      />

      {/* Count + Generate */}
      <div className="flex items-end gap-3 justify-center max-w-md mx-auto">
        <div className="w-24">
          <label htmlFor="count" className="block text-xs font-medium mb-1 text-muted-foreground text-center">
            Count
          </label>
          <Input
            id="count"
            type="number"
            min="1"
            max={TOTO_CONSTANTS.MAX_COMBINATIONS_PER_REQUEST}
            value={count}
            onChange={handleCountChange}
            disabled={isLoading || isAnimating}
            className="text-center border-gold-mid/30 focus:border-gold-mid"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isLoading || isAnimating}
          className="flex-1 btn-shimmer text-white font-bold text-base h-10 btn-enhance"
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
              Generate
            </>
          )}
        </Button>
        <SoundToggle />
      </div>

      {error && (
        <div className="p-3 text-sm text-lucky-red bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md text-center">
          {error}
        </div>
      )}

      {/* Animation / Results */}
      {results.length > 0 && (
        <div>
          {isAnimating && (
            <AnimatedDraw
              combinations={results}
              isActive={isAnimating}
              onComplete={handleAnimationComplete}
              onSkip={handleAnimationSkip}
            />
          )}

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
                  <LotteryNumbers numbers={combination} size="sm" animated />
                </div>
              ))}
            </div>
          )}

          {animationComplete && (
            <div className="mt-4 p-3 bg-gold-mid/10 border border-gold-mid/30 rounded-md">
              <p className="text-sm text-gold-dark dark:text-gold-mid">
                <strong>Strategy:</strong> {strategyInfo.name} — {strategyInfo.shortDescription}.
                These combinations have never appeared in Singapore Toto history.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

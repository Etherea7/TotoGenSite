'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LotteryNumbers } from "@/components/lottery-numbers"
import { StrategySelector } from "@/components/strategy-selector"
import { AnimatedDraw } from "@/components/animated-draw"
import { SoundToggle } from "@/components/sound-toggle"
import { Loader2, Shuffle, History } from "lucide-react"
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
  const [currentResults, setCurrentResults] = useState<number[][]>([])
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  // Accumulated session history — persists across multiple generations
  const [sessionHistory, setSessionHistory] = useState<
    { combos: number[][]; strategy: string; timestamp: Date }[]
  >([])

  const strategyInfo = getStrategyInfo(strategy)

  // Auto-dismiss saved toast after 3s
  useEffect(() => {
    if (!savedToast) return
    const t = setTimeout(() => setSavedToast(false), 3000)
    return () => clearTimeout(t)
  }, [savedToast])

  const saveToHistory = useCallback((combos: number[][]) => {
    if (onSaveHistory && combos.length > 0) {
      onSaveHistory(combos, strategyInfo.name)
      setSavedToast(true)
    }
    // Also add to session history for inline display
    setSessionHistory(prev => [
      { combos, strategy: strategyInfo.name, timestamp: new Date() },
      ...prev,
    ])
  }, [onSaveHistory, strategyInfo.name])

  const handleGenerate = async () => {
    try {
      setError(null)
      setAnimationComplete(false)
      const combinations = await onGenerate(count, strategy, strategyOptions)
      setCurrentResults(combinations)
      setIsAnimating(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate combinations')
      setCurrentResults([])
      setIsAnimating(false)
    }
  }

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    setAnimationComplete(true)
    saveToHistory(currentResults)
  }, [currentResults, saveToHistory])

  const handleAnimationSkip = useCallback(() => {
    setIsAnimating(false)
    setAnimationComplete(true)
    saveToHistory(currentResults)
  }, [currentResults, saveToHistory])

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
          className="flex-1 bg-gradient-to-r from-lucky-red to-lucky-red-dark hover:from-lucky-red-light hover:to-lucky-red text-white font-bold text-base h-10 btn-enhance"
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

      {/* Animation / Current Results */}
      {currentResults.length > 0 && (
        <div>
          {isAnimating && (
            <AnimatedDraw
              combinations={currentResults}
              isActive={isAnimating}
              onComplete={handleAnimationComplete}
              onSkip={handleAnimationSkip}
            />
          )}

          {animationComplete && !isAnimating && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentResults.map((combination, index) => (
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

          {/* Saved to history toast */}
          <AnimatePresence>
            {savedToast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-1.5 text-xs text-gold-dark dark:text-gold-mid justify-center mt-2"
              >
                <History className="w-3.5 h-3.5" />
                Saved to history
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Accumulated session history */}
      {sessionHistory.length > 0 && (
        <div className="border-t border-gold-mid/20 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <History className="w-4 h-4" />
              Generated this session ({sessionHistory.reduce((sum, s) => sum + s.combos.length, 0)} combos)
            </h3>
            <button
              onClick={() => setSessionHistory([])}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {sessionHistory.map((entry, entryIdx) => (
              <div key={entryIdx} className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-gold-dark dark:text-gold-mid">{entry.strategy}</span>
                  <span>&middot;</span>
                  <span>
                    {entry.timestamp.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>&middot;</span>
                  <span>{entry.combos.length} combo{entry.combos.length !== 1 ? 's' : ''}</span>
                </div>
                {entry.combos.map((combo, comboIdx) => (
                  <div
                    key={comboIdx}
                    className="flex items-center justify-between p-2 bg-muted/20 rounded-md"
                  >
                    <span className="text-xs text-muted-foreground/60">#{comboIdx + 1}</span>
                    <LotteryNumbers numbers={combo} size="sm" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

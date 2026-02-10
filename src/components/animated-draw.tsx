'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { DrawMachine } from '@/components/draw-machine'
import { LotteryNumbers } from '@/components/lottery-numbers'
import { soundManager } from '@/lib/sound-manager'
import { SkipForward, FastForward, ChevronRight } from 'lucide-react'

type DrawState = 'IDLE' | 'SPINNING' | 'REVEALING' | 'RAPID_REVEALING' | 'CELEBRATING' | 'COMPLETE'

interface AnimatedDrawProps {
  combinations: number[][]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

export function AnimatedDraw({
  combinations,
  isActive,
  onComplete,
  onSkip,
}: AnimatedDrawProps) {
  const [currentComboIndex, setCurrentComboIndex] = useState(0)
  const [state, setState] = useState<DrawState>('IDLE')
  const [revealedCount, setRevealedCount] = useState(0)
  const [completedCombos, setCompletedCombos] = useState<number[][]>([])
  const machineHumRef = useRef<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initRef = useRef(false)
  // Track which combos to rapid-reveal after current one
  const rapidRemainderRef = useRef<number[][]>([])

  const currentCombo = useMemo(
    () => combinations[currentComboIndex] ?? [],
    [combinations, currentComboIndex],
  )

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Initialize sound on first activation
  useEffect(() => {
    if (isActive && !initRef.current) {
      initRef.current = true
      soundManager.initialize()
    }
  }, [isActive])

  // Start animation when active
  useEffect(() => {
    if (isActive && state === 'IDLE' && combinations.length > 0) {
      setState('SPINNING')
      machineHumRef.current = soundManager.play('machine-hum', { volume: 0.3, loop: true })

      timerRef.current = setTimeout(() => {
        setState('REVEALING')
        setRevealedCount(0)
      }, 1500)
    }

    return () => clearTimer()
  }, [isActive, state, combinations.length, clearTimer])

  // Reveal balls one at a time (normal speed)
  useEffect(() => {
    if (state !== 'REVEALING') return

    if (revealedCount < 6) {
      timerRef.current = setTimeout(() => {
        soundManager.play('ball-click', { volume: 0.6 })
        setRevealedCount(prev => prev + 1)
      }, 1200)
    } else {
      // All revealed - celebrate
      if (machineHumRef.current) {
        soundManager.stop(machineHumRef.current)
        machineHumRef.current = null
      }
      setState('CELEBRATING')
      soundManager.play('celebration', { volume: 0.7 })

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#DC2626', '#F59E0B', '#EF4444'],
      })

      timerRef.current = setTimeout(() => {
        setState('COMPLETE')
        setCompletedCombos(prev => [...prev, currentCombo])
      }, 2000)
    }

    return () => clearTimer()
  }, [state, revealedCount, currentCombo, clearTimer])

  // Rapid reveal balls at 100ms intervals (skip mode)
  useEffect(() => {
    if (state !== 'RAPID_REVEALING') return

    if (revealedCount < 6) {
      timerRef.current = setTimeout(() => {
        soundManager.play('ball-click', { volume: 0.4 })
        setRevealedCount(prev => prev + 1)
      }, 100)
    } else {
      // Current combo fully revealed - add it to completed
      setCompletedCombos(prev => [...prev, currentCombo])

      // Add any remaining combos
      const remainder = rapidRemainderRef.current
      if (remainder.length > 0) {
        setCompletedCombos(prev => [...prev, ...remainder])
        rapidRemainderRef.current = []
      }

      setState('COMPLETE')
      setCurrentComboIndex(combinations.length)
      onSkip()
    }

    return () => clearTimer()
  }, [state, revealedCount, currentCombo, combinations.length, onSkip, clearTimer])

  const handleSkip = () => {
    clearTimer()
    if (machineHumRef.current) {
      soundManager.stop(machineHumRef.current)
      machineHumRef.current = null
    }
    soundManager.stopAll()

    // Store remaining combos after the current one for adding after rapid reveal
    rapidRemainderRef.current = combinations.slice(currentComboIndex + 1)

    // Start rapid reveal of current combo from scratch
    setRevealedCount(0)
    setState('RAPID_REVEALING')
  }

  const handleAnimateNext = () => {
    const nextIndex = currentComboIndex + 1
    if (nextIndex < combinations.length) {
      setCurrentComboIndex(nextIndex)
      setRevealedCount(0)
      setState('SPINNING')
      machineHumRef.current = soundManager.play('machine-hum', { volume: 0.3, loop: true })

      timerRef.current = setTimeout(() => {
        setState('REVEALING')
        setRevealedCount(0)
      }, 1500)
    } else {
      onComplete()
    }
  }

  const handleRevealAllRemaining = () => {
    clearTimer()
    if (machineHumRef.current) {
      soundManager.stop(machineHumRef.current)
      machineHumRef.current = null
    }

    // Store all remaining combos after the next one
    const nextIndex = currentComboIndex + 1
    rapidRemainderRef.current = combinations.slice(nextIndex + 1)

    // Move to the next combo and rapid-reveal it
    if (nextIndex < combinations.length) {
      setCurrentComboIndex(nextIndex)
      setRevealedCount(0)
      setState('RAPID_REVEALING')
    } else {
      onComplete()
    }
  }

  if (!isActive) return null

  const isRapidOrRevealing = state === 'RAPID_REVEALING' || state === 'REVEALING'

  return (
    <div className="space-y-6">
      {/* Previously completed combinations */}
      <AnimatePresence>
        {completedCombos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {completedCombos.map((combo, idx) => (
              <motion.div
                key={`completed-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <span className="text-sm text-muted-foreground font-medium">
                  #{idx + 1}
                </span>
                <LotteryNumbers numbers={combo} size="sm" animated />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active draw machine */}
      {currentComboIndex < combinations.length && state !== 'COMPLETE' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-6"
        >
          <DrawMachine
            numbers={currentCombo}
            revealedCount={revealedCount}
            isSpinning={state === 'SPINNING'}
            isCelebrating={state === 'CELEBRATING'}
          />

          <div className="mt-4 text-sm text-muted-foreground">
            {state === 'SPINNING' && 'Mixing numbers...'}
            {state === 'REVEALING' && `Revealing ball ${revealedCount + 1} of 6...`}
            {state === 'RAPID_REVEALING' && `Revealing ball ${revealedCount + 1} of 6...`}
            {state === 'CELEBRATING' && 'Complete!'}
          </div>
        </motion.div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2 justify-center flex-wrap">
        {(state === 'SPINNING' || isRapidOrRevealing) && state !== 'RAPID_REVEALING' && (
          <Button variant="outline" size="sm" onClick={handleSkip}>
            <SkipForward className="w-4 h-4 mr-1" />
            Skip All
          </Button>
        )}

        {state === 'COMPLETE' && currentComboIndex < combinations.length - 1 && (
          <>
            <Button size="sm" onClick={handleAnimateNext}>
              <ChevronRight className="w-4 h-4 mr-1" />
              Animate Next
            </Button>
            <Button variant="outline" size="sm" onClick={handleRevealAllRemaining}>
              <FastForward className="w-4 h-4 mr-1" />
              Reveal All Remaining
            </Button>
          </>
        )}

        {state === 'COMPLETE' && currentComboIndex >= combinations.length - 1 && completedCombos.length < combinations.length && (
          <Button size="sm" onClick={handleAnimateNext}>
            <ChevronRight className="w-4 h-4 mr-1" />
            Finish
          </Button>
        )}
      </div>
    </div>
  )
}

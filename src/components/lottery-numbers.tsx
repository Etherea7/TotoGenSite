'use client'

import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"

interface LotteryNumbersProps {
  numbers: number[]
  additionalNumber?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  revealedCount?: number
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg'
}

export function LotteryNumbers({
  numbers,
  additionalNumber,
  className,
  size = 'md',
  animated = false,
  revealedCount,
}: LotteryNumbersProps) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  const visibleCount = revealedCount ?? sortedNumbers.length

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Main winning numbers */}
      <div className="flex gap-1">
        <AnimatePresence>
          {sortedNumbers.map((number, index) => {
            if (animated && index >= visibleCount) {
              return (
                <div
                  key={`placeholder-${index}`}
                  className={cn(
                    "rounded-full border-2 border-dashed border-gold-mid/40 dark:border-gold-dark/40",
                    sizeClasses[size]
                  )}
                />
              )
            }

            if (animated) {
              return (
                <motion.div
                  key={`ball-${number}-${index}`}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={cn(
                    "rounded-full bg-gradient-to-br from-lucky-red to-lucky-red-dark text-white font-semibold flex items-center justify-center shadow-md",
                    sizeClasses[size]
                  )}
                >
                  {number}
                </motion.div>
              )
            }

            return (
              <div
                key={`${number}-${index}`}
                className={cn(
                  "rounded-full bg-gradient-to-br from-lucky-red to-lucky-red-dark text-white font-semibold flex items-center justify-center shadow-md",
                  sizeClasses[size]
                )}
              >
                {number}
              </div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Additional number if provided */}
      {additionalNumber && (
        <>
          <div className="text-muted-foreground font-medium text-sm">+</div>
          <div
            className={cn(
              "rounded-full bg-gradient-to-br from-gold-mid to-gold-dark text-white font-semibold flex items-center justify-center shadow-md",
              sizeClasses[size]
            )}
          >
            {additionalNumber}
          </div>
        </>
      )}
    </div>
  )
}

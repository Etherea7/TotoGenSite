'use client'

import { cn } from "@/lib/utils"

interface LotteryNumbersProps {
  numbers: number[]
  additionalNumber?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
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
  size = 'md'
}: LotteryNumbersProps) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Main winning numbers */}
      <div className="flex gap-1">
        {sortedNumbers.map((number, index) => (
          <div
            key={`${number}-${index}`}
            className={cn(
              "rounded-full bg-blue-500 text-white font-semibold flex items-center justify-center shadow-md",
              sizeClasses[size]
            )}
          >
            {number}
          </div>
        ))}
      </div>

      {/* Additional number if provided */}
      {additionalNumber && (
        <>
          <div className="text-muted-foreground font-medium text-sm">+</div>
          <div
            className={cn(
              "rounded-full bg-orange-500 text-white font-semibold flex items-center justify-center shadow-md",
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
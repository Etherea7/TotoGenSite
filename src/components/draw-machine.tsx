'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

interface DrawMachineProps {
  numbers: number[]
  revealedCount: number
  isSpinning: boolean
  isCelebrating: boolean
}

// Floating ball inside the machine
function FloatingBall({ num, index }: { num: number; index: number }) {
  const angle = (index / 8) * Math.PI * 2
  const radius = 35

  return (
    <motion.div
      className="absolute w-7 h-7 rounded-full bg-gradient-to-br from-gold/60 to-gold-mid/80 dark:from-gold-dark/60 dark:to-gold-mid/80 flex items-center justify-center text-[10px] font-bold text-lucky-red-dark dark:text-gold shadow-inner"
      initial={{
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      }}
      animate={{
        x: [
          Math.cos(angle) * radius,
          Math.cos(angle + 1) * (radius + 10),
          Math.cos(angle + 2) * radius,
          Math.cos(angle + 3) * (radius - 5),
          Math.cos(angle) * radius,
        ],
        y: [
          Math.sin(angle) * radius,
          Math.sin(angle + 1) * (radius + 10),
          Math.sin(angle + 2) * radius,
          Math.sin(angle + 3) * (radius - 5),
          Math.sin(angle) * radius,
        ],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {num}
    </motion.div>
  )
}

// Revealed ball that flies up from machine to slot
function RevealedBall({
  number,
  isCelebrating,
}: {
  number: number
  isCelebrating: boolean
}) {
  return (
    <motion.div
      className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg',
        'bg-gradient-to-br from-lucky-red to-lucky-red-dark',
      )}
      initial={{ scale: 0.3, y: 80, opacity: 0 }}
      animate={{
        scale: isCelebrating ? [1, 1.15, 1] : 1,
        y: 0,
        opacity: 1,
        rotate: isCelebrating ? [0, -5, 5, 0] : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.05,
        ...(isCelebrating && {
          rotate: { duration: 0.4, repeat: 2 },
          scale: { duration: 0.4, repeat: 2 },
        }),
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-gold-mid/50"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0] }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />
      <span className="relative z-10">{number}</span>
    </motion.div>
  )
}

export function DrawMachine({
  numbers,
  revealedCount,
  isSpinning,
  isCelebrating,
}: DrawMachineProps) {
  const sortedNumbers = useRef([...numbers].sort((a, b) => a - b))

  useEffect(() => {
    sortedNumbers.current = [...numbers].sort((a, b) => a - b)
  }, [numbers])

  // Background floating balls (random numbers that aren't revealed yet)
  const floatingNums = Array.from({ length: 8 }, (_, i) => ((i * 7 + 3) % 49) + 1)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Revealed slots */}
      <div className="flex gap-3 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-full flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              {i < revealedCount ? (
                <RevealedBall
                  key={`revealed-${sortedNumbers.current[i]}`}
                  number={sortedNumbers.current[i]}
                  isCelebrating={isCelebrating}
                />
              ) : (
                <motion.div
                  key={`placeholder-${i}`}
                  className="w-12 h-12 rounded-full border-2 border-dashed border-gold-mid/40 dark:border-gold-dark/40"
                  animate={isSpinning ? { scale: [1, 0.95, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Machine container */}
      <motion.div
        className={cn(
          'relative w-48 h-48 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-cream to-gold/20 dark:from-deep-dark dark:to-lucky-red-dark/20',
          'border-4',
          isCelebrating
            ? 'border-gold shadow-[0_0_30px_rgba(255,215,0,0.5)]'
            : isSpinning
              ? 'border-gold-mid shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'border-gold-mid/50 dark:border-gold-dark/50',
        )}
        animate={
          isSpinning
            ? { rotate: 360 }
            : isCelebrating
              ? { scale: [1, 1.03, 1] }
              : {}
        }
        transition={
          isSpinning
            ? { duration: 3, repeat: Infinity, ease: 'linear' }
            : isCelebrating
              ? { duration: 0.6, repeat: 3 }
              : {}
        }
      >
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/60 to-transparent dark:from-lucky-red-dark/20" />

        {/* Floating balls inside */}
        <div className="relative">
          {floatingNums.map((num, i) => (
            <FloatingBall key={`float-${i}`} num={num} index={i} />
          ))}
        </div>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gold-dark dark:text-gold-mid bg-white/80 dark:bg-deep-dark/80 px-2 py-1 rounded-full">
            {isSpinning ? 'Mixing...' : isCelebrating ? 'Complete!' : 'TOTO'}
          </span>
        </div>
      </motion.div>
    </div>
  )
}

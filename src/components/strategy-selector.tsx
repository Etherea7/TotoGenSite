'use client'

import { cn } from '@/lib/utils'
import { GenerationStrategy, StrategyOptions } from '@/types/lottery'
import { STRATEGY_METADATA } from '@/lib/strategy-metadata'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dice5,
  Flame,
  Snowflake,
  Link,
  Shield,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Dice5,
  Flame,
  Snowflake,
  Link,
  Shield,
}

interface StrategySelectorProps {
  selected: GenerationStrategy
  options: StrategyOptions
  onStrategyChange: (strategy: GenerationStrategy) => void
  onOptionsChange: (options: StrategyOptions) => void
  disabled?: boolean
}

export function StrategySelector({
  selected,
  options,
  onStrategyChange,
  onOptionsChange,
  disabled,
}: StrategySelectorProps) {
  return (
    <TooltipProvider>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-muted-foreground">Strategy</label>
        {/* Horizontal pill bar */}
        <div className="flex flex-wrap gap-2 justify-center">
          {STRATEGY_METADATA.map((strategy) => {
            const Icon = ICON_MAP[strategy.icon] ?? Dice5
            const isSelected = selected === strategy.id

            return (
              <Tooltip key={strategy.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onStrategyChange(strategy.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isSelected
                        ? 'bg-gradient-to-r from-gold-dark to-gold-mid text-white border-gold-dark shadow-md'
                        : 'border-gold-mid/40 text-muted-foreground hover:border-gold-mid hover:text-gold-dark dark:hover:text-gold-mid bg-transparent'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{strategy.name}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold text-sm">{strategy.name}</p>
                  <p className="text-xs mt-1">{strategy.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Jackpot Protection slider - drops down when selected */}
        {selected === GenerationStrategy.JACKPOT_PROTECTION && (
          <div className="mx-auto max-w-sm p-3 bg-card rounded-lg border border-gold-mid/30">
            <label className="block text-xs font-medium mb-2 text-center">
              Avoid range: 1-{options.avoidRange?.[1] ?? 12}
            </label>
            <Slider
              defaultValue={[options.avoidRange?.[1] ?? 12]}
              min={5}
              max={20}
              step={1}
              disabled={disabled}
              onValueChange={([value]) => {
                onOptionsChange({ ...options, avoidRange: [1, value] })
              }}
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              At most 1 number from 1-{options.avoidRange?.[1] ?? 12}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

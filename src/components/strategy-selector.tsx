'use client'

import { useState } from 'react'
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
  Info,
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
  const [expandedId, setExpandedId] = useState<GenerationStrategy | null>(null)

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <label className="block text-sm font-medium">Generation Strategy</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {STRATEGY_METADATA.map((strategy) => {
            const Icon = ICON_MAP[strategy.icon] ?? Dice5
            const isSelected = selected === strategy.id
            const isExpanded = expandedId === strategy.id

            return (
              <div key={strategy.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onStrategyChange(strategy.id)
                    setExpandedId(isExpanded ? null : strategy.id)
                  }}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border-2 transition-all duration-200',
                    'hover:shadow-md hover:border-blue-300',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={cn(
                      'w-5 h-5 mt-0.5 shrink-0',
                      isSelected ? 'text-blue-600' : 'text-slate-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          'text-sm font-semibold',
                          isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                        )}>
                          {strategy.name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{strategy.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {strategy.shortDescription}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Jackpot Protection slider */}
                {isSelected && strategy.id === GenerationStrategy.JACKPOT_PROTECTION && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-medium mb-2">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      At most 1 number from 1-{options.avoidRange?.[1] ?? 12}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

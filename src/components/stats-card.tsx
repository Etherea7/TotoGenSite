'use client'

import { formatNumber, calculateCoverage, timeAgo } from "@/lib/utils"
import { StatsResponse } from "@/types/lottery"

interface StatsCardProps {
  stats: StatsResponse | null
  isLoading?: boolean
}

export function StatsCard({ stats, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="w-full border-b border-gold-mid/20 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 bg-muted rounded animate-pulse w-16" />
                <div className="h-4 bg-muted rounded animate-pulse w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const coverage = calculateCoverage(stats.uniqueCombinations)

  const statItems = [
    { label: 'Total Draws', value: formatNumber(stats.totalDraws) },
    { label: 'Unique Combos', value: formatNumber(stats.uniqueCombinations) },
    { label: 'Coverage', value: `${coverage.toFixed(4)}%` },
    { label: 'Latest Draw', value: `#${stats.latestDraw}` },
    { label: 'Updated', value: timeAgo(stats.lastUpdated) },
  ]

  return (
    <div className="w-full border-b border-gold-mid/20 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
          {statItems.map((item, idx) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</div>
                <div className="text-sm font-bold text-gold-dark dark:text-gold-mid">{item.value}</div>
              </div>
              {idx < statItems.length - 1 && (
                <div className="hidden md:block w-px h-6 bg-gold-mid/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

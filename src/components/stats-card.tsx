'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, calculateCoverage, timeAgo } from "@/lib/utils"
import { StatsResponse } from "@/types/lottery"

interface StatsCardProps {
  stats: StatsResponse | null
  isLoading?: boolean
}

export function StatsCard({ stats, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-muted rounded animate-pulse w-24" />
                <div className="h-4 bg-muted rounded animate-pulse w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No statistics available</p>
        </CardContent>
      </Card>
    )
  }

  const coverage = calculateCoverage(stats.uniqueCombinations)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total draws:</span>
            <span className="font-semibold">{formatNumber(stats.totalDraws)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Unique combinations:</span>
            <span className="font-semibold">{formatNumber(stats.uniqueCombinations)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Coverage:</span>
            <span className="font-semibold">
              {coverage.toFixed(4)}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Latest draw:</span>
            <span className="font-semibold">#{stats.latestDraw}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Latest date:</span>
            <span className="font-semibold">
              {stats.latestDate ? new Date(stats.latestDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Last updated:</span>
            <span className="font-semibold text-xs">
              {timeAgo(stats.lastUpdated)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
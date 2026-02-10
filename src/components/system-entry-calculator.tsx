'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SYSTEM_ENTRIES } from '@/lib/strategy-metadata'
import { formatNumber } from '@/lib/utils'
import { Calculator, Star } from 'lucide-react'
import { TOTO_CONSTANTS } from '@/types/lottery'

export function SystemEntryCalculator() {
  const [budget, setBudget] = useState(50)

  const affordableEntries = SYSTEM_ENTRIES.filter(e => e.cost <= budget)
  const bestValue = affordableEntries.length > 0
    ? affordableEntries.reduce((best, entry) => {
        const valueRatio = entry.combinations / entry.cost
        const bestRatio = best.combinations / best.cost
        return valueRatio > bestRatio ? entry : best
      })
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          System Entry Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="budget" className="block text-sm font-medium mb-2">
              Budget (SGD)
            </label>
            <Input
              id="budget"
              type="number"
              min={1}
              max={10000}
              value={budget}
              onChange={(e) => setBudget(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium text-center">Numbers</th>
                  <th className="py-2 pr-3 font-medium text-right">Combos</th>
                  <th className="py-2 pr-3 font-medium text-right">Cost</th>
                  <th className="py-2 font-medium text-right">Odds Boost</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_ENTRIES.map((entry) => {
                  const canAfford = entry.cost <= budget
                  const isBest = bestValue?.type === entry.type
                  const oddsBoost = `${entry.combinations}x`
                  const baseProbability = entry.combinations / TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS

                  return (
                    <tr
                      key={entry.type}
                      className={
                        !canAfford
                          ? 'text-muted-foreground/50'
                          : isBest
                            ? 'bg-green-50 dark:bg-green-950/30 font-medium'
                            : ''
                      }
                    >
                      <td className="py-2 pr-3 flex items-center gap-1">
                        {isBest && <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />}
                        {entry.type}
                      </td>
                      <td className="py-2 pr-3 text-center">{entry.numbersSelected}</td>
                      <td className="py-2 pr-3 text-right">{formatNumber(entry.combinations)}</td>
                      <td className="py-2 pr-3 text-right">${formatNumber(entry.cost)}</td>
                      <td className="py-2 text-right">
                        {oddsBoost}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({(baseProbability * 100).toFixed(4)}%)
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {bestValue && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Best value:</strong> {bestValue.type} ({bestValue.combinations} combinations for ${formatNumber(bestValue.cost)})
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

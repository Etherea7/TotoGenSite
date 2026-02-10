'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SYSTEM_ENTRIES } from '@/lib/strategy-metadata'
import { formatNumber } from '@/lib/utils'
import { Calculator, Star, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { TOTO_CONSTANTS } from '@/types/lottery'

export function SystemEntryCalculator() {
  const [budget, setBudget] = useState(50)
  const [showExplanation, setShowExplanation] = useState(false)

  const affordableEntries = SYSTEM_ENTRIES.filter(e => e.cost <= budget)

  // Best Fit: highest affordable system entry (most combinations within budget)
  const bestFit = affordableEntries.length > 0
    ? affordableEntries.reduce((best, entry) =>
        entry.combinations > best.combinations ? entry : best
      )
    : null

  return (
    <Card className="border-gold-mid/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-gold-dark dark:text-gold-mid">
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
              className="w-full border-gold-mid/30 focus:border-gold-mid"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-mid/20 text-left">
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
                  const isBest = bestFit?.type === entry.type
                  const oddsBoost = `${entry.combinations}x`
                  const baseProbability = entry.combinations / TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS

                  return (
                    <tr
                      key={entry.type}
                      className={
                        !canAfford
                          ? 'text-muted-foreground/50'
                          : isBest
                            ? 'bg-gold-mid/10 font-medium'
                            : ''
                      }
                    >
                      <td className="py-2 pr-3 flex items-center gap-1">
                        {isBest && <Star className="w-3.5 h-3.5 text-gold-dark fill-gold-dark" />}
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

          {bestFit && (
            <div className="p-3 bg-gold-mid/10 border border-gold-mid/30 rounded-md">
              <p className="text-sm text-gold-dark dark:text-gold-mid">
                <Star className="w-3.5 h-3.5 inline fill-gold-dark text-gold-dark mr-1" />
                <strong>Best Fit:</strong> {bestFit.type} ({bestFit.combinations} combinations for ${formatNumber(bestFit.cost)})
              </p>
            </div>
          )}

          {/* Collapsible explanation */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-gold-dark dark:hover:text-gold-mid transition-colors"
          >
            {showExplanation ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Info className="w-4 h-4" />
            What are System Entries?
          </button>

          {showExplanation && (
            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2 border border-gold-mid/20">
              <p>
                A <strong>System Entry</strong> lets you select more than 6 numbers on a single ticket.
                The system generates all possible 6-number combinations from your selection.
              </p>
              <p>
                The number of combinations is calculated using the formula <code className="text-xs bg-muted px-1 py-0.5 rounded">C(n,6) = n! / (6! x (n-6)!)</code> where <em>n</em> is the numbers you select.
              </p>
              <p>
                For example, System 7 (7 numbers) gives C(7,6) = 7 combinations, while System 12 (12 numbers) gives C(12,6) = 924 combinations.
                More numbers means <strong>exponentially</strong> more combinations and higher odds.
              </p>
              <p className="text-muted-foreground">
                The <Star className="w-3 h-3 inline fill-gold-dark text-gold-dark" /> <strong>Best Fit</strong> shows the highest system entry you can afford within your budget.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

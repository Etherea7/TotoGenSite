'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SYSTEM_ENTRIES } from '@/lib/strategy-metadata'
import { formatNumber } from '@/lib/utils'
import { Calculator, Star, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { TOTO_CONSTANTS } from '@/types/lottery'

interface OptionCard {
  label: string
  systemEntry?: { type: string; cost: number; combinations: number }
  ordinaryTickets: number
  totalCombos: number
  rationale: string
  isRecommended?: boolean
}

export function SystemEntryCalculator() {
  const [budget, setBudget] = useState(50)
  const [showExplanation, setShowExplanation] = useState(false)

  const affordableEntries = SYSTEM_ENTRIES.filter(e => e.cost <= budget)
  const bestEntry = affordableEntries.length > 0
    ? affordableEntries.reduce((best, e) => e.combinations > best.combinations ? e : best)
    : null

  // Option A: Best system entry + remaining as ordinary tickets
  const optionA: OptionCard | null = bestEntry ? {
    label: 'System Entry Focus',
    systemEntry: bestEntry,
    ordinaryTickets: budget - bestEntry.cost,
    totalCombos: bestEntry.combinations + (budget - bestEntry.cost),
    rationale: 'Maximizes combinations through a single system entry, using any leftover budget on ordinary tickets.',
  } : null

  // Option B: All ordinary tickets
  const optionB: OptionCard = {
    label: 'All Ordinary Tickets',
    ordinaryTickets: budget,
    totalCombos: budget,
    rationale: 'Simple approach with one unique combination per dollar spent.',
  }

  // Option C: Mixed (recommended) - only show if there are remaining ordinary tickets
  const showMixed = optionA && optionA.ordinaryTickets > 0
  const optionC: OptionCard | null = showMixed ? {
    label: 'Mixed Strategy',
    systemEntry: optionA.systemEntry,
    ordinaryTickets: optionA.ordinaryTickets,
    totalCombos: optionA.totalCombos,
    rationale: 'Best of both worlds: system entry coverage plus extra ordinary tickets for independent chances.',
    isRecommended: true,
  } : null

  const cards: OptionCard[] = []
  if (optionC) cards.push(optionC)
  if (optionA) cards.push(optionA)
  cards.push(optionB)

  function renderBreakdown(option: OptionCard) {
    const parts: string[] = []
    if (option.systemEntry) {
      parts.push(`1x ${option.systemEntry.type} ($${formatNumber(option.systemEntry.cost)})`)
    }
    if (option.ordinaryTickets > 0) {
      parts.push(`${option.ordinaryTickets}x Ordinary ($${formatNumber(option.ordinaryTickets)})`)
    }
    if (!option.systemEntry && option.ordinaryTickets === 0) {
      parts.push('No tickets')
    }
    return parts.join(' + ')
  }

  function renderCard(option: OptionCard, index: number) {
    const probability = (option.totalCombos / TOTO_CONSTANTS.TOTAL_POSSIBLE_COMBINATIONS * 100).toFixed(4)
    const borderClass = option.isRecommended
      ? 'border-gold-mid bg-gold-mid/5'
      : 'border-gold-mid/30'

    return (
      <div
        key={index}
        className={`rounded-lg border p-4 ${borderClass}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {option.isRecommended && (
            <Star className="w-4 h-4 text-gold-dark fill-gold-dark flex-shrink-0" />
          )}
          <span className="font-medium text-sm">{option.label}</span>
          {option.isRecommended && (
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-gold-mid/20 text-gold-dark dark:text-gold-mid">
              Recommended
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          {renderBreakdown(option)}
        </p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-lg font-bold">{formatNumber(option.totalCombos)}</span>
          <span className="text-xs text-muted-foreground">total combinations</span>
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          Win probability: {probability}%
        </p>

        <p className="text-xs text-muted-foreground/70 italic">
          {option.rationale}
        </p>
      </div>
    )
  }

  return (
    <Card className="border-gold-mid/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-gold-dark dark:text-gold-mid">
          <Calculator className="w-5 h-5" />
          Budget Optimizer
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

          {budget < 7 && (
            <p className="text-xs text-muted-foreground">
              System entries start at $7. With this budget, only ordinary tickets are available.
            </p>
          )}

          <div className="space-y-3">
            {cards.map((card, i) => renderCard(card, i))}
          </div>

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
                An <strong>Ordinary Ticket</strong> costs $1 and gives you 1 combination of 6 numbers.
              </p>
              <p>
                A <strong>System Entry</strong> lets you select more than 6 numbers on a single ticket.
                The system generates all possible 6-number combinations from your selection.
              </p>
              <p>
                The number of combinations is calculated using the formula <code className="text-xs bg-muted px-1 py-0.5 rounded">C(n,6) = n! / (6! x (n-6)!)</code> where <em>n</em> is the numbers you select.
              </p>
              <p>
                For example, System 7 (7 numbers) gives C(7,6) = 7 combinations for $7, while System 12 (12 numbers) gives C(12,6) = 924 combinations for $924.
                More numbers means <strong>exponentially</strong> more combinations and higher odds.
              </p>
              <p className="text-muted-foreground">
                The Budget Optimizer recommends how to split your budget between system entries and ordinary tickets for maximum coverage.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

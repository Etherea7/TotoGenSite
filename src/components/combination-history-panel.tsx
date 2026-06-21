'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LotteryNumbers } from '@/components/lottery-numbers'
import { History, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { GeneratedComboRecord } from '@/lib/combination-db'

interface CombinationHistoryPanelProps {
  history: GeneratedComboRecord[]
  isLoading: boolean
  onDelete: (id: number) => void
  onClearAll: () => void
}

function formatDate(date: Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function groupByDate(records: GeneratedComboRecord[]) {
  const groups: Record<string, GeneratedComboRecord[]> = {}
  for (const record of records) {
    const key = formatDate(record.timestamp)
    if (!groups[key]) groups[key] = []
    groups[key].push(record)
  }
  return groups
}

function HistoryRecord({
  record,
  onDelete,
}: {
  record: GeneratedComboRecord
  onDelete: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gold-mid/20 rounded-lg p-3 bg-card">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-left flex-1"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gold-dark" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gold-dark" />
          )}
          <span className="text-gold-dark dark:text-gold-mid">{record.strategy}</span>
          <span className="text-muted-foreground text-xs">
            ({record.count} combo{record.count !== 1 ? 's' : ''})
          </span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(record.timestamp).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-lucky-red"
            onClick={() => record.id && onDelete(record.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 pl-6">
          {record.numbers.map((combo, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5">#{idx + 1}</span>
              <LotteryNumbers numbers={combo} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CombinationHistoryPanel({
  history,
  isLoading,
  onDelete,
  onClearAll,
}: CombinationHistoryPanelProps) {
  const grouped = groupByDate(history)
  const totalCount = history.length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-l from-gold-dark to-gold-mid text-white px-3 py-5 rounded-l-xl shadow-lg hover:px-4 transition-all duration-200 flex flex-col items-center gap-1.5"
          aria-label="View generation history"
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">History</span>
          {totalCount > 0 && (
            <motion.span
              key={totalCount}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="text-xs font-bold bg-lucky-red rounded-full w-5 h-5 flex items-center justify-center"
            >
              {totalCount > 99 ? '99+' : totalCount}
            </motion.span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-gold-dark dark:text-gold-mid">History</SheetTitle>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-lucky-red"
                onClick={onClearAll}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          )}

          {!isLoading && history.length === 0 && (
            <div className="text-center py-8">
              <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No combinations generated yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Generated combos will appear here</p>
            </div>
          )}

          {Object.entries(grouped).map(([dateLabel, records]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {dateLabel}
              </h3>
              <div className="space-y-2">
                {records.map((record) => (
                  <HistoryRecord
                    key={record.id}
                    record={record}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

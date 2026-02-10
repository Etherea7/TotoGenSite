'use client'

import { useState, useEffect } from 'react'
import { CombinationGeneratorForm } from '@/components/combination-generator-form'
import { CombinationChecker } from '@/components/combination-checker'
import { StatsCard } from '@/components/stats-card'
import { SystemEntryCalculator } from '@/components/system-entry-calculator'
import { Navbar } from '@/components/navbar'
import { SettingsDialog } from '@/components/settings-dialog'
import { CombinationHistoryPanel } from '@/components/combination-history-panel'
import { useCombinationHistory } from '@/hooks/useCombinationHistory'
import { StatsResponse, GenerationStrategy, StrategyOptions } from '@/types/lottery'
import { Card } from '@/components/ui/card'

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [scrapeStatus, setScrapeStatus] = useState<'success' | 'error' | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { history, isLoading: historyLoading, addRecord, deleteRecord, clearAll } = useCombinationHistory()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/statistics')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleGenerate = async (
    count: number,
    strategy: GenerationStrategy,
    strategyOptions?: StrategyOptions,
  ): Promise<number[][]> => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-combinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, strategy, strategyOptions }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate combinations')
      }

      const data = await response.json()
      return data.combinations
    } finally {
      setIsGenerating(false)
    }
  }

  const handleScrape = async () => {
    setIsScraping(true)
    setScrapeStatus(null)

    try {
      const response = await fetch('/api/scrape-data', { method: 'POST' })
      const data = await response.json()

      if (response.ok && data.success) {
        setScrapeStatus('success')
        await loadStats()
        return data
      } else {
        setScrapeStatus('error')
        throw new Error(data.message || 'Failed to scrape data')
      }
    } catch (error) {
      setScrapeStatus('error')
      throw error
    } finally {
      setIsScraping(false)
    }
  }

  const handleSaveHistory = (combos: number[][], strategy: string) => {
    addRecord(combos, strategy)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-gold/5 to-cream dark:from-deep-dark dark:via-lucky-red-dark/5 dark:to-deep-dark">
      <Navbar onSettingsClick={() => setSettingsOpen(true)} />

      {/* Stats Banner */}
      <StatsCard stats={stats} isLoading={statsLoading} />

      {/* Hero Section - Generator */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Hero title */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-dark via-lucky-red to-gold-dark bg-clip-text text-transparent mb-2">
              Lucky Number
            </h1> 
            <p className="text-muted-foreground">
              Good Luck
            </p>
          </div>

          {/* Generator Form - Hero */}
          <Card className="p-6 md:p-8 border-gold-mid/30 animate-golden-glow">
            <CombinationGeneratorForm
              onGenerate={handleGenerate}
              isLoading={isGenerating}
              onSaveHistory={handleSaveHistory}
            />
          </Card>
        </div>

        {/* Secondary Section */}
        <div className="max-w-5xl mx-auto mt-12 grid gap-8 md:grid-cols-2">
          {/* Combination Checker */}
          <Card className="p-6 border-gold-mid/30">
            <CombinationChecker />
          </Card>

          {/* System Entry Calculator */}
          <SystemEntryCalculator />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gold-mid/20 bg-card/60 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium mb-1">Singapore Toto Lottery Combination Generator</p>
            <p className="text-xs">Advanced analytics and historical data analysis for strategic lottery play</p>
          </div>
        </div>
      </footer>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onScrape={handleScrape}
        isScraping={isScraping}
        scrapeStatus={scrapeStatus}
      />

      {/* History Panel */}
      <CombinationHistoryPanel
        history={history}
        isLoading={historyLoading}
        onDelete={deleteRecord}
        onClearAll={clearAll}
      />
    </div>
  )
}

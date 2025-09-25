'use client'

import { useState, useEffect } from 'react'
import { CombinationGeneratorForm } from '@/components/combination-generator-form'
import { DataScraper } from '@/components/data-scraper'
import { StatsCard } from '@/components/stats-card'
import { StatsResponse } from '@/types/lottery'

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [scrapeStatus, setScrapeStatus] = useState<'success' | 'error' | null>(null)

  // Load initial statistics
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

  const handleGenerate = async (count: number): Promise<number[][]> => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-combinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
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
      const response = await fetch('/api/scrape-data', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setScrapeStatus('success')
        // Reload stats after successful scrape
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Singapore Toto Generator
            </h1>
            <p className="text-muted-foreground">
              Generate unique lottery combinations that have never appeared in history
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column - Main Actions */}
          <div className="md:col-span-2 space-y-6">
            <DataScraper
              onScrape={handleScrape}
              isLoading={isScraping}
              lastScrapeStatus={scrapeStatus}
            />

            <CombinationGeneratorForm
              onGenerate={handleGenerate}
              isLoading={isGenerating}
            />
          </div>

          {/* Right Column - Statistics */}
          <div className="space-y-6">
            <StatsCard stats={stats} isLoading={statsLoading} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Singapore Toto Lottery Combination Generator
            </p>
            <p className="mt-1">
              Generates combinations based on historical lottery data analysis
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

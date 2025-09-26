'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CombinationGeneratorForm } from '@/components/combination-generator-form'
import { CombinationChecker } from '@/components/combination-checker'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Singapore Toto Generator
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Generate unique lottery combinations, check historical matches, and analyze number patterns
            </p>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              href="/"
              className="py-4 px-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500 transition-all duration-200"
            >
              Generator
            </Link>
            <Link
              href="/dashboard"
              className="py-4 px-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:border-b-2 hover:border-blue-300"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Combination Checker */}
            <CombinationChecker />

            {/* Data Management */}
            <DataScraper
              onScrape={handleScrape}
              isLoading={isScraping}
              lastScrapeStatus={scrapeStatus}
            />

            {/* Combination Generator */}
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
      <footer className="border-t bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <p className="text-base font-medium mb-2">
              Singapore Toto Lottery Combination Generator
            </p>
            <p>
              Advanced analytics and historical data analysis for strategic lottery play
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

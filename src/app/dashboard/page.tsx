'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { NumberFrequencyChart } from '@/components/dashboard/number-frequency-chart'
import { NumberRangeChart } from '@/components/dashboard/number-range-chart'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Singapore Toto Dashboard
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Visual analytics and insights from historical lottery data
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
              className="py-4 px-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:border-b-2 hover:border-blue-300"
            >
              Generator
            </Link>
            <Link
              href="/dashboard"
              className="py-4 px-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500 transition-all duration-200"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Number Frequency Chart */}
          <Card className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-white/20 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Number Frequency Analysis
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                How often each number (1-49) has appeared across all draws
              </p>
            </div>

            <NumberFrequencyChart />
          </Card>

          {/* Number Range Chart */}
          <NumberRangeChart />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            <p className="text-base font-medium mb-2">
              Singapore Toto Lottery Data Analytics Dashboard
            </p>
            <p>
              Historical analysis and statistical insights for strategic lottery play
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
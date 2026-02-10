'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { NumberFrequencyChart } from '@/components/dashboard/number-frequency-chart'
import { NumberRangeChart } from '@/components/dashboard/number-range-chart'
import { Navbar } from '@/components/navbar'
import { SettingsDialog } from '@/components/settings-dialog'

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Minimal scrape handler for settings dialog
  const handleScrape = async () => {
    const response = await fetch('/api/scrape-data', { method: 'POST' })
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed')
    return data
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-gold/5 to-cream dark:from-deep-dark dark:via-lucky-red-dark/5 dark:to-deep-dark">
      <Navbar onSettingsClick={() => setSettingsOpen(true)} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Number Frequency Chart */}
          <Card className="p-6 bg-card/90 backdrop-blur-sm border-gold-mid/30 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gold-dark dark:text-gold-mid mb-2">
                Number Frequency Analysis
              </h2>
              <p className="text-muted-foreground">
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
      <footer className="border-t border-gold-mid/20 bg-card/60 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium mb-1">Singapore Toto Data Analytics Dashboard</p>
            <p className="text-xs">Historical analysis and statistical insights for strategic lottery play</p>
          </div>
        </div>
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onScrape={handleScrape}
        isScraping={false}
        scrapeStatus={null}
      />
    </div>
  )
}

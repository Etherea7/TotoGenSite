'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { NumberFrequencyChart } from '@/components/dashboard/number-frequency-chart'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Singapore Toto Dashboard
            </h1>
            <p className="text-muted-foreground">
              Visual analytics of historical lottery data
            </p>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              href="/"
              className="py-4 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Generator
            </Link>
            <Link
              href="/dashboard"
              className="py-4 px-2 text-sm font-medium text-foreground border-b-2 border-primary"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Number Frequency Analysis
              </h2>
              <p className="text-muted-foreground">
                How often each number (1-49) has appeared across all draws
              </p>
            </div>

            <NumberFrequencyChart />
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Singapore Toto Lottery Data Analytics Dashboard
            </p>
            <p className="mt-1">
              Historical analysis and statistical insights
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
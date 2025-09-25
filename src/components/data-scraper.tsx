'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface DataScraperProps {
  onScrape: () => Promise<{ success: boolean; newRecords: number; message: string }>
  isLoading: boolean
  lastScrapeStatus?: 'success' | 'error' | null
}

export function DataScraper({ onScrape, isLoading, lastScrapeStatus }: DataScraperProps) {
  const [result, setResult] = useState<{ success: boolean; newRecords: number; message: string } | null>(null)

  const handleScrape = async () => {
    try {
      const scrapeResult = await onScrape()
      setResult(scrapeResult)
    } catch (error) {
      setResult({
        success: false,
        newRecords: 0,
        message: error instanceof Error ? error.message : 'Failed to scrape data'
      })
    }
  }

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />
    if (lastScrapeStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (lastScrapeStatus === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Download className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (isLoading) return 'Scraping...'
    if (lastScrapeStatus === 'success') return 'Up to date'
    if (lastScrapeStatus === 'error') return 'Error'
    return 'Ready'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Synchronization
          </span>
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span className="text-muted-foreground">{getStatusText()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scrape the latest lottery results from Singapore Toto official data source.
            This will update the database with any new draws.
          </p>

          <Button
            onClick={handleScrape}
            disabled={isLoading}
            className="w-full"
            variant={result?.success === false ? "destructive" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping Data...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Scrape Latest Data
              </>
            )}
          </Button>

          {result && (
            <div className={`p-3 rounded-md text-sm ${
              result.success
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {result.success ? 'Success' : 'Error'}
                </span>
              </div>
              <p>{result.message}</p>
              {result.success && result.newRecords > 0 && (
                <p className="mt-1">
                  Added {result.newRecords} new lottery draws to the database.
                </p>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Source:</strong> Singapore Toto historical data
            </p>
            <p className="mt-1">
              <strong>Note:</strong> Scraping may take a few minutes for large datasets.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
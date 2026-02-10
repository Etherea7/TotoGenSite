'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataScraper } from '@/components/data-scraper'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScrape: () => Promise<{ success: boolean; newRecords: number; message: string }>
  isScraping: boolean
  scrapeStatus: 'success' | 'error' | null
}

export function SettingsDialog({
  open,
  onOpenChange,
  onScrape,
  isScraping,
  scrapeStatus,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gold-dark dark:text-gold-mid">Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <DataScraper
            onScrape={onScrape}
            isLoading={isScraping}
            lastScrapeStatus={scrapeStatus}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

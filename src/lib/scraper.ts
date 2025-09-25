import puppeteer, { Browser, Page } from 'puppeteer'
import { LotteryDraw} from '@/types/lottery'
import { parseInteger, parsePrize } from '@/lib/utils'

export interface ScrapingResult {
  success: boolean
  draws: LotteryDraw[]
  message: string
  newRecords: number
  latestDraw: number
  processingTime: number
  error?: string
}

export class TotoScraper {
  private browser: Browser | null = null
  private readonly targetUrl: string
  private readonly userAgent: string
  private readonly timeout: number

  constructor() {
    this.targetUrl = process.env.SCRAPING_TARGET_URL || 'https://en.lottolyzer.com/history/singapore/toto/page/1/per-page/50/summary-view'
    this.userAgent = process.env.SCRAPING_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    this.timeout = parseInt(process.env.SCRAPING_TIMEOUT || '30000', 10)
  }

  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--virtual-time-budget=30000'
      ],
      timeout: 60000,
      protocolTimeout: 60000,
    })

    return this.browser
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Scrape lottery data from the target website
   */
  async scrapeLotteryData(): Promise<ScrapingResult> {
    const startTime = Date.now()
    let page: Page | null = null

    try {
      const browser = await this.initBrowser()
      page = await browser.newPage()

      // Set user agent and viewport
      await page.setUserAgent(this.userAgent)
      await page.setViewport({ width: 1920, height: 1080 })

      console.log(`Navigating to: ${this.targetUrl}`)

      // Navigate to the page with timeout
      await page.goto(this.targetUrl, {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      })

      console.log('Page loaded, looking for summary table...')

      // Wait for the table to appear
      await page.waitForSelector('#summary-table', { timeout: 10000 })

      // Extract data from the table
      const tableData = await page.evaluate(() => {
        const table = document.querySelector('#summary-table')
        if (!table) {
          throw new Error('Summary table not found')
        }

        const rows: any[] = []
        const tableRows = table.querySelectorAll('tbody tr')

        for (const row of tableRows) {
          const cells = row.querySelectorAll('td')
          if (cells.length < 4) continue // Skip invalid rows

          try {
            const drawNumber = cells[0]?.textContent?.trim() || ''
            const date = cells[1]?.textContent?.trim() || ''
            const winningNumbers = cells[2]?.textContent?.trim() || ''
            const additionalNumber = cells[3]?.textContent?.trim() || ''

            // Parse winning numbers
            const numbers = winningNumbers.split(',').map(n => n.trim())
            if (numbers.length !== 6) continue // Skip invalid combinations

            const rowData = {
              "Draw": parseInt(drawNumber),
              "Date": date,
              "Winning Number 1": parseInt(numbers[0]),
              "2": parseInt(numbers[1]),
              "3": parseInt(numbers[2]),
              "4": parseInt(numbers[3]),
              "5": parseInt(numbers[4]),
              "6": parseInt(numbers[5]),
              "Additional Number": parseInt(additionalNumber),
            }

            // Validate the data
            if (
              !isNaN(rowData["Draw"]) &&
              rowData["Date"] &&
              !isNaN(rowData["Winning Number 1"]) &&
              !isNaN(rowData["2"]) &&
              !isNaN(rowData["3"]) &&
              !isNaN(rowData["4"]) &&
              !isNaN(rowData["5"]) &&
              !isNaN(rowData["6"]) &&
              !isNaN(rowData["Additional Number"])
            ) {
              rows.push(rowData)
            }
          } catch (error) {
            console.warn('Error parsing row:', error)
            continue
          }
        }

        return rows
      })

      console.log(`Extracted ${tableData.length} rows from the website`)

      // Convert to LotteryDraw format
      const draws: LotteryDraw[] = tableData.map(row => ({
        "Draw": row["Draw"],
        "Date": row["Date"],
        "Winning Number 1": row["Winning Number 1"],
        "2": row["2"],
        "3": row["3"],
        "4": row["4"],
        "5": row["5"],
        "6": row["6"],
        "Additional Number": row["Additional Number"],
      }))

      const processingTime = Date.now() - startTime
      const latestDraw = Math.max(...draws.map(d => d["Draw"] || 0), 0)

      return {
        success: true,
        draws,
        newRecords: draws.length,
        latestDraw,
        message: `Successfully scraped ${draws.length} lottery draws`,
        processingTime,
      }

    } catch (error) {
      console.error('Scraping error:', error)

      return {
        success: false,
        draws: [],
        newRecords: 0,
        latestDraw: 0,
        message: 'Failed to scrape lottery data',
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
      }
    } finally {
      if (page) {
        await page.close()
      }
      await this.closeBrowser()
    }
  }

  /**
   * Parse CSV data and convert to LotteryDraw format
   * This is a fallback method if scraping fails
   */
  parseCSVData(csvContent: string): LotteryDraw[] {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',')
    const draws: LotteryDraw[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',')
        if (values.length < headers.length) continue

        const draw: LotteryDraw = {
          "Draw": parseInteger(values[0]),
          "Date": values[1],
          "Winning Number 1": parseInteger(values[2]),
          "2": parseInteger(values[3]),
          "3": parseInteger(values[4]),
          "4": parseInteger(values[5]),
          "5": parseInteger(values[6]),
          "6": parseInteger(values[7]),
          "Additional Number": parseInteger(values[8]),

          // Additional fields if present
          "From Last": values[9] || undefined,
          "Low": parseInteger(values[10]),
          "High": parseInteger(values[11]),
          "Odd": parseInteger(values[12]),
          "Even": parseInteger(values[13]),
          "1-10": parseInteger(values[14]),
          "11-20": parseInteger(values[15]),
          "21-30": parseInteger(values[16]),
          "31-40": parseInteger(values[17]),
          "41-50": parseInteger(values[18]),

          // Prize information
          "Division 1 Winners": parseInteger(values[19]),
          "Division 1 Prize": parsePrize(values[20]),
          "Division 2 Winners": parseInteger(values[21]),
          "Division 2 Prize": parsePrize(values[22]),
          "Division 3 Winners": parseInteger(values[23]),
          "Division 3 Prize": parsePrize(values[24]),
          "Division 4 Winners": parseInteger(values[25]),
          "Division 4 Prize": parsePrize(values[26]),
          "Division 5 Winners": parseInteger(values[27]),
          "Division 5 Prize": parsePrize(values[28]),
          "Division 6 Winners": parseInteger(values[29]),
          "Division 6 Prize": parsePrize(values[30]),
          "Division 7 Winners": parseInteger(values[31]),
          "Division 7 Prize": parsePrize(values[32]),
        }

        // Validate essential fields
        if (
          (draw["Draw"] || 0) > 0 &&
          draw["Date"] &&
          (draw["Winning Number 1"] || 0) > 0 &&
          (draw["6"] || 0) > 0 &&
          (draw["Additional Number"] || 0) > 0
        ) {
          draws.push(draw)
        }
      } catch (error) {
        console.warn(`Error parsing CSV line ${i}:`, error)
        continue
      }
    }

    return draws
  }
}

export const totoScraper = new TotoScraper()
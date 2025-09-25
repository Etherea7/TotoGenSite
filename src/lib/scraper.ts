import puppeteer, { Browser, Page } from 'puppeteer'
import { LotteryDraw, CSVRow } from '@/types/lottery'
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
              draw_number: parseInt(drawNumber),
              date: date,
              winning_number_1: parseInt(numbers[0]),
              winning_number_2: parseInt(numbers[1]),
              winning_number_3: parseInt(numbers[2]),
              winning_number_4: parseInt(numbers[3]),
              winning_number_5: parseInt(numbers[4]),
              winning_number_6: parseInt(numbers[5]),
              additional_number: parseInt(additionalNumber),
            }

            // Validate the data
            if (
              !isNaN(rowData.draw_number) &&
              rowData.date &&
              !isNaN(rowData.winning_number_1) &&
              !isNaN(rowData.winning_number_2) &&
              !isNaN(rowData.winning_number_3) &&
              !isNaN(rowData.winning_number_4) &&
              !isNaN(rowData.winning_number_5) &&
              !isNaN(rowData.winning_number_6) &&
              !isNaN(rowData.additional_number)
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
        draw_number: row.draw_number,
        date: row.date,
        winning_number_1: row.winning_number_1,
        winning_number_2: row.winning_number_2,
        winning_number_3: row.winning_number_3,
        winning_number_4: row.winning_number_4,
        winning_number_5: row.winning_number_5,
        winning_number_6: row.winning_number_6,
        additional_number: row.additional_number,
      }))

      const processingTime = Date.now() - startTime
      const latestDraw = Math.max(...draws.map(d => d.draw_number), 0)

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
          draw_number: parseInteger(values[0]),
          date: values[1],
          winning_number_1: parseInteger(values[2]),
          winning_number_2: parseInteger(values[3]),
          winning_number_3: parseInteger(values[4]),
          winning_number_4: parseInteger(values[5]),
          winning_number_5: parseInteger(values[6]),
          winning_number_6: parseInteger(values[7]),
          additional_number: parseInteger(values[8]),

          // Additional fields if present
          from_last: values[9] || undefined,
          low_numbers: parseInteger(values[10]),
          high_numbers: parseInteger(values[11]),
          odd_numbers: parseInteger(values[12]),
          even_numbers: parseInteger(values[13]),
          range_1_10: parseInteger(values[14]),
          range_11_20: parseInteger(values[15]),
          range_21_30: parseInteger(values[16]),
          range_31_40: parseInteger(values[17]),
          range_41_50: parseInteger(values[18]),

          // Prize information
          division_1_winners: parseInteger(values[19]),
          division_1_prize: parsePrize(values[20]),
          division_2_winners: parseInteger(values[21]),
          division_2_prize: parsePrize(values[22]),
          division_3_winners: parseInteger(values[23]),
          division_3_prize: parsePrize(values[24]),
          division_4_winners: parseInteger(values[25]),
          division_4_prize: parsePrize(values[26]),
          division_5_winners: parseInteger(values[27]),
          division_5_prize: parsePrize(values[28]),
          division_6_winners: parseInteger(values[29]),
          division_6_prize: parsePrize(values[30]),
          division_7_winners: parseInteger(values[31]),
          division_7_prize: parsePrize(values[32]),
        }

        // Validate essential fields
        if (
          draw.draw_number > 0 &&
          draw.date &&
          draw.winning_number_1 > 0 &&
          draw.winning_number_6 > 0 &&
          draw.additional_number > 0
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
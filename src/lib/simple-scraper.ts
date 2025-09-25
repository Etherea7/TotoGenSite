import { LotteryDraw } from '@/types/lottery'

export interface ScrapingResult {
  success: boolean
  draws: LotteryDraw[]
  message: string
  newRecords: number
  latestDraw: number
  processingTime: number
  error?: string
}

export class SimpleTotoScraper {
  private readonly targetUrl: string
  private readonly userAgent: string
  private readonly timeout: number

  constructor() {
    this.targetUrl = process.env.SCRAPING_TARGET_URL || 'https://en.lottolyzer.com/history/singapore/toto'
    this.userAgent = process.env.SCRAPING_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    this.timeout = parseInt(process.env.SCRAPING_TIMEOUT || '30000', 10)
  }

  /**
   * Scrape using simple fetch - more reliable than Puppeteer
   */
  async scrapeLotteryData(): Promise<ScrapingResult> {
    const startTime = Date.now()

    try {
      console.log(`🔍 Fetching data from: ${this.targetUrl}`)

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.targetUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      console.log(`📄 Received ${html.length} characters of HTML`)

      // Parse the HTML to extract lottery data
      const draws = this.parseHTMLContent(html)

      const processingTime = Date.now() - startTime
      const latestDraw = draws.length > 0 ? Math.max(...draws.map(d => d["Draw"] || 0)) : 0

      return {
        success: true,
        draws,
        newRecords: draws.length,
        latestDraw,
        message: `Successfully scraped ${draws.length} lottery draws`,
        processingTime,
      }

    } catch (error) {
      console.error('❌ Scraping failed:', error)

      return {
        success: false,
        draws: [],
        newRecords: 0,
        latestDraw: 0,
        message: 'Failed to scrape lottery data',
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Parse HTML content to extract lottery data
   */
  private parseHTMLContent(html: string): LotteryDraw[] {
    const draws: LotteryDraw[] = []

    try {
      // Look for the summary table (use [\s\S] instead of . with s flag for ES5 compatibility)
      const tableMatch = html.match(/<table[^>]*id=["']summary-table["'][^>]*>([\s\S]*?)<\/table>/i)
      if (!tableMatch) {
        console.warn('⚠️ Summary table not found in HTML')
        return this.fallbackParsing(html)
      }

      const tableHTML = tableMatch[1]

      // Extract table rows (use [\s\S] instead of . with s flag for ES5 compatibility)
      const rowMatches = tableHTML.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || []
      console.log(`🔍 Found ${rowMatches.length} table rows`)

      for (let i = 0; i < rowMatches.length; i++) {
        const rowHTML = rowMatches[i]

        // Skip header rows
        if (rowHTML.toLowerCase().includes('<th')) continue

        // Extract cells (use [\s\S] instead of . with s flag for ES5 compatibility)
        const cellMatches = rowHTML.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []

        if (cellMatches.length < 4) continue

        try {
          // Clean cell content
          const cells = cellMatches.map(cell =>
            cell.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
          )

          const drawNumber = parseInt(cells[0])
          const date = cells[1]
          const winningNumbers = cells[2]
          const additionalNumber = parseInt(cells[3])

          // Validate basic data
          if (isNaN(drawNumber) || !date || !winningNumbers || isNaN(additionalNumber)) {
            continue
          }

          // Parse winning numbers
          const numbers = winningNumbers.split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n))

          if (numbers.length !== 6) {
            console.warn(`⚠️ Invalid number of winning numbers for draw ${drawNumber}: ${numbers}`)
            continue
          }

          // Validate number ranges
          if (numbers.some(n => n < 1 || n > 49) || additionalNumber < 1 || additionalNumber > 49) {
            console.warn(`⚠️ Numbers out of range for draw ${drawNumber}`)
            continue
          }

          const draw: LotteryDraw = {
            "Draw": drawNumber,
            "Date": date,
            "Winning Number 1": numbers[0],
            "2": numbers[1],
            "3": numbers[2],
            "4": numbers[3],
            "5": numbers[4],
            "6": numbers[5],
            "Additional Number": additionalNumber,
          }

          draws.push(draw)

        } catch (error) {
          console.warn(`⚠️ Error parsing row ${i}:`, error)
          continue
        }
      }

      console.log(`✅ Successfully parsed ${draws.length} lottery draws`)
      return draws

    } catch (error) {
      console.error('❌ Error parsing HTML:', error)
      return []
    }
  }

  /**
   * Fallback parsing method using different patterns
   */
  private fallbackParsing(html: string): LotteryDraw[] {
    const draws: LotteryDraw[] = []

    try {
      // Try to find any table with lottery data patterns
      const numberPattern = /(\d{4})[,\s]+(\d{4}-\d{2}-\d{2})[,\s]+((?:\d{1,2}[,\s]*){6})[,\s]+(\d{1,2})/g
      let match

      while ((match = numberPattern.exec(html)) !== null) {
        try {
          const drawNumber = parseInt(match[1])
          const date = match[2]
          const winningNumbers = match[3].split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n))
          const additionalNumber = parseInt(match[4])

          if (winningNumbers.length === 6 &&
              winningNumbers.every(n => n >= 1 && n <= 49) &&
              additionalNumber >= 1 && additionalNumber <= 49) {

            const draw: LotteryDraw = {
              "Draw": drawNumber,
              "Date": date,
              "Winning Number 1": winningNumbers[0],
              "2": winningNumbers[1],
              "3": winningNumbers[2],
              "4": winningNumbers[3],
              "5": winningNumbers[4],
              "6": winningNumbers[5],
              "Additional Number": additionalNumber,
            }

            draws.push(draw)
          }
        } catch (error) {
          continue
        }
      }

      console.log(`🔄 Fallback parsing found ${draws.length} draws`)
      return draws

    } catch (error) {
      console.error('❌ Fallback parsing failed:', error)
      return []
    }
  }

  /**
   * Test the scraping without full execution
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(this.targetUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      return {
        success: response.ok,
        message: response.ok
          ? `Connection successful (${response.status})`
          : `Connection failed (${response.status}: ${response.statusText})`
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }
}

export const simpleTotoScraper = new SimpleTotoScraper()
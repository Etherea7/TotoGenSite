import { simpleTotoScraper } from "@/lib/simple-scraper";
import { lotteryDb } from "@/lib/convex";
import { ScrapeResponse } from "@/types/lottery";

export async function scrapeAndImportLatestDraws(): Promise<ScrapeResponse> {
  const startTime = Date.now();

  console.log("Starting data scraping process...");

  const currentLatestDraw = await lotteryDb.getLatestDrawNumber();
  console.log(`Current latest draw in DB: ${currentLatestDraw}`);

  const scrapingResult = await simpleTotoScraper.scrapeLotteryData();

  if (!scrapingResult.success) {
    return {
      success: false,
      newRecords: 0,
      latestDraw: currentLatestDraw,
      message: scrapingResult.message,
      processingTime: Date.now() - startTime,
      error: scrapingResult.error,
    };
  }

  const newDraws = scrapingResult.draws.filter((draw) => (draw["Draw"] || 0) > currentLatestDraw);
  console.log(`Found ${newDraws.length} new draws to insert`);

  let insertedCount = 0;
  let latestDrawNumber = currentLatestDraw;

  if (newDraws.length > 0) {
    newDraws.sort((a, b) => (a["Draw"] || 0) - (b["Draw"] || 0));
    const insertedDraws = await lotteryDb.insertDraws(newDraws);
    insertedCount = insertedDraws.length;
    latestDrawNumber = Math.max(...newDraws.map((draw) => draw["Draw"] || 0), currentLatestDraw);
    console.log(`Successfully inserted ${insertedCount} new draws`);
  }

  return {
    success: true,
    newRecords: insertedCount,
    latestDraw: latestDrawNumber,
    message: insertedCount > 0
      ? `Scraping completed successfully. Added ${insertedCount} new draws to database.`
      : "Scraping completed successfully. No new draws found. Database is up to date.",
    processingTime: Date.now() - startTime,
  };
}

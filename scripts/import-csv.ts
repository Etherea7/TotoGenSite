import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { lotteryDb } from "../src/lib/convex";
import { totoScraper } from "../src/lib/scraper";

async function main() {
  const csvPath = resolve(process.cwd(), process.argv[2] || "old_scraper/ToTo.csv");
  const csvContent = await readFile(csvPath, "utf8");
  const draws = totoScraper.parseCSVData(csvContent);

  if (draws.length === 0) {
    throw new Error(`No valid draws found in ${csvPath}`);
  }

  const latestDraw = await lotteryDb.getLatestDrawNumber();
  const newDraws = draws
    .filter((draw) => (draw["Draw"] || 0) > latestDraw)
    .sort((a, b) => (a["Draw"] || 0) - (b["Draw"] || 0));

  if (newDraws.length === 0) {
    console.log(`Convex is already up to date. Latest draw: ${latestDraw}`);
    return;
  }

  const batchSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < newDraws.length; i += batchSize) {
    const batch = newDraws.slice(i, i + batchSize);
    const inserted = await lotteryDb.insertDraws(batch);
    totalInserted += inserted.length;
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted.length} draws`);
  }

  console.log(`Imported ${totalInserted} new draws into Convex.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import "dotenv/config";
import { lotteryDb } from "../src/lib/convex";
import { LotteryDraw } from "../src/types/lottery";

const BASE_URL = "https://en.lottolyzer.com/history/singapore/toto";
const DEFAULT_PER_PAGE = 50;
const REQUEST_DELAY_MS = 1500;
const BATCH_SIZE = 50;

type Options = {
  dryRun: boolean;
  perPage: number;
  maxPages?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    dryRun: process.env.SCRAPE_WRITE !== "true",
    perPage: DEFAULT_PER_PAGE,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--write") {
      options.dryRun = false;
    } else if (arg === "--per-page") {
      options.perPage = Number(args[++i] || DEFAULT_PER_PAGE);
    } else if (arg === "--max-pages") {
      options.maxPages = Number(args[++i]);
    }
  }

  if (!Number.isInteger(options.perPage) || options.perPage < 1) {
    throw new Error("--per-page must be a positive integer");
  }

  if (options.maxPages !== undefined && (!Number.isInteger(options.maxPages) || options.maxPages < 1)) {
    throw new Error("--max-pages must be a positive integer");
  }

  return options;
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, "").replace(/\s+/g, " "));
}

function parsePage(html: string): LotteryDraw[] {
  const tableMatch = html.match(/<table[^>]*id=["']summary-table["'][^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return [];

  const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  const draws: LotteryDraw[] = [];

  for (const row of rows) {
    if (row.toLowerCase().includes("<th")) continue;

    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length < 4) continue;

    const cleaned = cells.map(stripTags);
    const drawNumber = Number.parseInt(cleaned[0], 10);
    const date = cleaned[1];
    const numbers = cleaned[2]
      .split(/[,\s]+/)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value));
    const additionalNumber = Number.parseInt(cleaned[3], 10);

    if (
      !Number.isInteger(drawNumber) ||
      !date ||
      numbers.length !== 6 ||
      !numbers.every((number) => number >= 1 && number <= 49) ||
      !Number.isInteger(additionalNumber) ||
      additionalNumber < 1 ||
      additionalNumber > 49
    ) {
      continue;
    }

    draws.push({
      "Draw": drawNumber,
      "Date": date,
      "Winning Number 1": numbers[0],
      "2": numbers[1],
      "3": numbers[2],
      "4": numbers[3],
      "5": numbers[4],
      "6": numbers[5],
      "Additional Number": additionalNumber,
      ...(cleaned[4] && { "From Last": cleaned[4] }),
    });
  }

  return draws;
}

async function fetchPage(page: number, perPage: number) {
  const url = `${BASE_URL}/page/${page}/per-page/${perPage}/summary-view`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": process.env.SCRAPING_USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

async function scrapeAllPages(options: Options) {
  const allDraws: LotteryDraw[] = [];

  for (let page = 1; ; page++) {
    if (options.maxPages && page > options.maxPages) break;

    const html = await fetchPage(page, options.perPage);
    const draws = parsePage(html);

    if (draws.length === 0) {
      console.log(`No draws found on page ${page}. Stopping.`);
      break;
    }

    allDraws.push(...draws);
    console.log(`Page ${page}: ${draws.length} draws, ${allDraws.length} total`);

    if (draws.length < options.perPage) break;
    await sleep(REQUEST_DELAY_MS);
  }

  const byDraw = new Map<number, LotteryDraw>();
  for (const draw of allDraws) {
    const drawNumber = draw["Draw"];
    if (typeof drawNumber === "number" && !byDraw.has(drawNumber)) {
      byDraw.set(drawNumber, draw);
    }
  }

  return [...byDraw.values()].sort((a, b) => (a["Draw"] || 0) - (b["Draw"] || 0));
}

async function main() {
  const options = parseArgs();

  console.log("Starting full Singapore TOTO scrape");
  const draws = await scrapeAllPages(options);

  if (draws.length === 0) {
    throw new Error("No draws scraped");
  }

  console.log(`Scraped ${draws.length} unique draws`);
  console.log(`Range: #${draws[0]["Draw"]} (${draws[0]["Date"]}) to #${draws[draws.length - 1]["Draw"]} (${draws[draws.length - 1]["Date"]})`);

  if (options.dryRun) {
    console.log("Dry run complete. No Convex writes performed.");
    return;
  }

  const existingLatest = await lotteryDb.getLatestDrawNumber();
  console.log(`Current latest draw in Convex: #${existingLatest}`);

  let totalSaved = 0;
  for (let i = 0; i < draws.length; i += BATCH_SIZE) {
    const batch = draws.slice(i, i + BATCH_SIZE);
    const saved = await lotteryDb.insertDraws(batch);
    totalSaved += saved.length;
    console.log(`Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${saved.length} draws`);
  }

  const stats = await lotteryDb.getStatistics();
  console.log(`Done. Convex now has ${stats.totalDraws} draws, latest #${stats.latestDraw} (${stats.latestDate}).`);
  console.log(`Total upsert responses: ${totalSaved}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

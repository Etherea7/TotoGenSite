import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { LotteryDraw } from "@/types/lottery";

type ConvexLotteryDrawInput = {
  draw: number;
  date: string;
  numbers: number[];
  additionalNumber?: number;
  fromLast?: string;
  low?: number;
  high?: number;
  odd?: number;
  even?: number;
  range1To10?: number;
  range11To20?: number;
  range21To30?: number;
  range31To40?: number;
  range41To50?: number;
  division1Winners?: number;
  division1Prize?: number;
  division2Winners?: number;
  division2Prize?: number;
  division3Winners?: number;
  division3Prize?: number;
  division4Winners?: number;
  division4Prize?: number;
  division5Winners?: number;
  division5Prize?: number;
  division6Winners?: number;
  division6Prize?: number;
  division7Winners?: number;
  division7Prize?: number;
};

type ConvexLotteryDraw = ConvexLotteryDrawInput & {
  _id?: string;
  _creationTime?: number;
  combinationKey?: string;
  createdAt?: number;
  updatedAt?: number;
};

type AnalysisDraw = {
  numbers: number[];
  additionalNumber?: number;
  date: string;
};

const convexApi = {
  insertDraws: makeFunctionReference<"mutation", { draws: ConvexLotteryDrawInput[] }, ConvexLotteryDraw[]>("lottery:insertDraws"),
  getExistingCombinationKeys: makeFunctionReference<"query", Record<string, never>, string[]>("lottery:getExistingCombinationKeys"),
  getAllDrawNumbers: makeFunctionReference<"query", Record<string, never>, number[][]>("lottery:getAllDrawNumbers"),
  getLatestDrawNumber: makeFunctionReference<"query", Record<string, never>, number>("lottery:getLatestDrawNumber"),
  drawExists: makeFunctionReference<"query", { draw: number }, boolean>("lottery:drawExists"),
  getStatistics: makeFunctionReference<"query", Record<string, never>, {
    totalDraws: number;
    uniqueCombinations: number;
    latestDraw: number;
    latestDate: string;
    lastUpdated: string;
  }>("lottery:getStatistics"),
  checkCombination: makeFunctionReference<"query", { numbers: number[] }, { drawNumber: number; date: string } | null>("lottery:checkCombination"),
  getDrawsForAnalysis: makeFunctionReference<"query", { startDate?: string; endDate?: string }, AnalysisDraw[]>("lottery:getDrawsForAnalysis"),
};

const configuredConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

function getConvexUrl() {
  if (!configuredConvexUrl) {
    throw new Error("Missing Convex URL. Set NEXT_PUBLIC_CONVEX_URL for local/dev and Vercel builds.");
  }

  return configuredConvexUrl;
}

let convexClient: ConvexHttpClient | null = null;

function getConvexClient() {
  convexClient ??= new ConvexHttpClient(getConvexUrl());
  return convexClient;
}

function setIfNumber(target: ConvexLotteryDrawInput, key: keyof ConvexLotteryDrawInput, value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    Object.assign(target, { [key]: value });
  }
}

function toConvexDraw(draw: Omit<LotteryDraw, "id" | "created_at" | "updated_at">): ConvexLotteryDrawInput {
  const drawNumber = draw["Draw"];
  const date = draw["Date"];
  const numbers = [
    draw["Winning Number 1"],
    draw["2"],
    draw["3"],
    draw["4"],
    draw["5"],
    draw["6"],
  ].filter((number): number is number => typeof number === "number" && Number.isFinite(number));

  if (typeof drawNumber !== "number" || !date || numbers.length !== 6) {
    throw new Error("Invalid lottery draw. Draw, Date, and 6 winning numbers are required.");
  }

  const output: ConvexLotteryDrawInput = {
    draw: drawNumber,
    date,
    numbers,
  };

  setIfNumber(output, "additionalNumber", draw["Additional Number"]);
  if (draw["From Last"]) output.fromLast = draw["From Last"];
  setIfNumber(output, "low", draw["Low"]);
  setIfNumber(output, "high", draw["High"]);
  setIfNumber(output, "odd", draw["Odd"]);
  setIfNumber(output, "even", draw["Even"]);
  setIfNumber(output, "range1To10", draw["1-10"]);
  setIfNumber(output, "range11To20", draw["11-20"]);
  setIfNumber(output, "range21To30", draw["21-30"]);
  setIfNumber(output, "range31To40", draw["31-40"]);
  setIfNumber(output, "range41To50", draw["41-50"]);
  setIfNumber(output, "division1Winners", draw["Division 1 Winners"]);
  setIfNumber(output, "division1Prize", draw["Division 1 Prize"]);
  setIfNumber(output, "division2Winners", draw["Division 2 Winners"]);
  setIfNumber(output, "division2Prize", draw["Division 2 Prize"]);
  setIfNumber(output, "division3Winners", draw["Division 3 Winners"]);
  setIfNumber(output, "division3Prize", draw["Division 3 Prize"]);
  setIfNumber(output, "division4Winners", draw["Division 4 Winners"]);
  setIfNumber(output, "division4Prize", draw["Division 4 Prize"]);
  setIfNumber(output, "division5Winners", draw["Division 5 Winners"]);
  setIfNumber(output, "division5Prize", draw["Division 5 Prize"]);
  setIfNumber(output, "division6Winners", draw["Division 6 Winners"]);
  setIfNumber(output, "division6Prize", draw["Division 6 Prize"]);
  setIfNumber(output, "division7Winners", draw["Division 7 Winners"]);
  setIfNumber(output, "division7Prize", draw["Division 7 Prize"]);

  return output;
}

function toLotteryDraw(draw: ConvexLotteryDraw): LotteryDraw {
  const createdAt = draw.createdAt ? new Date(draw.createdAt).toISOString() : undefined;
  const updatedAt = draw.updatedAt ? new Date(draw.updatedAt).toISOString() : undefined;

  return {
    id: draw.draw,
    "Draw": draw.draw,
    "Date": draw.date,
    "Winning Number 1": draw.numbers[0],
    "2": draw.numbers[1],
    "3": draw.numbers[2],
    "4": draw.numbers[3],
    "5": draw.numbers[4],
    "6": draw.numbers[5],
    "Additional Number": draw.additionalNumber,
    "From Last": draw.fromLast,
    "Low": draw.low,
    "High": draw.high,
    "Odd": draw.odd,
    "Even": draw.even,
    "1-10": draw.range1To10,
    "11-20": draw.range11To20,
    "21-30": draw.range21To30,
    "31-40": draw.range31To40,
    "41-50": draw.range41To50,
    "Division 1 Winners": draw.division1Winners,
    "Division 1 Prize": draw.division1Prize,
    "Division 2 Winners": draw.division2Winners,
    "Division 2 Prize": draw.division2Prize,
    "Division 3 Winners": draw.division3Winners,
    "Division 3 Prize": draw.division3Prize,
    "Division 4 Winners": draw.division4Winners,
    "Division 4 Prize": draw.division4Prize,
    "Division 5 Winners": draw.division5Winners,
    "Division 5 Prize": draw.division5Prize,
    "Division 6 Winners": draw.division6Winners,
    "Division 6 Prize": draw.division6Prize,
    "Division 7 Winners": draw.division7Winners,
    "Division 7 Prize": draw.division7Prize,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export class LotteryDatabase {
  async insertDraw(draw: Omit<LotteryDraw, "id" | "created_at" | "updated_at">): Promise<LotteryDraw | null> {
    const inserted = await this.insertDraws([draw]);
    return inserted[0] ?? null;
  }

  async insertDraws(draws: Omit<LotteryDraw, "id" | "created_at" | "updated_at">[]): Promise<LotteryDraw[]> {
    if (draws.length === 0) return [];

    const saved = await getConvexClient().mutation(convexApi.insertDraws, {
      draws: draws.map(toConvexDraw),
    });

    return saved.map(toLotteryDraw);
  }

  async getExistingCombinations(): Promise<Set<string>> {
    const keys = await getConvexClient().query(convexApi.getExistingCombinationKeys, {});
    return new Set(keys);
  }

  async getStatistics(): Promise<{
    totalDraws: number;
    uniqueCombinations: number;
    latestDraw: number;
    latestDate: string;
    lastUpdated: string;
  }> {
    return getConvexClient().query(convexApi.getStatistics, {});
  }

  async getLatestDrawNumber(): Promise<number> {
    return getConvexClient().query(convexApi.getLatestDrawNumber, {});
  }

  async drawExists(drawNumber: number): Promise<boolean> {
    return getConvexClient().query(convexApi.drawExists, { draw: drawNumber });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getLatestDrawNumber();
      return true;
    } catch {
      return false;
    }
  }

  async getAllDrawNumbers(): Promise<number[][]> {
    return getConvexClient().query(convexApi.getAllDrawNumbers, {});
  }

  async checkCombination(numbers: number[]) {
    return getConvexClient().query(convexApi.checkCombination, { numbers });
  }

  async getDrawsForAnalysis(filters: { startDate?: string; endDate?: string } = {}): Promise<AnalysisDraw[]> {
    return getConvexClient().query(convexApi.getDrawsForAnalysis, filters);
  }

  async refreshCombinationsView(): Promise<void> {
    // Convex keeps indexed fields current automatically; this preserves the old adapter API.
  }
}

export const lotteryDb = new LotteryDatabase();

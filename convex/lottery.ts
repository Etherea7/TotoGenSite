import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

const drawInput = {
  draw: v.number(),
  date: v.string(),
  numbers: v.array(v.number()),
  additionalNumber: v.optional(v.number()),

  fromLast: v.optional(v.string()),
  low: v.optional(v.number()),
  high: v.optional(v.number()),
  odd: v.optional(v.number()),
  even: v.optional(v.number()),
  range1To10: v.optional(v.number()),
  range11To20: v.optional(v.number()),
  range21To30: v.optional(v.number()),
  range31To40: v.optional(v.number()),
  range41To50: v.optional(v.number()),

  division1Winners: v.optional(v.number()),
  division1Prize: v.optional(v.number()),
  division2Winners: v.optional(v.number()),
  division2Prize: v.optional(v.number()),
  division3Winners: v.optional(v.number()),
  division3Prize: v.optional(v.number()),
  division4Winners: v.optional(v.number()),
  division4Prize: v.optional(v.number()),
  division5Winners: v.optional(v.number()),
  division5Prize: v.optional(v.number()),
  division6Winners: v.optional(v.number()),
  division6Prize: v.optional(v.number()),
  division7Winners: v.optional(v.number()),
  division7Prize: v.optional(v.number()),
};

function combinationKey(numbers: number[]) {
  return [...numbers].sort((a, b) => a - b).join(",");
}

function normalizedDraw(draw: any, now: number, createdAt: number) {
  const numbers = [...draw.numbers].sort((a, b) => a - b);
  return {
    ...draw,
    numbers,
    combinationKey: combinationKey(numbers),
    createdAt,
    updatedAt: now,
  };
}

export const insertDraws = mutation({
  args: { draws: v.array(v.object(drawInput)) },
  handler: async (ctx, { draws }) => {
    const now = Date.now();
    const saved = [];

    for (const draw of draws) {
      const existing = await ctx.db
        .query("lotteryDraws")
        .withIndex("by_draw", (q) => q.eq("draw", draw.draw))
        .unique();

      if (existing) {
        const patch = normalizedDraw(draw, now, existing.createdAt);
        await ctx.db.patch(existing._id, patch);
        saved.push({ ...existing, ...patch });
      } else {
        const doc = normalizedDraw(draw, now, now);
        const id = await ctx.db.insert("lotteryDraws", doc);
        const inserted = await ctx.db.get(id);
        if (inserted) saved.push(inserted);
      }
    }

    return saved;
  },
});

export const getExistingCombinationKeys = query({
  args: {},
  handler: async (ctx) => {
    const draws = await ctx.db.query("lotteryDraws").collect();
    return draws.map((draw) => draw.combinationKey);
  },
});

export const getAllDrawNumbers = query({
  args: {},
  handler: async (ctx) => {
    const draws = await ctx.db.query("lotteryDraws").collect();
    return draws.map((draw) => draw.numbers);
  },
});

export const getLatestDrawNumber = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db
      .query("lotteryDraws")
      .withIndex("by_draw")
      .order("desc")
      .first();

    return latest?.draw ?? 0;
  },
});

export const drawExists = query({
  args: { draw: v.number() },
  handler: async (ctx, { draw }) => {
    const existing = await ctx.db
      .query("lotteryDraws")
      .withIndex("by_draw", (q) => q.eq("draw", draw))
      .unique();

    return !!existing;
  },
});

export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db
      .query("lotteryDraws")
      .withIndex("by_draw")
      .order("desc")
      .first();

    const draws = await ctx.db.query("lotteryDraws").collect();

    return {
      totalDraws: draws.length,
      uniqueCombinations: draws.length,
      latestDraw: latest?.draw ?? 0,
      latestDate: latest?.date ?? "",
      lastUpdated: new Date().toISOString(),
    };
  },
});

export const checkCombination = query({
  args: { numbers: v.array(v.number()) },
  handler: async (ctx, { numbers }) => {
    const key = combinationKey(numbers);
    const draw = await ctx.db
      .query("lotteryDraws")
      .withIndex("by_combination_key", (q) => q.eq("combinationKey", key))
      .first();

    return draw
      ? {
          drawNumber: draw.draw,
          date: draw.date,
        }
      : null;
  },
});

export const getDrawsForAnalysis = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const draws = await ctx.db.query("lotteryDraws").collect();

    return draws
      .filter((draw) => !startDate || draw.date >= startDate)
      .filter((draw) => !endDate || draw.date <= endDate)
      .map((draw) => ({
        numbers: draw.numbers,
        additionalNumber: draw.additionalNumber,
        date: draw.date,
      }));
  },
});

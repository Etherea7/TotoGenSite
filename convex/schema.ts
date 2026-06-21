import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  lotteryDraws: defineTable({
    draw: v.number(),
    date: v.string(),
    numbers: v.array(v.number()),
    additionalNumber: v.optional(v.number()),
    combinationKey: v.string(),

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

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_draw", ["draw"])
    .index("by_date", ["date"])
    .index("by_combination_key", ["combinationKey"]),
});

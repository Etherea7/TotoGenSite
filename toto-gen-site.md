# Singapore TOTO Analytics Web App

**Live:** https://toto-gen-site.vercel.app

## Summary

A full-stack lottery analytics platform for Singapore TOTO. Users can generate unique number combinations that have never appeared in historical draws, visualize draw statistics, and simulate an animated draw experience — all backed by a live PostgreSQL database of historical results.

## Key Features

- **Smart Combination Generator** — Produces 6-number combinations (from 1–49) guaranteed to be historically unique, using 5 selectable generation strategies
- **5 Algorithmic Strategies** — Pure Random, Hot Numbers (frequency-weighted), Cold Diversification, Pair Clustering, and Jackpot Protection (range avoidance), each with configurable parameters
- **Historical Combination Checker** — Validates any 6-number set against the full draw history database
- **Data Visualization** — Interactive frequency charts and range distribution charts built with Recharts
- **Animated Draw Experience** — Ball-machine animation with a state machine (IDLE → SPINNING → REVEALING → CELEBRATING), confetti, and Web Audio API sound effects
- **Live Data Scraping** — Fetch-based scraper to pull and persist the latest TOTO draw results into Supabase
- **System Entry Calculator** — Budget-based recommendation table for System Entry bets (System 7–12)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router, Turbopack) |
| Language | TypeScript 5.9 (strict mode) |
| Database | Supabase (PostgreSQL) with materialized views |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |
| Charts | Recharts |
| Animation | Motion (Framer Motion v11+), canvas-confetti |
| Audio | Web Audio API (custom SoundManager singleton) |
| Deployment | Vercel |

## Architecture Highlights

- **Strategy Pattern** — Each generation algorithm implements a common `GenerationStrategyHandler` interface, making strategies independently testable and easily extensible
- **Singleton Services** — `CombinationGenerator` and `LotteryDatabase` classes use singleton patterns with 5-minute in-memory caches to reduce redundant DB queries
- **REST API** — 8 purpose-built Next.js API routes handling generation, checking, scraping, statistics, and health checks
- **Materialized View** — PostgreSQL materialized view (`winning_combinations`) enables fast sorted-combination text lookups for deduplication
- **State Machine UI** — Animated draw orchestrator follows a formal state machine for predictable multi-step animation flows

## Notable Engineering Decisions

- Rejection sampling with historical deduplication ensures every generated combination is truly novel across ~3,000+ historical draws
- Weighted random sampling (Hot Numbers strategy) adjusts pick probability by a configurable frequency multiplier
- Web Audio API used instead of `<audio>` tags for lower latency and programmatic sound control with lazy initialization and localStorage mute persistence
- Turbopack used for faster local dev builds vs. webpack

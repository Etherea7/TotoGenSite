# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Singapore TOTO lottery analytics web app. Generates unique number combinations (6 from 1-49) that haven't appeared in historical draws using 5 selectable strategies, checks combinations against history, visualizes number frequency/range statistics, and presents results with an animated draw experience.

## Commands

- `npm run dev` - Start dev server with Turbopack (http://localhost:3000)
- `npm run build` - Production build with Turbopack
- `npm run lint` - Run ESLint (flat config, `eslint.config.mjs`)
- `npm run import-csv` - Import lottery CSV data into Supabase (runs `tsx scripts/import-csv.ts`)

## Tech Stack

- **Framework**: Next.js 15.5 (App Router, Turbopack)
- **Language**: TypeScript 5.9 (strict mode, `@/*` path alias maps to `./src/*`)
- **Database**: Supabase (PostgreSQL) - schema in `database-schema.sql`
- **Styling**: Tailwind CSS v4 with `@tailwindcss/postcss`
- **UI**: shadcn/ui pattern (`src/components/ui/`), Radix UI primitives, Lucide icons
- **Charts**: Recharts
- **Animation**: Motion (Framer Motion v11+) for draw animations, canvas-confetti for celebration effects
- **Audio**: Web Audio API via custom `SoundManager` singleton (`src/lib/sound-manager.ts`)
- **State**: Zustand (available), React useState for component state
- **Scraping**: Puppeteer (heavy) and fetch-based simple scraper (used in production API)

## Architecture

### Pages (App Router)
- `/` (`src/app/page.tsx`) - Client component: combination generator (with strategy selector + animated draw), combination checker, data scraper trigger, system entry calculator, stats sidebar
- `/dashboard` (`src/app/dashboard/page.tsx`) - Client component: number frequency chart, number range distribution chart

### API Routes (`src/app/api/`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/generate-combinations` | POST/GET | Generate unique combinations not in history. POST accepts `strategy` and `strategyOptions` params (defaults to PURE_RANDOM). Uses `CombinationGenerator` singleton |
| `/api/check-combination` | POST | Check if 6 numbers match any historical draw |
| `/api/scrape-data` | POST/GET | Scrape lottery data from lottolyzer.com, insert new draws into Supabase |
| `/api/statistics` | GET | Total draws, latest draw info, coverage percentage |
| `/api/number-frequency` | GET | Per-number (1-49) frequency counts, supports date range filtering and `includeAdditional` param |
| `/api/number-ranges` | GET | Frequency by range bucket (1-10, 11-20, etc.), same filters as above |
| `/api/health` | GET | Database connection health check |
| `/api/import-csv` | POST | CSV file upload and import |

### Core Libraries (`src/lib/`)
- `supabase.ts` - Supabase clients (public + admin) and `LotteryDatabase` class (singleton `lotteryDb`) for all DB operations. Includes `getAllDrawNumbers()` for strategy frequency analysis
- `combination-generator.ts` - `CombinationGenerator` class (singleton `combinationGenerator`) with 5-min in-memory caches: existing combinations, number frequency data, and pair frequency data. Accepts `strategy` and `strategyOptions` params
- `strategies/` - Strategy pattern implementations (see Generation Strategies below)
- `strategy-metadata.ts` - UI metadata for strategies (names, descriptions, icons) and system entry constants
- `sound-manager.ts` - `SoundManager` singleton using Web Audio API with lazy initialization, mute persistence in localStorage, pre-loads sound files from `public/sounds/`
- `simple-scraper.ts` - `SimpleTotoScraper` using fetch + HTML regex parsing (used by the scrape API)
- `scraper.ts` - `TotoScraper` using Puppeteer (heavier alternative, also has CSV parsing)
- `utils.ts` - `cn()` helper, combination generation/validation, parsing, formatting utilities

### Generation Strategies (`src/lib/strategies/`)

All strategies implement `GenerationStrategyHandler` interface with `generateCandidate(context, options)`. The "never appeared before" rejection filter applies on top of all strategies.

| Strategy | File | Algorithm |
|----------|------|-----------|
| Pure Random | `pure-random.ts` | Equal probability for all numbers (wraps `generateRandomCombination()`) |
| Hot Numbers | `hot-numbers.ts` | Weighted random sampling - hot numbers get configurable multiplier (default 1.17x) based on historical frequency |
| Cold Diversification | `cold-diversification.ts` | 3 from top-10 most frequent + 3 from bottom-10 least frequent |
| Pair Clustering | `pair-clustering.ts` | Includes 1 historically common pair (from top 20), fills remaining 4 randomly |
| Jackpot Protection | `jackpot-protection.ts` | At most 1 number from configurable avoid range (default 1-12), rest from outside range |

### Components (`src/components/`)

**Strategy UI:**
- `strategy-selector.tsx` - Grid of 5 strategy cards with icons, tooltips, and Jackpot Protection slider
- `system-entry-calculator.tsx` - Budget-based System Entry (7-12) recommendation table

**Animated Draw:**
- `draw-machine.tsx` - Visual ball machine with floating balls (Motion), spring-animated reveals, celebration glow effects
- `animated-draw.tsx` - Animation orchestrator with state machine (IDLE→SPINNING→REVEALING→CELEBRATING→COMPLETE), confetti, multi-combination flow with Skip/Animate Next/Reveal All controls
- `sound-toggle.tsx` - Mute/unmute button using `SoundManager`
- `lottery-numbers.tsx` - Ball display component with optional `animated` and `revealedCount` props for progressive reveal

**Existing:**
- `combination-generator-form.tsx` - Main generator form integrating strategy selector, animated draw, and sound toggle
- `combination-checker.tsx` - Check numbers against historical draws
- `data-scraper.tsx` - Trigger data scraping
- `stats-card.tsx` - Statistics display
- `dashboard/` - Chart components

### Database Schema
The `lottery_draws` table uses **quoted column names matching CSV headers** (e.g., `"Winning Number 1"`, `"2"`, `"3"`, `"Additional Number"`, `"Division 1 Prize"`). A materialized view `winning_combinations` provides fast sorted-combination text lookups. See `database-schema.sql` for full schema and `column-mapping.md` for CSV-to-DB mapping.

### Types
All shared types in `src/types/lottery.ts` including `LotteryDraw`, `GenerationStrategy` enum, `StrategyOptions`, `StrategyContext`, `NumberFrequency`, `PairFrequency`, `SystemEntryType`, request/response interfaces, and `TOTO_CONSTANTS` (numbers 1-49, 6 per draw, max 50 per generation request, C(49,6) = 13,983,816 total combinations).

### Sound Assets (`public/sounds/`)
- `ball-click.mp3` - Short sound when ball is drawn
- `drumroll.mp3` - Tension builder between reveals
- `celebration.mp3` - Fanfare on completion
- `machine-hum.mp3` - Ambient loop during draw

## Environment Variables

Required in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - (optional) Falls back to anon key for admin operations

## ESLint Rules

- `@typescript-eslint/no-explicit-any` is **off**
- `@typescript-eslint/no-unused-vars` is **warn** (args prefixed `_` are ignored)
- Short-circuit and ternary expressions allowed
- `scripts/` directory is excluded from linting

# Telegram Bot Integration Guide

This document explains how to connect a Telegram bot to the TOTO Generator API hosted on Vercel.

---

## API Endpoints

### 1. Generate Combinations

```
POST https://toto-gen-site.vercel.app/api/generate-combinations
Content-Type: application/json
```

**Request body:**
```json
{
  "count": 3,
  "strategy": "PURE_RANDOM",
  "strategyOptions": {}
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `count` | number | Yes | Number of combinations (1-50) |
| `strategy` | string | No | One of: `PURE_RANDOM`, `HOT_NUMBERS`, `COLD_DIVERSIFICATION`, `PAIR_CLUSTERING`, `JACKPOT_PROTECTION`. Defaults to `PURE_RANDOM` |
| `strategyOptions` | object | No | Strategy-specific options (see below) |

**Strategy options:**
- `JACKPOT_PROTECTION`: `{ "avoidRange": [1, 12] }` — range to limit (max 1 number from this range)
- `HOT_NUMBERS`: `{ "hotWeightMultiplier": 1.17 }` — weight for hot numbers (1.15-1.19)

**Response (200):**
```json
{
  "success": true,
  "combinations": [[3, 12, 18, 25, 33, 47], [1, 7, 22, 31, 40, 49], ...],
  "processingTime": 45,
  "totalExistingCombinations": 4302,
  "remainingPossible": 13979514,
  "strategy": "PURE_RANDOM"
}
```

### 2. Check Combination

```
POST https://YOUR_DOMAIN/api/check-combination
Content-Type: application/json
```

**Request body:**
```json
{
  "numbers": [1, 12, 23, 34, 45, 49]
}
```

**Response (200):**
```json
{
  "success": true,
  "exists": false,
  "combination": [1, 12, 23, 34, 45, 49],
  "sortedKey": "1-12-23-34-45-49"
}
```

If the combination was drawn before, `exists` will be `true` and a `matchedDraw` object is included:
```json
{
  "success": true,
  "exists": true,
  "combination": [1, 12, 23, 34, 45, 49],
  "sortedKey": "1-12-23-34-45-49",
  "matchedDraw": {
    "drawNumber": 3842,
    "date": "2024-01-15",
    "isWinning": true,
    "isAdditional": false
  }
}
```

### 3. Statistics

```
GET https://toto-gen-site.vercel.app/api/statistics
```

**Response (200):**
```json
{
  "totalDraws": 4302,
  "uniqueCombinations": 4302,
  "latestDraw": 4302,
  "latestDate": "2025-01-20",
  "coverage": 0.0308,
  "lastUpdated": "2025-01-20T10:30:00.000Z"
}
```

### 4. Health Check

```
GET https://toto-gen-site.vercel.app/api/health
```

---

## CORS

CORS is already configured via `src/middleware.ts`. All `/api/*` routes accept requests from any origin (`Access-Control-Allow-Origin: *`).

**If you want to restrict to specific origins**, edit `src/middleware.ts` and change the `corsHeaders()` function:

```typescript
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': 'https://api.telegram.org',
    // ... rest stays the same
  }
}
```

Note: For a Telegram bot running on your own server (Node.js, Python, etc.), the requests come from **your server**, not from Telegram's servers. So `*` is fine — the bot's server-side HTTP calls are not subject to browser CORS restrictions. The CORS headers mainly matter if you ever call the API from other browser-based frontends.

---

## Telegram Bot Setup

### Prerequisites

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Save the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
3. A server or serverless function to run your bot (e.g., Vercel Functions, AWS Lambda, a VPS, or even your local machine)

### Option A: Python Bot (python-telegram-bot)

```bash
pip install python-telegram-bot requests
```

```python
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

TOTO_API = "https://toto-gen-site.vercel.app"
BOT_TOKEN = "YOUR_BOT_TOKEN"

STRATEGY_MAP = {
    "random": "PURE_RANDOM",
    "hot": "HOT_NUMBERS",
    "cold": "COLD_DIVERSIFICATION",
    "pairs": "PAIR_CLUSTERING",
    "jackpot": "JACKPOT_PROTECTION",
}


async def generate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /generate [count] [strategy] command."""
    args = context.args or []
    count = int(args[0]) if args else 1
    strategy = STRATEGY_MAP.get(args[1] if len(args) > 1 else "", "PURE_RANDOM")

    count = max(1, min(count, 50))

    await update.message.reply_text(f"Generating {count} combination(s) with {strategy}...")

    try:
        resp = requests.post(
            f"{TOTO_API}/api/generate-combinations",
            json={"count": count, "strategy": strategy},
            timeout=30,
        )
        data = resp.json()

        if data.get("success"):
            lines = []
            for i, combo in enumerate(data["combinations"], 1):
                nums = " ".join(f"{n:02d}" for n in sorted(combo))
                lines.append(f"#{i}: {nums}")

            text = "\n".join(lines)
            text += f"\n\nStrategy: {strategy}"
            text += f"\nProcessing time: {data['processingTime']}ms"
            await update.message.reply_text(f"🎰 Your numbers:\n\n{text}")
        else:
            await update.message.reply_text(f"Error: {data.get('message', 'Unknown error')}")
    except Exception as e:
        await update.message.reply_text(f"Failed to reach API: {e}")


async def check(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /check 1 12 23 34 45 49 command."""
    args = context.args or []
    if len(args) != 6:
        await update.message.reply_text("Usage: /check 1 12 23 34 45 49")
        return

    try:
        numbers = [int(n) for n in args]
    except ValueError:
        await update.message.reply_text("All arguments must be numbers (1-49)")
        return

    try:
        resp = requests.post(
            f"{TOTO_API}/api/check-combination",
            json={"numbers": numbers},
            timeout=15,
        )
        data = resp.json()

        if data.get("success"):
            sorted_nums = " ".join(f"{n:02d}" for n in data["combination"])
            if data["exists"]:
                draw = data.get("matchedDraw", {})
                await update.message.reply_text(
                    f"⚠️ Combination found!\n\n"
                    f"{sorted_nums}\n\n"
                    f"Draw #{draw.get('drawNumber', '?')} on {draw.get('date', '?')}"
                )
            else:
                await update.message.reply_text(
                    f"✅ Unique combination!\n\n"
                    f"{sorted_nums}\n\n"
                    f"This has never appeared in Toto history."
                )
        else:
            await update.message.reply_text(f"Error: {data.get('error', 'Unknown error')}")
    except Exception as e:
        await update.message.reply_text(f"Failed to reach API: {e}")


async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stats command."""
    try:
        resp = requests.get(f"{TOTO_API}/api/statistics", timeout=15)
        data = resp.json()

        await update.message.reply_text(
            f"📊 Toto Statistics\n\n"
            f"Total draws: {data['totalDraws']:,}\n"
            f"Unique combos: {data['uniqueCombinations']:,}\n"
            f"Coverage: {data['coverage']:.4f}%\n"
            f"Latest draw: #{data['latestDraw']}\n"
            f"Latest date: {data['latestDate']}"
        )
    except Exception as e:
        await update.message.reply_text(f"Failed to reach API: {e}")


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎰 TOTO Generator Bot\n\n"
        "Commands:\n"
        "/generate [count] [strategy] — Generate combinations\n"
        "  Strategies: random, hot, cold, pairs, jackpot\n"
        "  Example: /generate 3 hot\n\n"
        "/check 1 12 23 34 45 49 — Check if a combo has appeared\n\n"
        "/stats — View database statistics\n\n"
        "/help — Show this message"
    )


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("generate", generate))
    app.add_handler(CommandHandler("check", check))
    app.add_handler(CommandHandler("stats", stats))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("start", help_cmd))

    print("Bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
```

**Run it:**
```bash
python bot.py
```

### Option B: Node.js Bot (grammy)

```bash
npm install grammy
```

```typescript
import { Bot } from "grammy";

const TOTO_API = "https://https://toto-gen-site.vercel.app";
const bot = new Bot("YOUR_BOT_TOKEN");

const STRATEGY_MAP: Record<string, string> = {
  random: "PURE_RANDOM",
  hot: "HOT_NUMBERS",
  cold: "COLD_DIVERSIFICATION",
  pairs: "PAIR_CLUSTERING",
  jackpot: "JACKPOT_PROTECTION",
};

bot.command("generate", async (ctx) => {
  const args = ctx.message?.text?.split(" ").slice(1) || [];
  const count = Math.max(1, Math.min(parseInt(args[0]) || 1, 50));
  const strategy = STRATEGY_MAP[args[1] || ""] || "PURE_RANDOM";

  await ctx.reply(`Generating ${count} combination(s)...`);

  const resp = await fetch(`${TOTO_API}/api/generate-combinations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, strategy }),
  });
  const data = await resp.json();

  if (data.success) {
    const lines = data.combinations.map(
      (combo: number[], i: number) =>
        `#${i + 1}: ${combo.sort((a: number, b: number) => a - b).map((n: number) => String(n).padStart(2, "0")).join(" ")}`
    );
    await ctx.reply(`🎰 Your numbers:\n\n${lines.join("\n")}\n\nStrategy: ${strategy}`);
  } else {
    await ctx.reply(`Error: ${data.message}`);
  }
});

bot.command("check", async (ctx) => {
  const args = ctx.message?.text?.split(" ").slice(1) || [];
  if (args.length !== 6) {
    await ctx.reply("Usage: /check 1 12 23 34 45 49");
    return;
  }

  const numbers = args.map(Number);
  const resp = await fetch(`${TOTO_API}/api/check-combination`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numbers }),
  });
  const data = await resp.json();

  if (data.exists) {
    await ctx.reply(`⚠️ Found! Draw #${data.matchedDraw?.drawNumber} on ${data.matchedDraw?.date}`);
  } else {
    await ctx.reply(`✅ Unique! ${data.combination.join(" - ")} has never appeared.`);
  }
});

bot.command("stats", async (ctx) => {
  const resp = await fetch(`${TOTO_API}/api/statistics`);
  const data = await resp.json();
  await ctx.reply(
    `📊 Stats\nDraws: ${data.totalDraws}\nCoverage: ${data.coverage.toFixed(4)}%\nLatest: #${data.latestDraw}`
  );
});

bot.command(["start", "help"], (ctx) =>
  ctx.reply(
    "🎰 TOTO Bot\n\n/generate [count] [strategy]\n/check 1 12 23 34 45 49\n/stats\n\nStrategies: random, hot, cold, pairs, jackpot"
  )
);

bot.start();
```

---

## Deployment Options for the Bot

| Option | Pros | Cons |
|--------|------|------|
| **Run locally** | Simplest, free | Must keep machine running |
| **VPS (DigitalOcean, etc.)** | Always on, cheap ($5/mo) | Needs setup |
| **Vercel Serverless** (webhook mode) | Free tier, same platform | Requires webhook setup (no polling) |
| **Railway / Fly.io** | Easy deploy, free tier | May sleep on free tier |

### Using Webhooks (recommended for serverless)

Instead of polling, Telegram can push updates to a URL. This is better for serverless (Vercel/AWS Lambda).

1. Create an API route in your Next.js app: `src/app/api/telegram-webhook/route.ts`
2. Register the webhook with Telegram:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://toto-gen-site.vercel.app/api/telegram-webhook
   ```
3. Process incoming messages in the route handler

This approach means the bot lives inside your existing Vercel deployment — no separate server needed.

---

## Optional: API Key Protection

If you want to protect the API from unauthorized use, add an API key check. In `src/middleware.ts`, modify the middleware:

```typescript
export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip auth for OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders() })
  }

  // Check API key for external callers
  const apiKey = request.headers.get('X-API-Key')
  const isFromFrontend = request.headers.get('referer')?.includes(request.nextUrl.host)

  if (!isFromFrontend && apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.next()
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value)
  }
  return response
}
```

Then set `API_SECRET_KEY` in your Vercel environment variables, and pass it from your bot:

```python
headers = {"X-API-Key": "your-secret-key", "Content-Type": "application/json"}
resp = requests.post(url, json=body, headers=headers)
```

---

## Quick Test

After deploying, test the API with curl:

```bash
# Generate 2 combinations
curl -X POST https://toto-gen-site.vercel.app/api/generate-combinations \
  -H "Content-Type: application/json" \
  -d '{"count": 2, "strategy": "PURE_RANDOM"}'

# Check a combination
curl -X POST https://toto-gen-site.vercel.app/api/check-combination \
  -H "Content-Type: application/json" \
  -d '{"numbers": [1, 12, 23, 34, 45, 49]}'

# Get stats
curl https://toto-gen-site.vercel.app/api/statistics
```

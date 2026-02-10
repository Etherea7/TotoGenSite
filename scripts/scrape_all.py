# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "requests>=2.31",
#     "beautifulsoup4>=4.12",
#     "supabase>=2.0",
#     "python-dotenv>=1.0",
# ]
# ///
"""
Full historical scraper for Singapore TOTO data from lottolyzer.com.
Paginates through ALL pages and upserts into Supabase.

Usage:
    uv run scripts/scrape_all.py
    uv run scripts/scrape_all.py --per-page 100
    uv run scripts/scrape_all.py --dry-run
"""

import argparse
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client


# Load .env from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

BASE_URL = "https://en.lottolyzer.com/history/singapore/toto"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}
BATCH_INSERT_SIZE = 50
REQUEST_DELAY = 1.5  # seconds between page requests


def get_supabase_client() -> Client:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        print("ERROR: Missing Supabase credentials in .env")
        print(f"  NEXT_PUBLIC_SUPABASE_URL = {'set' if url else 'MISSING'}")
        print(f"  SUPABASE_SERVICE_ROLE_KEY = {'set' if os.environ.get('SUPABASE_SERVICE_ROLE_KEY') else 'MISSING'}")
        sys.exit(1)

    return create_client(url, key)


def parse_page(html: str) -> list[dict]:
    """Parse a single page of lottery results from HTML."""
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id="summary-table")

    if not table:
        print("  WARNING: summary-table not found on page")
        return []

    draws = []
    tbody = table.find("tbody")
    rows = tbody.find_all("tr") if tbody else table.find_all("tr")[1:]

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 4:
            continue

        try:
            draw_number = int(cells[0].get_text(strip=True))
            date_str = cells[1].get_text(strip=True)
            winning_text = cells[2].get_text(strip=True)
            additional = int(cells[3].get_text(strip=True))

            numbers = [int(n.strip()) for n in winning_text.split(",")]
            if len(numbers) != 6:
                continue

            if not all(1 <= n <= 49 for n in numbers) or not (1 <= additional <= 49):
                continue

            draw = {
                "Draw": draw_number,
                "Date": date_str,
                "Winning Number 1": numbers[0],
                "2": numbers[1],
                "3": numbers[2],
                "4": numbers[3],
                "5": numbers[4],
                "6": numbers[5],
                "Additional Number": additional,
            }

            # Optional stats columns (indices vary by page layout)
            if len(cells) > 4:
                try:
                    from_last = cells[4].get_text(strip=True)
                    if from_last:
                        draw["From Last"] = from_last
                except (ValueError, IndexError):
                    pass

            draws.append(draw)

        except (ValueError, IndexError) as e:
            continue

    return draws


def scrape_all_pages(session: requests.Session, per_page: int = 50) -> list[dict]:
    """Scrape all pages of lottery data."""
    all_draws = []
    page = 1

    while True:
        url = f"{BASE_URL}/page/{page}/per-page/{per_page}/summary-view"
        print(f"  Fetching page {page}: {url}")

        try:
            resp = session.get(url, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"  ERROR on page {page}: {e}")
            break

        draws = parse_page(resp.text)

        if not draws:
            print(f"  No draws found on page {page} - reached the end")
            break

        all_draws.extend(draws)
        print(f"  Got {len(draws)} draws (total so far: {len(all_draws)})")

        # Check if we got fewer than per_page results (last page)
        if len(draws) < per_page:
            print(f"  Last page reached (got {len(draws)} < {per_page})")
            break

        page += 1
        time.sleep(REQUEST_DELAY)

    return all_draws


def upsert_to_supabase(client: Client, draws: list[dict]) -> int:
    """Upsert draws into Supabase in batches. Returns total upserted count."""
    total = 0

    for i in range(0, len(draws), BATCH_INSERT_SIZE):
        batch = draws[i : i + BATCH_INSERT_SIZE]

        try:
            response = (
                client.table("lottery_draws")
                .upsert(batch, on_conflict="Draw")
                .execute()
            )
            count = len(response.data) if response.data else 0
            total += count
            print(f"  Upserted batch {i // BATCH_INSERT_SIZE + 1}: {count} rows")
        except Exception as e:
            print(f"  ERROR upserting batch starting at index {i}: {e}")
            # Try inserting one by one to identify the problem row
            for j, draw in enumerate(batch):
                try:
                    client.table("lottery_draws").upsert(draw, on_conflict="Draw").execute()
                    total += 1
                except Exception as inner_e:
                    print(f"    SKIP draw #{draw.get('Draw')}: {inner_e}")

    return total


def refresh_materialized_view(client: Client):
    """Refresh the winning_combinations materialized view."""
    try:
        client.rpc("refresh_winning_combinations").execute()
        print("  Materialized view refreshed")
    except Exception as e:
        print(f"  WARNING: Could not refresh materialized view: {e}")
        print("  (This is non-critical - the app will fall back to the main table)")


def main():
    parser = argparse.ArgumentParser(description="Scrape all Singapore TOTO data into Supabase")
    parser.add_argument("--per-page", type=int, default=50, help="Results per page (default: 50)")
    parser.add_argument("--dry-run", action="store_true", help="Scrape only, don't insert into DB")
    args = parser.parse_args()

    print(f"=== Singapore TOTO Full Scraper ===")
    print(f"Started at {datetime.now().isoformat()}")
    print()

    # 1. Scrape
    print("[1/3] Scraping lottolyzer.com...")
    session = requests.Session()
    session.headers.update(HEADERS)

    draws = scrape_all_pages(session, per_page=args.per_page)

    if not draws:
        print("ERROR: No draws scraped. Exiting.")
        sys.exit(1)

    # Deduplicate by draw number (keep first occurrence = most recent data)
    seen = set()
    unique_draws = []
    for d in draws:
        dn = d["Draw"]
        if dn not in seen:
            seen.add(dn)
            unique_draws.append(d)
    draws = unique_draws

    # Sort by draw number ascending
    draws.sort(key=lambda d: d["Draw"])

    print(f"\n  Total unique draws scraped: {len(draws)}")
    print(f"  Draw range: #{draws[0]['Draw']} ({draws[0]['Date']}) to #{draws[-1]['Draw']} ({draws[-1]['Date']})")
    print()

    if args.dry_run:
        print("[DRY RUN] Skipping database insert.")
        print("Done.")
        return

    # 2. Upsert into Supabase
    print("[2/3] Upserting into Supabase...")
    client = get_supabase_client()
    upserted = upsert_to_supabase(client, draws)
    print(f"\n  Total upserted: {upserted}")
    print()

    # 3. Refresh materialized view
    print("[3/3] Refreshing materialized view...")
    refresh_materialized_view(client)
    print()

    print(f"=== Done at {datetime.now().isoformat()} ===")
    print(f"Summary: {upserted} draws in Supabase, range #{draws[0]['Draw']} - #{draws[-1]['Draw']}")


if __name__ == "__main__":
    main()

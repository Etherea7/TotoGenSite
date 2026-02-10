#!/usr/bin/env python3
"""
Singapore Toto Lottery Scraper
Alternative Python scraper for more reliable data extraction
"""

import requests
import json
import re
import time
from datetime import datetime
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import pandas as pd

class TotoScraper:
    def __init__(self):
        self.base_url = "https://en.lottolyzer.com/history/singapore/toto"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def scrape_data(self) -> Dict:
        """Scrape lottery data from the website"""
        print(f"🔍 Scraping data from: {self.base_url}")

        try:
            # Make the request
            response = self.session.get(self.base_url, timeout=30)
            response.raise_for_status()

            print(f"📄 Received {len(response.content)} bytes of data")

            # Parse with BeautifulSoup
            soup = BeautifulSoup(response.content, 'html.parser')

            # Find the summary table
            table = soup.find('table', id='summary-table')
            if not table:
                raise Exception("Summary table not found on page")

            print("✅ Found summary table, extracting data...")

            # Extract data from table
            draws = []
            rows = table.find('tbody').find_all('tr') if table.find('tbody') else table.find_all('tr')[1:]  # Skip header

            for i, row in enumerate(rows):
                try:
                    cells = row.find_all('td')
                    if len(cells) < 4:
                        continue

                    # Extract basic data
                    draw_number = int(cells[0].get_text().strip())
                    date = cells[1].get_text().strip()
                    winning_numbers_text = cells[2].get_text().strip()
                    additional_number = int(cells[3].get_text().strip())

                    # Parse winning numbers
                    winning_numbers = [int(n.strip()) for n in winning_numbers_text.split(',')]

                    if len(winning_numbers) != 6:
                        print(f"⚠️ Skipping draw {draw_number}: Invalid number of winning numbers")
                        continue

                    # Validate number ranges
                    if (not all(1 <= n <= 49 for n in winning_numbers) or
                        not (1 <= additional_number <= 49)):
                        print(f"⚠️ Skipping draw {draw_number}: Numbers out of range")
                        continue

                    # Build draw data
                    draw_data = {
                        "Draw": draw_number,
                        "Date": date,
                        "Winning Number 1": winning_numbers[0],
                        "2": winning_numbers[1],
                        "3": winning_numbers[2],
                        "4": winning_numbers[3],
                        "5": winning_numbers[4],
                        "6": winning_numbers[5],
                        "Additional Number": additional_number,
                    }

                    # Try to extract additional statistics if available
                    if len(cells) > 4:
                        try:
                            draw_data.update({
                                "From Last": cells[4].get_text().strip() if len(cells) > 4 else "",
                                "Low": int(cells[5].get_text().strip()) if len(cells) > 5 and cells[5].get_text().strip().isdigit() else 0,
                                "High": int(cells[6].get_text().strip()) if len(cells) > 6 and cells[6].get_text().strip().isdigit() else 0,
                                "Odd": int(cells[7].get_text().strip()) if len(cells) > 7 and cells[7].get_text().strip().isdigit() else 0,
                                "Even": int(cells[8].get_text().strip()) if len(cells) > 8 and cells[8].get_text().strip().isdigit() else 0,
                            })
                        except (ValueError, IndexError):
                            pass  # Skip additional stats if parsing fails

                    draws.append(draw_data)

                    if len(draws) % 50 == 0:
                        print(f"📈 Processed {len(draws)} draws...")

                except Exception as e:
                    print(f"⚠️ Error parsing row {i}: {e}")
                    continue

            print(f"✅ Successfully extracted {len(draws)} lottery draws")

            return {
                "success": True,
                "draws": draws,
                "count": len(draws),
                "latest_draw": max(draw["Draw"] for draw in draws) if draws else 0,
                "message": f"Successfully scraped {len(draws)} draws",
                "timestamp": datetime.now().isoformat()
            }

        except requests.RequestException as e:
            error_msg = f"Network error: {e}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "draws": [],
                "count": 0,
                "latest_draw": 0,
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            error_msg = f"Scraping error: {e}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "draws": [],
                "count": 0,
                "latest_draw": 0,
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            }

    def save_to_csv(self, data: Dict, filename: str = "toto_data.csv") -> bool:
        """Save scraped data to CSV file"""
        if not data["success"] or not data["draws"]:
            print("❌ No data to save")
            return False

        try:
            df = pd.DataFrame(data["draws"])
            df.to_csv(filename, index=False)
            print(f"💾 Saved {len(data['draws'])} draws to {filename}")
            return True
        except Exception as e:
            print(f"❌ Error saving CSV: {e}")
            return False

    def save_to_json(self, data: Dict, filename: str = "toto_data.json") -> bool:
        """Save scraped data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"💾 Saved data to {filename}")
            return True
        except Exception as e:
            print(f"❌ Error saving JSON: {e}")
            return False

def main():
    """Main function to run the scraper"""
    print("🚀 Starting Singapore Toto Scraper...")

    scraper = TotoScraper()
    result = scraper.scrape_data()

    if result["success"]:
        print(f"🎉 Scraping completed successfully!")
        print(f"📊 Total draws: {result['count']}")
        print(f"📈 Latest draw: #{result['latest_draw']}")

        # Save to both CSV and JSON
        scraper.save_to_csv(result, "singapore_toto_data.csv")
        scraper.save_to_json(result, "singapore_toto_data.json")

    else:
        print(f"💥 Scraping failed: {result.get('error', 'Unknown error')}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
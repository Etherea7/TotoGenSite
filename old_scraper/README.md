# Python Toto Scraper

A reliable Python-based scraper for Singapore Toto lottery data as an alternative to the Node.js Puppeteer scraper.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the scraper:**
   ```bash
   python scrape_toto.py
   ```

## Output

The scraper will generate:
- `singapore_toto_data.csv` - CSV format for easy import
- `singapore_toto_data.json` - JSON format with metadata

## Integration with Next.js App

To use this as a backup scraping method:

1. **Run the Python scraper when Node.js scraping fails**
2. **Upload the generated CSV to Supabase directly**
3. **Or create an API endpoint that calls this Python script**

## For Vercel Deployment

Since Vercel doesn't support Python runtimes directly, you have two options:

### Option 1: External Service
- Deploy this Python scraper to Railway, Heroku, or Python-supporting platform
- Call it from your Next.js app via HTTP

### Option 2: Serverless Python (Vercel Pro)
- Use Vercel's Python runtime (requires Pro plan)
- Convert to serverless function format

## Example API Integration

```python
# api_server.py
from flask import Flask, jsonify
from scrape_toto import TotoScraper

app = Flask(__name__)

@app.route('/scrape', methods=['POST'])
def scrape_endpoint():
    scraper = TotoScraper()
    result = scraper.scrape_data()
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```
"""Temporary: BOOTH shop page -> item URLs -> OGP metadata batch fetch"""
import urllib.request
import re
from html.parser import HTMLParser

class OGPParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.og = {}
        self._done = False
    def handle_starttag(self, tag, attrs):
        if self._done: return
        if tag == 'meta':
            d = dict(attrs)
            prop = d.get('property', '') or d.get('name', '')
            content = d.get('content', '')
            if prop.startswith('og:') and content:
                self.og[prop] = content
        if tag == 'body': self._done = True
    def handle_endtag(self, tag):
        if tag == 'head': self._done = True

# 1. Fetch shop page and extract item URLs
print("=== Step 1: Fetch BOOTH shop page ===")
shop_url = "https://reverinu.booth.pm/items"
req = urllib.request.Request(shop_url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'text/html',
})
resp = urllib.request.urlopen(req, timeout=10)
html = resp.read().decode('utf-8', errors='replace')

item_ids = list(dict.fromkeys(re.findall(r'https://reverinu\.booth\.pm/items/(\d+)', html)))
print(f"  Found {len(item_ids)} unique items")

# 2. Fetch OGP for each item (first 4 as test)
print(f"\n=== Step 2: Fetch OGP for first 4 items ===")
for item_id in item_ids[:4]:
    url = f"https://reverinu.booth.pm/items/{item_id}"
    try:
        req2 = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; OGP-Fetcher/1.0)',
            'Accept': 'text/html',
        })
        resp2 = urllib.request.urlopen(req2, timeout=8)
        raw = resp2.read(65536)
        item_html = raw.decode('utf-8', errors='replace')
        parser = OGPParser()
        parser.feed(item_html)

        title = parser.og.get('og:title', 'N/A')
        image = parser.og.get('og:image', 'N/A')
        desc = parser.og.get('og:description', 'N/A')[:60]

        print(f"\n  [{item_id}]")
        print(f"    Title: {title}")
        print(f"    Image: {image[:80]}...")
        print(f"    Desc:  {desc}...")
    except Exception as e:
        print(f"\n  [{item_id}] ERROR: {e}")

"""Temporary: YouTube channel ID + RSS feed test"""
import urllib.request
import re
import xml.etree.ElementTree as ET

# 1. Get channel ID from channel page
print("=== Step 1: Get Channel ID ===")
req = urllib.request.Request(
    'https://www.youtube.com/c/KawakenChannel',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept': 'text/html'}
)
resp = urllib.request.urlopen(req, timeout=10)
html = resp.read().decode('utf-8', errors='replace')

# Try externalId first (most reliable)
m = re.search(r'"externalId"\s*:\s*"(UC[^"]+)"', html)
if m:
    channel_id = m.group(1)
    print(f"  externalId: {channel_id}")
else:
    # Fallback: browse_id
    m = re.search(r'"browseId"\s*:\s*"(UC[^"]+)"', html)
    if m:
        channel_id = m.group(1)
        print(f"  browseId: {channel_id}")
    else:
        print("  Channel ID not found!")
        exit(1)

# 2. Fetch RSS feed
rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
print(f"\n=== Step 2: Fetch RSS Feed ===")
print(f"  URL: {rss_url}")

req2 = urllib.request.Request(rss_url, headers={'User-Agent': 'Mozilla/5.0'})
resp2 = urllib.request.urlopen(req2, timeout=10)
xml_data = resp2.read().decode('utf-8', errors='replace')

# 3. Parse RSS
ns = {
    'atom': 'http://www.w3.org/2005/Atom',
    'yt': 'http://www.youtube.com/xml/schemas/2015',
    'media': 'http://search.yahoo.com/mrss/',
}
root = ET.fromstring(xml_data)

entries = root.findall('atom:entry', ns)
print(f"  Found {len(entries)} videos")

for entry in entries[:5]:
    title = entry.find('atom:title', ns).text
    video_id = entry.find('yt:videoId', ns).text
    published = entry.find('atom:published', ns).text
    thumb_el = entry.find('media:group/media:thumbnail', ns)
    thumb_url = thumb_el.get('url') if thumb_el is not None else 'N/A'
    print(f"\n  Title: {title}")
    print(f"  URL: https://www.youtube.com/watch?v={video_id}")
    print(f"  Published: {published}")
    print(f"  Thumb: {thumb_url}")

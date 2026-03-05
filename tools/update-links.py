"""
Links Data Auto-Updater
========================
GitHub Actions から定期実行して data/links.json を更新するスクリプト。
YouTube RSS フィードと BOOTH ショップページから最新コンテンツを取得。
"""

import sys
# Windows cp932 対策: stdout を UTF-8 に切り替え
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import json
import os
import re
import sys
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from html.parser import HTMLParser


# --- 設定 ---
YOUTUBE_CHANNEL_ID = 'UC1B8BqE9nhTIVh-egZPGZbA'
BOOTH_SHOPS = {
    'booth_trpg': {
        'label': 'TRPG Scenarios',
        'icon': '📖',
        'shop_url': 'https://reverinu.booth.pm',
        'items_url': 'https://reverinu.booth.pm/items',
    },
    'booth_goods': {
        'label': 'Goods',
        'icon': '🛍️',
        'shop_url': 'https://reverinu-vtuber.booth.pm',
        'items_url': 'https://reverinu-vtuber.booth.pm/items',
    },
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LINKS_PATH = os.path.join(PROJECT_ROOT, 'data', 'links.json')


# --- OGP Parser ---
class OGPParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.og = {}
        self._done = False

    def handle_starttag(self, tag, attrs):
        if self._done:
            return
        if tag == 'meta':
            d = dict(attrs)
            prop = d.get('property', '') or d.get('name', '')
            content = d.get('content', '')
            if prop.startswith('og:') and content:
                self.og[prop] = content
        if tag == 'body':
            self._done = True

    def handle_endtag(self, tag):
        if tag == 'head':
            self._done = True


def fetch_youtube_rss(channel_id, max_items=8):
    """YouTube RSS フィードから最新動画を取得"""
    rss_url = f'https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}'
    req = urllib.request.Request(rss_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        xml_data = resp.read().decode('utf-8', errors='replace')

    ns = {
        'atom': 'http://www.w3.org/2005/Atom',
        'yt': 'http://www.youtube.com/xml/schemas/2015',
        'media': 'http://search.yahoo.com/mrss/',
    }
    root = ET.fromstring(xml_data)
    entries = root.findall('atom:entry', ns)

    items = []
    for entry in entries[:max_items]:
        title_el = entry.find('atom:title', ns)
        video_id_el = entry.find('yt:videoId', ns)
        published_el = entry.find('atom:published', ns)
        thumb_el = entry.find('media:group/media:thumbnail', ns)

        if title_el is None or video_id_el is None:
            continue

        video_id = video_id_el.text
        published = published_el.text[:10] if published_el is not None else ''

        items.append({
            'title': title_el.text,
            'url': f'https://www.youtube.com/watch?v={video_id}',
            'thumb': thumb_el.get('url') if thumb_el is not None else f'https://i.ytimg.com/vi/{video_id}/hqdefault.jpg',
            'date': published,
        })
    return items


def fetch_ogp(url):
    """指定URLのOGPメタデータを取得"""
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; OGP-Fetcher/1.0)',
        'Accept': 'text/html',
    })
    with urllib.request.urlopen(req, timeout=10) as resp:
        content_type = resp.headers.get('Content-Type', '')
        charset = 'utf-8'
        match = re.search(r'charset=([^\s;]+)', content_type)
        if match:
            charset = match.group(1)
        raw = resp.read(65536)
        try:
            html = raw.decode(charset, errors='replace')
        except (LookupError, UnicodeDecodeError):
            html = raw.decode('utf-8', errors='replace')

    parser = OGPParser()
    parser.feed(html)
    return parser.og


def fetch_booth_items(items_url, max_items=6):
    """BOOTHショップから商品一覧を取得してOGPでメタデータ収集"""
    shop_domain = urllib.parse.urlparse(items_url).netloc
    req = urllib.request.Request(items_url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; OGP-Fetcher/1.0)',
        'Accept': 'text/html',
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='replace')

    pattern = rf'https://{re.escape(shop_domain)}/items/(\d+)'
    item_ids = list(dict.fromkeys(re.findall(pattern, html)))
    print(f'  {shop_domain}: {len(item_ids)} items found')

    items = []
    for item_id in item_ids[:max_items]:
        url = f'https://{shop_domain}/items/{item_id}'
        try:
            ogp = fetch_ogp(url)
            title = ogp.get('og:title', '')
            for suffix in [" - Kawaken's TRPG World - BOOTH", ' - BOOTH']:
                if title.endswith(suffix):
                    title = title[:-len(suffix)]
                    break
            items.append({
                'title': title,
                'url': url,
                'thumb': ogp.get('og:image', ''),
                'description': ogp.get('og:description', '')[:100],
            })
        except Exception as e:
            print(f'  OGP fetch failed for {url}: {e}')
    return items


def main():
    print('=== Links Data Auto-Updater ===')
    result = {}

    # YouTube
    print('Fetching YouTube RSS...')
    try:
        yt_items = fetch_youtube_rss(YOUTUBE_CHANNEL_ID, max_items=8)
        result['youtube'] = {
            'label': 'YouTube',
            'icon': '▶',
            'profileUrl': f'https://www.youtube.com/channel/{YOUTUBE_CHANNEL_ID}?sub_confirmation=1',
            'items': yt_items,
        }
        print(f'  YouTube: {len(yt_items)} videos')
    except Exception as e:
        print(f'  YouTube ERROR: {e}')
        result['youtube'] = {'label': 'YouTube', 'icon': '▶',
                             'profileUrl': f'https://www.youtube.com/channel/{YOUTUBE_CHANNEL_ID}',
                             'items': []}

    # BOOTH
    for key, shop in BOOTH_SHOPS.items():
        print(f'Fetching {shop["label"]}...')
        try:
            booth_items = fetch_booth_items(shop['items_url'], max_items=6)
            result[key] = {
                'label': shop['label'],
                'icon': shop['icon'],
                'profileUrl': shop['shop_url'],
                'items': booth_items,
            }
            print(f'  {shop["label"]}: {len(booth_items)} items')
        except Exception as e:
            print(f'  {shop["label"]} ERROR: {e}')
            result[key] = {'label': shop['label'], 'icon': shop['icon'],
                           'profileUrl': shop['shop_url'], 'items': []}

    # X (リンクのみ)
    result['x'] = {
        'label': 'X (Twitter)',
        'icon': '𝕏',
        'profileUrl': 'https://x.com/reverinu_vtuber',
        'items': [],
    }

    # 保存
    os.makedirs(os.path.dirname(LINKS_PATH), exist_ok=True)
    with open(LINKS_PATH, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
        f.write('\n')

    total = sum(len(v.get('items', [])) for v in result.values())
    print(f'\nSaved to {LINKS_PATH}: {total} total items')
    print('=== Done ===')


if __name__ == '__main__':
    main()

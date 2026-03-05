"""
Editor Server — Custom Server
====================================
- 静的ファイル配信（プロジェクトルートから）
- POST /api/save        → data/achievements.json に直接保存
- GET  /api/ogp         → 指定URLからOGPメタデータ(og:image等)を取得して返す
- GET  /api/fetch-links → YouTube(RSS) + BOOTH(スクレイピング+OGP)で最新コンテンツ自動取得
- POST /api/save-links  → data/links.json に保存
"""

import http.server
import json
import os
import sys
import re
import xml.etree.ElementTree as ET
import urllib.request
import urllib.parse
import urllib.error
from html.parser import HTMLParser


# --- OGP Parser ---
class OGPParser(HTMLParser):
    """HTMLからog:メタタグを抽出するパーサー"""
    def __init__(self):
        super().__init__()
        self.og = {}
        self._done = False

    def handle_starttag(self, tag, attrs):
        if self._done:
            return
        if tag == 'meta':
            attr_dict = dict(attrs)
            prop = attr_dict.get('property', '') or attr_dict.get('name', '')
            content = attr_dict.get('content', '')
            if prop.startswith('og:') and content:
                self.og[prop] = content
        if tag == 'body':
            self._done = True

    def handle_endtag(self, tag):
        if tag == 'head':
            self._done = True


# --- プロジェクトルートを取得 ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ACHIEVEMENTS_PATH = os.path.join(PROJECT_ROOT, 'data', 'achievements.json')
LINKS_PATH = os.path.join(PROJECT_ROOT, 'data', 'links.json')

# デフォルトポート（start.batからは8090、start-editor.batからは8091で起動）
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8090

# --- Links設定 ---
YOUTUBE_CHANNEL_ID = 'UC1B8BqE9nhTIVh-egZPGZbA'
BOOTH_SHOPS = {
    'booth_trpg': {
        'label': 'BOOTH — TRPGシナリオ',
        'icon': '📖',
        'shop_url': 'https://reverinu.booth.pm',
        'items_url': 'https://reverinu.booth.pm/items',
    },
    'booth_goods': {
        'label': 'BOOTH — グッズ',
        'icon': '🛍️',
        'shop_url': 'https://reverinu-vtuber.booth.pm',
        'items_url': 'https://reverinu-vtuber.booth.pm/items',
    },
}


class EditorHandler(http.server.BaseHTTPRequestHandler):
    """カスタムリクエストハンドラ（BaseHTTPRequestHandler ベース）"""

    def do_GET(self):
        """GET: APIエンドポイント or 静的ファイル"""
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/ogp':
            self._handle_ogp(parsed.query)
        elif parsed.path == '/api/fetch-links':
            self._handle_fetch_links()
        else:
            self._serve_static(parsed.path)

    def do_POST(self):
        """POST: JSON保存"""
        parsed = urllib.parse.urlparse(self.path)
        print(f'[POST] {parsed.path}')

        if parsed.path == '/api/save':
            self._handle_save()
        elif parsed.path == '/api/save-links':
            self._handle_save_links()
        else:
            self.send_error(404, 'Not Found')

    def do_OPTIONS(self):
        """OPTIONS: CORSプリフライト対応"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _serve_static(self, url_path):
        """静的ファイルを配信"""
        # URLパスをファイルパスに変換
        if url_path == '/':
            url_path = '/index.html'

        # パストラバーサル防止
        clean_path = urllib.parse.unquote(url_path).lstrip('/')
        file_path = os.path.normpath(os.path.join(PROJECT_ROOT, clean_path))

        # PROJECT_ROOT 外へのアクセスを拒否
        if not file_path.startswith(PROJECT_ROOT):
            self.send_error(403, 'Forbidden')
            return

        if not os.path.isfile(file_path):
            self.send_error(404, 'Not Found')
            return

        # MIMEタイプ推定
        ext = os.path.splitext(file_path)[1].lower()
        mime_types = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.webp': 'image/webp',
        }
        content_type = mime_types.get(ext, 'application/octet-stream')

        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            print(f'[ERROR] 静的ファイル配信エラー: {file_path} - {e}')
            self.send_error(500, str(e))

    def _handle_save(self):
        """data/achievements.json に JSON を保存"""
        try:
            content_length = self.headers.get('Content-Length')
            print(f'[SAVE] Content-Length: {content_length}')

            if not content_length:
                self._json_response(400, {'ok': False, 'error': 'Content-Length ヘッダーがありません'})
                return

            length = int(content_length)
            body = self.rfile.read(length)
            print(f'[SAVE] Body length: {len(body)} bytes')

            data = json.loads(body.decode('utf-8'))

            if not isinstance(data, list):
                raise ValueError('データは配列である必要があります')

            # ディレクトリ確認
            os.makedirs(os.path.dirname(ACHIEVEMENTS_PATH), exist_ok=True)

            # 保存
            print(f'[SAVE] Writing to: {ACHIEVEMENTS_PATH}')
            with open(ACHIEVEMENTS_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
                f.write('\n')

            # 検証: 書き込み後に読み戻す
            with open(ACHIEVEMENTS_PATH, 'r', encoding='utf-8') as f:
                verify = json.load(f)
            total_items = sum(len(g.get('items', [])) for g in verify)
            print(f'[SAVE] 検証OK: {len(verify)} グループ, {total_items} アイテム')

            self._json_response(200, {
                'ok': True,
                'groups': len(verify),
                'items': total_items,
            })

        except json.JSONDecodeError as e:
            print(f'[SAVE ERROR] JSON解析エラー: {e}')
            self._json_response(400, {'ok': False, 'error': f'JSON解析エラー: {e}'})
        except Exception as e:
            print(f'[SAVE ERROR] {e}')
            self._json_response(500, {'ok': False, 'error': str(e)})

    def _handle_ogp(self, query_string):
        """指定URLのOGPメタデータを取得"""
        params = urllib.parse.parse_qs(query_string)
        url = params.get('url', [None])[0]

        if not url:
            self._json_response(400, {'error': 'url パラメータが必要です'})
            return

        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; OGP-Fetcher/1.0)',
                'Accept': 'text/html',
            })
            with urllib.request.urlopen(req, timeout=8) as resp:
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

            self._json_response(200, {
                'ok': True,
                'url': url,
                'og': parser.og,
            })

        except urllib.error.HTTPError as e:
            self._json_response(502, {'ok': False, 'error': f'HTTP {e.code}: {e.reason}'})
        except urllib.error.URLError as e:
            self._json_response(502, {'ok': False, 'error': f'接続エラー: {e.reason}'})
        except Exception as e:
            self._json_response(500, {'ok': False, 'error': str(e)})

    # --- Links: 自動取得 ---
    def _handle_fetch_links(self):
        """YouTube(RSS) + BOOTH(スクレイピング+OGP) で最新コンテンツを取得"""
        print('[FETCH-LINKS] 開始...')
        result = {}

        # YouTube
        try:
            yt_items = self._fetch_youtube_rss(YOUTUBE_CHANNEL_ID, max_items=8)
            result['youtube'] = {
                'label': 'YouTube',
                'icon': '▶',
                'profileUrl': f'https://www.youtube.com/channel/{YOUTUBE_CHANNEL_ID}?sub_confirmation=1',
                'items': yt_items,
            }
            print(f'[FETCH-LINKS] YouTube: {len(yt_items)} 件取得')
        except Exception as e:
            print(f'[FETCH-LINKS] YouTube エラー: {e}')
            result['youtube'] = {'label': 'YouTube', 'icon': '▶',
                                 'profileUrl': f'https://www.youtube.com/channel/{YOUTUBE_CHANNEL_ID}',
                                 'items': [], 'error': str(e)}

        # BOOTH shops
        for key, shop in BOOTH_SHOPS.items():
            try:
                booth_items = self._fetch_booth_items(shop['items_url'], max_items=6)
                result[key] = {
                    'label': shop['label'],
                    'icon': shop['icon'],
                    'profileUrl': shop['shop_url'],
                    'items': booth_items,
                }
                print(f'[FETCH-LINKS] {shop["label"]}: {len(booth_items)} 件取得')
            except Exception as e:
                print(f'[FETCH-LINKS] {shop["label"]} エラー: {e}')
                result[key] = {'label': shop['label'], 'icon': shop['icon'],
                               'profileUrl': shop['shop_url'],
                               'items': [], 'error': str(e)}

        # X (リンクのみ)
        result['x'] = {
            'label': 'X (Twitter)',
            'icon': '𝕏',
            'profileUrl': 'https://x.com/reverinu_vtuber',
            'items': [],
        }

        self._json_response(200, {'ok': True, 'data': result})
        print('[FETCH-LINKS] 完了')

    def _fetch_youtube_rss(self, channel_id, max_items=8):
        """YouTube RSS フィードから最新動画を取得"""
        rss_url = f'https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}'
        req = urllib.request.Request(rss_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
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

    def _fetch_booth_items(self, items_url, max_items=6):
        """BOOTHショップページから商品URL一覧を取得し、各商品のOGPを取得"""
        # Step 1: ショップページから商品IDを抽出
        shop_domain = urllib.parse.urlparse(items_url).netloc
        req = urllib.request.Request(items_url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; OGP-Fetcher/1.0)',
            'Accept': 'text/html',
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='replace')

        pattern = rf'https://{re.escape(shop_domain)}/items/(\d+)'
        item_ids = list(dict.fromkeys(re.findall(pattern, html)))
        print(f'[BOOTH] {shop_domain}: {len(item_ids)} 件の商品IDを検出')

        # Step 2: 各商品のOGPを取得
        items = []
        for item_id in item_ids[:max_items]:
            url = f'https://{shop_domain}/items/{item_id}'
            try:
                ogp = self._fetch_ogp_data(url)
                # タイトルからショップ名サフィックスを除去
                title = ogp.get('og:title', '')
                for suffix in [' - Kawaken\'s TRPG World - BOOTH',
                               ' - BOOTH']:
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
                print(f'[BOOTH] OGP取得失敗 {url}: {e}')
        return items

    def _fetch_ogp_data(self, url):
        """指定URLのOGPメタデータを取得して辞書で返す"""
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; OGP-Fetcher/1.0)',
            'Accept': 'text/html',
        })
        with urllib.request.urlopen(req, timeout=8) as resp:
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

    # --- Links: 保存 ---
    def _handle_save_links(self):
        """data/links.json に JSON を保存"""
        try:
            content_length = self.headers.get('Content-Length')
            if not content_length:
                self._json_response(400, {'ok': False, 'error': 'Content-Length ヘッダーがありません'})
                return

            length = int(content_length)
            body = self.rfile.read(length)
            data = json.loads(body.decode('utf-8'))

            if not isinstance(data, dict):
                raise ValueError('データはオブジェクトである必要があります')

            os.makedirs(os.path.dirname(LINKS_PATH), exist_ok=True)

            print(f'[SAVE-LINKS] Writing to: {LINKS_PATH}')
            with open(LINKS_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
                f.write('\n')

            # 検証
            with open(LINKS_PATH, 'r', encoding='utf-8') as f:
                verify = json.load(f)
            total = sum(len(v.get('items', [])) for v in verify.values() if isinstance(v, dict))
            print(f'[SAVE-LINKS] 検証OK: {len(verify)} カテゴリ, {total} アイテム')

            self._json_response(200, {'ok': True, 'categories': len(verify), 'items': total})

        except json.JSONDecodeError as e:
            print(f'[SAVE-LINKS ERROR] JSON解析エラー: {e}')
            self._json_response(400, {'ok': False, 'error': f'JSON解析エラー: {e}'})
        except Exception as e:
            print(f'[SAVE-LINKS ERROR] {e}')
            self._json_response(500, {'ok': False, 'error': str(e)})

    def _json_response(self, status, data):
        """JSON レスポンスを返す"""
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        """ログ出力（静的ファイルはパスのみ簡潔に、APIは詳細に）"""
        msg = format % args if args else format
        if '/api/' in msg:
            sys.stderr.write(f'[API] {msg}\n')
        # 静的ファイルも全てログ出力（デバッグ用）
        else:
            sys.stderr.write(f'[FILE] {msg}\n')


def main():
    os.chdir(PROJECT_ROOT)
    print(f'=== Editor Server ===')
    print(f'Python: {sys.version}')
    print(f'プロジェクトルート: {PROJECT_ROOT}')
    print(f'実績データ: {ACHIEVEMENTS_PATH}')
    print(f'リンクデータ: {LINKS_PATH}')
    print(f'ポート: {PORT}')
    print(f'実績エディタ: http://localhost:{PORT}/tools/achievement-editor.html')
    print(f'リンクエディタ: http://localhost:{PORT}/tools/link-editor.html')
    print(f'========================')
    print()

    with http.server.HTTPServer(('', PORT), EditorHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nサーバーを停止しました')


if __name__ == '__main__':
    main()

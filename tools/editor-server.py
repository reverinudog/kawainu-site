"""
Achievement Editor — Custom Server
====================================
- 静的ファイル配信（プロジェクトルートから）
- POST /api/save   → data/achievements.json に直接保存
- GET  /api/ogp    → 指定URLからOGPメタデータ(og:image等)を取得して返す
"""

import http.server
import json
import os
import sys
import re
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

PORT = 8091


class EditorHandler(http.server.BaseHTTPRequestHandler):
    """カスタムリクエストハンドラ（BaseHTTPRequestHandler ベース）"""

    def do_GET(self):
        """GET: APIエンドポイント or 静的ファイル"""
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/ogp':
            self._handle_ogp(parsed.query)
        else:
            self._serve_static(parsed.path)

    def do_POST(self):
        """POST: JSON保存"""
        parsed = urllib.parse.urlparse(self.path)
        print(f'[POST] {parsed.path}')

        if parsed.path == '/api/save':
            self._handle_save()
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
    print(f'=== Achievement Editor Server ===')
    print(f'Python: {sys.version}')
    print(f'プロジェクトルート: {PROJECT_ROOT}')
    print(f'実績データ: {ACHIEVEMENTS_PATH}')
    print(f'ファイル存在: {os.path.exists(ACHIEVEMENTS_PATH)}')
    print(f'ポート: {PORT}')
    print(f'エディタ: http://localhost:{PORT}/tools/achievement-editor.html')
    print(f'================================')
    print()

    with http.server.HTTPServer(('', PORT), EditorHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nサーバーを停止しました')


if __name__ == '__main__':
    main()

"""William Quest — servidor local con MIME types correctos para .ts/.tsx."""
import http.server
import socketserver
import sys
import os

PORT = int(os.environ.get("PORT", 8081))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".ts": "application/javascript",
        ".tsx": "application/javascript",
        ".mjs": "application/javascript",
        ".js": "application/javascript",
        ".jsx": "application/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".mp3": "audio/mpeg",
        ".png": "image/png",
        ".ico": "image/x-icon",
    }

    def end_headers(self):
        # Cache-control: no-store para evitar caché raro en desarrollo
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("[serve] %s - %s\n" % (self.address_string(), format % args))


os.chdir(ROOT)
print(f"William Quest dev server — sirviendo {ROOT} en http://127.0.0.1:{PORT}")

with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.serve_forever()
"""William Quest — servidor local con MIME types correctos y proxy TTS MiniMax."""
import http.server
import json
import os
import socketserver
import subprocess
import sys
import urllib.error
import urllib.request

PORT = int(os.environ.get("PORT", 8081))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TTS_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "minimax-tts-cli.py")


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

    def do_POST(self):
        if self.path.split("?", 1)[0] == "/api/tts":
            self.handle_tts()
            return
        self.send_error(404)

    def handle_tts(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b"{}"
            payload = json.loads(raw.decode("utf-8") or "{}")
            text = (payload.get("text") or "").strip()
            if not text:
                self.send_json(400, {"error": "text requerido"})
                return

            proc = subprocess.run(
                [sys.executable, TTS_SCRIPT, text],
                capture_output=True,
                env=os.environ.copy(),
            )
            if proc.returncode != 0:
                err = proc.stderr.decode("utf-8", errors="replace").strip()
                self.send_json(502, {"error": err or "TTS falló"})
                return

            mp3 = proc.stdout
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(mp3)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(mp3)
        except json.JSONDecodeError:
            self.send_json(400, {"error": "JSON inválido"})
        except Exception as exc:
            self.send_json(500, {"error": str(exc)})

    def send_json(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("[serve] %s - %s\n" % (self.address_string(), format % args))


os.chdir(ROOT)
print(f"William Quest dev server — sirviendo {ROOT} en http://127.0.0.1:{PORT}")
if os.environ.get("MINIMAX_API_KEY"):
    print("[serve] TTS MiniMax: POST /api/tts disponible")
else:
    print("[serve] TTS MiniMax: MINIMAX_API_KEY no configurada (solo MP3 estáticos)")

with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.serve_forever()

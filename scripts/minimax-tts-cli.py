"""CLI: stdin text arg -> stdout MP3 bytes (MiniMax T2A). Usado por dev-server /api/tts."""
import json
import os
import sys
import urllib.request

DEFAULTS = {
    "model": "speech-02-turbo",
    "voice_id": "English_Trustworth_Man",
    "speed": 0.95,
    "emotion": "neutral",
}


def main():
    text = " ".join(sys.argv[1:]).strip()
    if not text:
        sys.stderr.write("text requerido\n")
        sys.exit(1)

    api_key = os.environ.get("MINIMAX_API_KEY")
    if not api_key:
        sys.stderr.write("MINIMAX_API_KEY no configurada\n")
        sys.exit(1)

    base = os.environ.get("MINIMAX_API_BASE", "https://api.minimax.io/v1/t2a_v2").rstrip("/")
    group_id = os.environ.get("MINIMAX_GROUP_ID")
    url = f"{base}?GroupId={group_id}" if group_id else base

    body = json.dumps(
        {
            "model": DEFAULTS["model"],
            "text": text,
            "stream": False,
            "voice_setting": {
                "voice_id": DEFAULTS["voice_id"],
                "speed": DEFAULTS["speed"],
                "vol": 1,
                "pitch": 0,
                "emotion": DEFAULTS["emotion"],
            },
            "audio_setting": {
                "format": "mp3",
                "sample_rate": 32000,
                "bitrate": 128000,
                "channel": 1,
            },
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        sys.stderr.write(f"MiniMax HTTP {exc.code}: {detail[:400]}\n")
        sys.exit(1)

    data = json.loads(raw)
    base_resp = data.get("base_resp") or data.get("baseResp") or {}
    if base_resp.get("status_code") not in (0, None):
        sys.stderr.write(f"MiniMax error {base_resp.get('status_code')}: {base_resp.get('status_msg')}\n")
        sys.exit(1)

    hex_audio = (data.get("data") or {}).get("audio")
    if not hex_audio:
        sys.stderr.write("MiniMax: sin audio en respuesta\n")
        sys.exit(1)

    sys.stdout.buffer.write(bytes.fromhex(hex_audio))


if __name__ == "__main__":
    main()

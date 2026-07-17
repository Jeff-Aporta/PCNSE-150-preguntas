/**
 * MiniMax T2A — compartido entre generate-audio.mjs y dev-server (via subprocess).
 * Env: MINIMAX_API_KEY (requerido), MINIMAX_GROUP_ID (opcional),
 *      WILLIAM_VOICE_ID (opcional, default = voz clonada del autor).
 *
 * Voz clonada del autor — moss_audio_6121c2b3-7957-11f1-b432-da8cea034f66
 * (Jeff-Aporta, español + inglés). Si la voz expira (>168h sin uso) o
 * necesitas regenerarla, corre primero el script de Voice Clone y reemplaza
 * la constante a continuación, o exporta WILLIAM_VOICE_ID al regenerar.
 */
const WILLIAM_VOICE_ID = "moss_audio_6121c2b3-7957-11f1-b432-da8cea034f66";

const DEFAULTS = {
  model: "speech-02-turbo",
  voice_id: process.env.WILLIAM_VOICE_ID || WILLIAM_VOICE_ID,
  speed: 0.95,
  emotion: "neutral",
};

function apiBase() {
  return (
    process.env.MINIMAX_API_BASE ||
    "https://api.minimax.io/v1/t2a_v2"
  ).replace(/\/$/, "");
}

export async function synthesizeMinimax(text, opts = {}) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("MINIMAX_API_KEY no configurada");

  const body = {
    model: opts.model || DEFAULTS.model,
    text,
    stream: false,
    ...(opts.language_boost ? { language_boost: opts.language_boost } : {}),
    voice_setting: {
      voice_id: opts.voice_id || DEFAULTS.voice_id,
      speed: opts.speed ?? DEFAULTS.speed,
      vol: 1,
      pitch: 0,
      emotion: opts.emotion || DEFAULTS.emotion,
    },
    audio_setting: {
      format: "mp3",
      sample_rate: 32000,
      bitrate: 128000,
      channel: 1,
    },
  };

  const groupId = process.env.MINIMAX_GROUP_ID;
  const url = groupId ? `${apiBase()}?GroupId=${encodeURIComponent(groupId)}` : apiBase();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`MiniMax TTS respuesta inválida (${res.status}): ${raw.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(`MiniMax TTS HTTP ${res.status}: ${raw.slice(0, 400)}`);
  }

  const baseResp = data.base_resp || data.baseResp;
  if (baseResp && baseResp.status_code !== 0 && baseResp.status_code !== undefined) {
    throw new Error(`MiniMax TTS error ${baseResp.status_code}: ${baseResp.status_msg || "unknown"}`);
  }

  const hex =
    data?.data?.audio ??
    data?.audio_file ??
    data?.extra_info?.audio ??
    null;

  if (!hex || typeof hex !== "string") {
    throw new Error("MiniMax TTS: sin campo audio en respuesta");
  }

  return Buffer.from(hex, "hex");
}

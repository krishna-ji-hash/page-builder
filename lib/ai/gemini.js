/**
 * Google Gemini API client — server-side only.
 * Set GEMINI_API_KEY in .env (never commit keys).
 */

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function isGeminiConfigured() {
  return Boolean(String(process.env.GEMINI_API_KEY || '').trim());
}

function getApiKey() {
  const key = String(process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  return key;
}

/**
 * @param {{ prompt: string, systemInstruction?: string, json?: boolean, temperature?: number }} opts
 */
export async function geminiGenerateText({ prompt, systemInstruction, json = false, temperature = 0.35 }) {
  const key = getApiKey();
  const model = DEFAULT_MODEL;
  const url = `${API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.GEMINI_TIMEOUT_MS || 25000));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `Gemini API error ${res.status}`;
      throw new Error(msg);
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    if (!text.trim()) throw new Error('Empty Gemini response');
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Vision helper (optional) — image path for server-side file reads.
 */
export async function geminiGenerateFromImage({ imagePath, instructions, mimeType = 'image/jpeg' }) {
  const fs = await import('fs');
  const key = getApiKey();
  const model = DEFAULT_MODEL;
  const base64 = fs.readFileSync(imagePath, { encoding: 'base64' });

  const url = `${API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: instructions },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Gemini API error ${res.status}`);
  return data;
}

export async function geminiGenerateJson(opts) {
  const raw = await geminiGenerateText({ ...opts, json: true });
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Gemini returned invalid JSON');
  }
}

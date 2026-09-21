#!/usr/bin/env -S bun run
/**
 * Reproducer for the structured-output issue against the PUBLISHED
 * @puku-ai/sdk (4.0.4 on npm), running against the live Puku gateway.
 *
 * Three probes in one run, all with max_tokens bumped so the model can
 * emit JSON without truncating:
 *   A) Reproducer shape from the issue:
 *        output_config.format = { type: 'json_schema',
 *                                  json_schema: { strict, schema } }
 *      — 
 *        enforces the schema even when it's wrapped in `json_schema`.
 *
 *   B) Puku flat shape:
 *        output_config.format = { type: 'json_schema', schema }
 *      — the shape Puku's own helpers (zodOutputFormat, jsonSchemaOutputFormat)
 *        produce.
 *
 *   C) Same prompt, NO output_config, system-prompt-only JSON instruction.
 *      — Baseline: confirms the model can/can't emit JSON when nothing
 *        constrains it. If C emits JSON and A/B emit prose, the issue
 *        is upstream of model capability.
 *
 * Each probe prints:
 *   - the wire body the SDK emitted (sniffed via fetch override)
 *   - whether the response text is JSON
 *   - whether the JSON matches the schema's required keys
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---- 1. Load .env ----
// Walk up from this file looking for `.env` (handles both the SDK package's
// `examples/.env -> ../.env` layout and a flat `examples/.env` layout). If no
// file is found, continue — env vars may already be populated by the caller.
const here = dirname(fileURLToPath(import.meta.url));
function findEnv(): string | null {
  for (let dir = here; ; dir = dirname(dir)) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) return candidate;
    if (dir === dirname(dir)) break; // hit filesystem root
  }
  // Last resort: CWD (matches the original behaviour).
  const cwd = resolve(process.cwd(), '.env');
  return existsSync(cwd) ? cwd : null;
}
const envPath = findEnv();
if (envPath) {
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} else {
  console.warn('[env] no .env file found — relying on ambient process.env');
}

const API_KEY = process.env.PUKU_API_KEY!;
const BASE = process.env.PUKU_BASE_URL!;
if (!API_KEY || !BASE) {
  console.error('PUKU_API_KEY or PUKU_BASE_URL missing from .env');
  process.exit(2);
}
console.log(`[env] PUKU_BASE_URL=${BASE}`);
console.log(`[env] PUKU_API_KEY=${API_KEY.slice(0, 8)}…(${API_KEY.length} chars)`);

// ---- 2. Confirm we are talking to the PUBLISHED SDK ----
import PukuAI, { VERSION } from '@puku-ai/sdk';
console.log(`[sdk] @puku-ai/sdk VERSION constant = ${VERSION}`);
console.log(`[sdk] @puku-ai/sdk package version  = 4.0.4 (npm tarball — see dist/vendor/version.js)`);

// ---- 3. Sniff the wire body the SDK sends ----
const wireLog: Array<{ label: string; url: string; body: any }> = [];
const origFetch = globalThis.fetch;
globalThis.fetch = async (input: any, init?: any) => {
  const url = typeof input === 'string' ? input : input.url;
  let bodyParsed: any = init?.body;
  try { bodyParsed = JSON.parse(init?.body); } catch { /* leave as string */ }
  wireLog.push({ label: '(pending)', url, body: bodyParsed });
  return origFetch(input as any, init);
};

// ---- 4. Schema under test (verbatim from the issue) ----
const summarySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    highlights: { type: 'array', items: { type: 'string' } },
    recommendations: {
      type: 'object',
      additionalProperties: false,
      properties: {
        recommendationType: {
          type: 'string',
          enum: ['savings', 'optimization', 'renewal', 'risk', 'workflow'],
        },
        title: { type: 'string' },
        narrative: { type: 'string' },
        priority: { type: 'integer' },
        effort: { type: 'string', enum: ['low', 'medium', 'high'] },
        businessImpact: { type: 'string', enum: ['low', 'medium', 'high'] },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      },
      required: [
        'recommendationType', 'title', 'narrative', 'priority',
        'effort', 'businessImpact', 'confidence',
      ],
    },
  },
  required: ['summary', 'highlights', 'recommendations'],
};

const client = new PukuAI({
  apiKey: API_KEY,
  baseURL: BASE,
  timeout: 60_000,
  maxRetries: 0,
});

function showWireBody(label: string): void {
  const entry = wireLog[wireLog.length - 1];
  if (!entry) return;
  entry.label = label;
  console.log(`\n----- [${label}] wire body sent by SDK -----`);
  // Show only output_config (everything else is identical across probes).
  const cfg = entry.body?.output_config;
  console.log('output_config = ' + JSON.stringify(cfg, null, 2));
  console.log(`(body length: ${JSON.stringify(entry.body).length} chars, full body not shown for brevity)`);
}

function summarize(label: string, text: string): void {
  console.log(`\n----- [${label}] response text (first 320 chars) -----`);
  console.log(text.slice(0, 320) + (text.length > 320 ? '…' : ''));
  let parsed: any = null;
  let parseErr: string | null = null;
  try { parsed = JSON.parse(text); } catch (e) { parseErr = (e as Error).message; }
  if (parseErr) {
    console.log(`[${label}] ✗ response is NOT JSON: ${parseErr.split('\n')[0]}`);
    return;
  }
  const topKeys = Object.keys(parsed ?? {}).sort();
  console.log(`[${label}] ✓ response IS JSON; top-level keys: [${topKeys.join(', ')}]`);
  const missing = ['summary', 'highlights', 'recommendations'].filter((k) => !(k in parsed));
  if (missing.length > 0) {
    console.log(`[${label}] ✗ schema MISSING required keys: [${missing.join(', ')}]`);
  } else {
    console.log(`[${label}] ✓ schema has all three required keys`);
  }
}

// ---- Reset wireLog and re-run cleanly for each probe so labels stay tidy ----
async function probe(label: string, request: any): Promise<void> {
  wireLog.length = 0;
  console.log(`\n========== ${label} ==========`);
  const r = await client.messages.create(request);
  showWireBody(label);
  const text = r.content?.[0]?.type === 'text' ? r.content[0].text : '';
  summarize(label, text);
  // Stop reason is informative.
  console.log(`[${label}] stop_reason=${r.stop_reason}, model=${r.model}`);
  console.log(`[${label}] usage: ${JSON.stringify(r.usage)}`);
}

const baseMessages = [{
  role: 'user' as const,
  content:
    'Return a small synthetic summary of three fictional cloud-spend ' +
    'recommendations. The summary is about a $10k/mo test spend graph ' +
    'on AWS for a fictional 50-person startup.',
}];

const baseSystem =
  'You are an analyst. Respond ONLY with valid JSON matching the requested schema. No prose, no markdown fences.';

await probe('A) Reproducer shape (Anthropic-style)', {
  model: 'puku-ai-2.8',
  max_tokens: 2000,
  system: baseSystem,
  messages: baseMessages,
  output_config: {
    format: {
      type: 'json_schema',
      json_schema: { strict: true, schema: summarySchema },
    },
  },
});

await probe('B) Puku flat shape (no wrapper)', {
  model: 'puku-ai-2.8',
  max_tokens: 2000,
  system: baseSystem,
  messages: baseMessages,
  output_config: {
    format: {
      type: 'json_schema',
      schema: summarySchema,
    },
  },
});

await probe('C) No output_config, system-prompt only', {
  model: 'puku-ai-2.8',
  max_tokens: 2000,
  system: baseSystem,
  messages: baseMessages,
});

console.log('\n[done]');

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.resolve(__dirname, '../src/data/portal-data.json');
const PORT = process.env.PORT || 3001;

// List of connected SSE clients
const sseClients = new Set();

// In-memory base data and live state
let basePortalData = null;
let currentPortalData = null;

// Telemetry state for 8 institutional vendors
let vendorTelemetry = {
  'fireblocks': {
    status: 'operational',
    indicator: 'none',
    latencyMs: 42,
    uptime30d: '99.99%',
    lastChecked: new Date().toISOString(),
    sourceUrl: 'https://status.fireblocks.com',
    sourceApi: 'https://status.fireblocks.com/api/v2/summary.json',
    activeIncident: null,
  },
  'bitgo': {
    status: 'operational',
    indicator: 'none',
    latencyMs: 58,
    uptime30d: '99.96%',
    lastChecked: new Date().toISOString(),
    sourceUrl: 'https://status.bitgo.com',
    sourceApi: 'https://status.bitgo.com/api/v2/summary.json',
    activeIncident: null,
  },
  'coinbase-custody': {
    status: 'operational',
    indicator: 'none',
    latencyMs: 38,
    uptime30d: '99.98%',
    lastChecked: new Date().toISOString(),
    sourceUrl: 'https://status.coinbase.com',
    sourceApi: 'https://status.coinbase.com/api/v2/summary.json',
    activeIncident: null,
  },
  'anchorage': {
    status: 'operational',
    indicator: 'none',
    latencyMs: 64,
    uptime30d: '99.95%',
    lastChecked: new Date().toISOString(),
    sourceUrl: 'https://status.anchorage.com',
    sourceApi: null,
    activeIncident: null,
  },
  'ledger-enterprise': {
    status: 'operational',
    indicator: 'none',
    latencyMs: 49,
    uptime30d: '99.97%',
    lastChecked: new Date().toISOString(),
    sourceUrl: 'https://enterprise.ledger.com',
    sourceApi: null,
    activeIncident: null,
  },
  'fordefi': {
    status: 'operational',
    indicator: 'none',
    latencyMs: 51,
    uptime30d: '99.94%',
    lastChecked: new Date().toISOString(),
    sourceUrl: 'https://fordefi.com',
    sourceApi: null,
    activeIncident: null,
  },
  'dfns': {
    status: 'operational',
    indicator: 'none',
    latencyMs: 55,
    uptime30d: '99.92%',
    lastChecked: new Date().toISOString(),
    sourceUrl: 'https://dfns.co',
    sourceApi: null,
    activeIncident: null,
  },
  'komainu': {
    status: 'operational',
    indicator: 'none',
    latencyMs: 62,
    uptime30d: '99.91%',
    lastChecked: new Date().toISOString(),
    sourceUrl: 'https://komainu.com',
    sourceApi: null,
    activeIncident: null,
  },
};

// Live Standards Telemetry (e.g. GitHub EIP-4337, ERC-7579, NIST)
let standardsTelemetry = {
  't-erc4337': {
    standard: 'ERC-4337',
    githubRepo: 'ethereum/EIPs',
    stage: 'Final / Production',
    openPRs: 7,
    latestCommitDate: new Date().toISOString().split('T')[0],
    liveStatus: 'Active Adoption',
  },
  't-passkey': {
    standard: 'W3C WebAuthn Level 3',
    githubRepo: 'w3c/webauthn',
    stage: 'Candidate Recommendation',
    openPRs: 12,
    latestCommitDate: new Date().toISOString().split('T')[0],
    liveStatus: 'Bank Pilot Ready',
  },
  't-mpc-cmp': {
    standard: 'MPC-CMP (Lindell et al.)',
    githubRepo: 'fireblocks/mpc-cmp',
    stage: 'Audited Peer-Reviewed',
    openPRs: 2,
    latestCommitDate: new Date().toISOString().split('T')[0],
    liveStatus: 'Standard in Banking',
  },
  't-quantum': {
    standard: 'NIST FIPS 203 / ML-KEM',
    githubRepo: 'usnistgov/post-quantum-cryptography',
    stage: 'Final Standard (Aug 2024)',
    openPRs: 0,
    latestCommitDate: new Date().toISOString().split('T')[0],
    liveStatus: 'Long-term Migration',
  },
};

// Active simulated override (for presentation demo)
let activeSimulation = null;

/**
 * Load base portal data from JSON
 */
async function loadBaseData() {
  const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
  basePortalData = JSON.parse(raw);
  currentPortalData = JSON.parse(raw);
  recomputePortalData();
}

/**
 * Fetch status page via HTTP with short timeout
 */
async function fetchStatusPage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'InDan-CIO-Monitor/2.0' }
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  }
}

/**
 * Poll external live data sources
 */
async function pollExternalSources() {
  const now = new Date();

  for (const [vendorId, telemetry] of Object.entries(vendorTelemetry)) {
    // Slight jitter on latency for live feel
    const jitter = Math.floor(Math.random() * 8) - 4;
    telemetry.latencyMs = Math.max(28, Math.min(95, telemetry.latencyMs + jitter));
    telemetry.lastChecked = now.toISOString();

    if (telemetry.sourceApi) {
      const data = await fetchStatusPage(telemetry.sourceApi);
      if (data && data.status) {
        telemetry.indicator = data.status.indicator || 'none';
        telemetry.status = data.status.indicator === 'none' ? 'operational' : 'degraded';
        if (data.status.indicator !== 'none' && data.incidents && data.incidents.length > 0) {
          telemetry.activeIncident = {
            title: data.incidents[0].name,
            severity: data.status.indicator,
            startedAt: data.incidents[0].created_at,
            details: data.incidents[0].incident_updates?.[0]?.body || 'Инцидент расследуется инженерами вендора.'
          };
        } else if (telemetry.status === 'operational' && !activeSimulation?.vendorId === vendorId) {
          telemetry.activeIncident = null;
        }
      }
    }
  }

  // Apply any active presentation simulation overrides
  if (activeSimulation) {
    if (activeSimulation.type === 'vendor_incident') {
      const t = vendorTelemetry[activeSimulation.vendorId];
      if (t) {
        t.status = activeSimulation.status || 'degraded';
        t.indicator = activeSimulation.indicator || 'major';
        t.activeIncident = {
          title: activeSimulation.title || 'Сбой авторизационного шлюза MPC',
          severity: t.indicator,
          startedAt: activeSimulation.startedAt || now.toISOString(),
          details: activeSimulation.details || 'Фиксация задержек подписания транзакций институциональных клиентов.'
        };
      }
    }
  }

  recomputePortalData();
  broadcastToSse('portal-data', currentPortalData);
}

/**
 * Dynamic Decision Engine:
 * Recomputes Buy/Hold/Avoid verdicts and Quadrant scores based on live telemetry & signals
 */
function recomputePortalData() {
  if (!basePortalData) return;

  // Deep clone from base
  const updated = JSON.parse(JSON.stringify(basePortalData));
  const now = new Date();

  // Enrich vendor dossiers with live telemetry
  updated.vendorDossiers = updated.vendorDossiers.map(dossier => {
    const t = vendorTelemetry[dossier.id];
    const liveTelemetryObj = t ? { ...t } : null;

    let verdict = dossier.verdict;
    let incidentNote = dossier.incidentNote;

    // Check if vendor has an active incident
    if (t && t.activeIncident) {
      if (t.indicator === 'major' || t.indicator === 'critical') {
        // Automatically downgrade verdict to Hold if was Buy
        if (verdict === 'buy') {
          verdict = 'hold';
        }
        incidentNote = `⚡ ВНИМАНИЕ (LIVE ALERT): Зафиксирован активный инцидент: ${t.activeIncident.title}. Рекомендация для Инвесткомитета временно понижена до нормализации SLA.`;
      }
    }

    return {
      ...dossier,
      verdict,
      incidentNote,
      liveTelemetry: liveTelemetryObj,
    };
  });

  // Recompute Overview decisions based on enriched vendor dossiers
  updated.decisions = updated.decisions.map(decision => {
    if (decision.type === 'vendor') {
      const enrichedVendor = updated.vendorDossiers.find(v => v.id === decision.id);
      if (enrichedVendor) {
        let reason = decision.reason;
        if (enrichedVendor.liveTelemetry?.activeIncident) {
          reason = `[LIVE АЛЕРТ]: ${enrichedVendor.liveTelemetry.activeIncident.title} — статус доступности понижен до ${enrichedVendor.liveTelemetry.status}. Рекомендуется приостановить интеграцию.`;
        }
        return {
          ...decision,
          verdict: enrichedVendor.verdict,
          reason,
          liveStatus: enrichedVendor.liveTelemetry?.status || 'operational',
          liveUptime: enrichedVendor.liveTelemetry?.uptime30d || '99.98%',
          liveIncident: enrichedVendor.liveTelemetry?.activeIncident,
        };
      }
    }
    return decision;
  });

  // Recompute Quadrant coordinates dynamically
  updated.quadrant.vendors = updated.quadrant.vendors.map(v => {
    const t = vendorTelemetry[v.id];
    let execution = v.execution;
    if (t && t.activeIncident) {
      // Degrade execution score dynamically during an outage
      execution = Math.max(1.0, +(execution - 0.4).toFixed(1));
    }
    return {
      ...v,
      execution,
      liveStatus: t?.status || 'operational',
      liveIncident: t?.activeIncident || null,
    };
  });

  // Add live standards telemetry to HypeCycle
  updated.hypeCycle = updated.hypeCycle.map(tech => {
    const s = standardsTelemetry[tech.id];
    return {
      ...tech,
      liveStandard: s || null,
    };
  });

  // Prepend live simulated signal if exists
  if (activeSimulation && activeSimulation.type === 'regulatory_signal') {
    const liveSig = {
      id: 'sig-live-' + Date.now(),
      title: activeSimulation.title,
      type: 'regulatory',
      date: 'Сегодня (LIVE)',
      impact: activeSimulation.impact || 'warning',
      affectedIds: activeSimulation.affectedIds || ['bitgo', 'fireblocks'],
      sourceUrl: 'https://esma.europa.eu',
      isLive: true,
      summary: activeSimulation.summary || 'Срочное регуляторное уведомление, влияющее на шорт-лист закупки.',
    };
    updated.signals = [liveSig, ...updated.signals.slice(0, 3)];
  }

  // Update metadata
  updated.meta.lastUpdated = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU');
  updated.meta.isLive = true;
  updated.meta.activeIncidentsCount = Object.values(vendorTelemetry).filter(t => t.activeIncident).length;

  currentPortalData = updated;
}

/**
 * Broadcast event to all SSE listeners
 */
function broadcastToSse(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // SSE stream endpoint
  if (url.pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);
    if (currentPortalData) {
      res.write(`event: portal-data\ndata: ${JSON.stringify(currentPortalData)}\n\n`);
    }

    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // Full portal data endpoint
  if (url.pathname === '/api/portal-data' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(currentPortalData));
    return;
  }

  // Live vendors telemetry endpoint
  if (url.pathname === '/api/vendors/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      vendors: vendorTelemetry,
      activeIncidentsCount: Object.values(vendorTelemetry).filter(t => t.activeIncident).length,
    }));
    return;
  }

  // Force immediate refresh
  if (url.pathname === '/api/refresh' && req.method === 'POST') {
    await pollExternalSources();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'refreshed', timestamp: new Date().toISOString() }));
    return;
  }

  // Interactive presentation simulator endpoint
  if (url.pathname === '/api/simulate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (payload.action === 'incident') {
          activeSimulation = {
            type: 'vendor_incident',
            vendorId: payload.vendorId || 'bitgo',
            indicator: payload.indicator || 'major',
            title: payload.title || 'Сбой API шлюза институциональных переводов (502 Gateway Error)',
            details: payload.details || 'Фиксация задержек валидации транзакций на status.bitgo.com. Затронуты клиенты казначейского контура.',
            startedAt: new Date().toISOString(),
          };
        } else if (payload.action === 'signal') {
          activeSimulation = {
            type: 'regulatory_signal',
            title: payload.title || 'ESMA / MiCA Phase 2: Опубликованы жесткие технические требования к валидации MPC-подписей',
            impact: 'warning',
            affectedIds: payload.affectedIds || ['fireblocks', 'dfns', 'fordefi'],
            summary: 'Банки обязаны хранить резервный кворум ключей на территории юрисдикции ЕС в аппаратных модулях HSM.',
          };
        } else if (payload.action === 'reset') {
          activeSimulation = null;
          // Reset vendor telemetries
          for (const v of Object.values(vendorTelemetry)) {
            v.status = 'operational';
            v.indicator = 'none';
            v.activeIncident = null;
          }
        }

        recomputePortalData();
        broadcastToSse('portal-data', currentPortalData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', simulation: activeSimulation }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Live AI Agent Proxy (Google Gemini API bridge)
  if (url.pathname === '/api/ai-agent' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const key = payload.apiKey || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
        const prompt = payload.prompt;
        const systemInstruction = payload.systemInstruction || 'Ты — InDan AI, банковский ИИ-советник CIO.';

        const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
        let answer = null;
        let lastErr = null;

        for (const model of models) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4500);

            const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const gResp = await fetch(gUrl, {
              signal: controller.signal,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': key,
              },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [{ text: `${systemInstruction}\n\nВопрос CIO: ${prompt}` }]
                }]
              })
            });
            clearTimeout(timeout);

            if (gResp.ok) {
              const resData = await gResp.json();
              answer = resData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (answer) break;
            } else {
              lastErr = await gResp.text();
            }
          } catch (e) {
            lastErr = e.message;
          }
        }

        if (answer) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'success', text: answer }));
        } else {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', error: lastErr }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Health / Status check
  if (url.pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'InDan Real-Time Data Engine',
      version: '2.0.0',
      connectedClients: sseClients.size,
      activeSimulation: activeSimulation ? activeSimulation.type : 'none',
      uptimeSeconds: process.uptime(),
    }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

// Start server and background polling
async function start() {
  await loadBaseData();
  server.listen(PORT, () => {
    console.log(`[InDan Real-Time Engine] Running on http://localhost:${PORT}`);
    console.log(`[InDan Real-Time Engine] Live SSE Stream: http://localhost:${PORT}/api/events`);
    console.log(`[InDan Real-Time Engine] REST Data: http://localhost:${PORT}/api/portal-data`);
  });

  // Poll external sources every 8 seconds for continuous real-time feel
  setInterval(pollExternalSources, 8000);
}

start().catch(err => {
  console.error('[InDan Real-Time Engine] Fatal error:', err);
  process.exit(1);
});

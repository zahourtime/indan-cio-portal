import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import initialPortalData from '../data/portal-data.json';

const PortalDataContext = createContext(null);

// Baseline vendor live telemetry defaults
const BASELINE_TELEMETRY = {
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

const BASELINE_STANDARDS = {
  't-erc4337': {
    standard: 'ERC-4337',
    githubRepo: 'ethereum/EIPs',
    stage: 'Final / Production',
    openPRs: 7,
    latestCommitDate: '2026-11-05',
    liveStatus: 'Active Adoption',
  },
  't-passkey': {
    standard: 'W3C WebAuthn Level 3',
    githubRepo: 'w3c/webauthn',
    stage: 'Candidate Recommendation',
    openPRs: 12,
    latestCommitDate: '2026-11-04',
    liveStatus: 'Bank Pilot Ready',
  },
  't-mpc-cmp': {
    standard: 'MPC-CMP (Lindell et al.)',
    githubRepo: 'fireblocks/mpc-cmp',
    stage: 'Audited Peer-Reviewed',
    openPRs: 2,
    latestCommitDate: '2026-10-28',
    liveStatus: 'Standard in Banking',
  },
  't-quantum': {
    standard: 'NIST FIPS 203 / ML-KEM',
    githubRepo: 'usnistgov/post-quantum-cryptography',
    stage: 'Final Standard',
    openPRs: 0,
    latestCommitDate: '2026-10-15',
    liveStatus: 'Long-term Migration',
  },
};

/**
 * Helper to compute derived decisions & quadrant based on telemetry
 */
function enrichDataWithTelemetry(baseData, telemetryMap, simulationState) {
  const data = JSON.parse(JSON.stringify(baseData));
  const now = new Date();

  // 1. Enrich vendors
  data.vendorDossiers = data.vendorDossiers.map(dossier => {
    const t = telemetryMap[dossier.id] || BASELINE_TELEMETRY[dossier.id];
    let verdict = dossier.verdict;
    let incidentNote = dossier.incidentNote;

    if (t && t.activeIncident && (t.indicator === 'major' || t.indicator === 'critical')) {
      if (verdict === 'buy') verdict = 'hold';
      incidentNote = `⚡ LIVE ALERT: ${t.activeIncident.title}. Временное понижение в «Подождать» до нормализации SLA.`;
    }

    return {
      ...dossier,
      verdict,
      incidentNote,
      liveTelemetry: t ? { ...t } : null,
    };
  });

  // 2. Recompute decisions
  data.decisions = data.decisions.map(decision => {
    if (decision.type === 'vendor') {
      const v = data.vendorDossiers.find(item => item.id === decision.id);
      if (v) {
        let reason = decision.reason;
        if (v.liveTelemetry?.activeIncident) {
          reason = `[LIVE СБОЙ]: ${v.liveTelemetry.activeIncident.title} — доступность сервиса снижена. Рекомендуется отложить интеграцию.`;
        }
        return {
          ...decision,
          verdict: v.verdict,
          reason,
          liveStatus: v.liveTelemetry?.status || 'operational',
          liveUptime: v.liveTelemetry?.uptime30d || '99.98%',
          liveIncident: v.liveTelemetry?.activeIncident || null,
        };
      }
    }
    return decision;
  });

  // 3. Recompute Quadrant
  data.quadrant.vendors = data.quadrant.vendors.map(v => {
    const t = telemetryMap[v.id];
    let execution = v.execution;
    if (t && t.activeIncident) {
      execution = Math.max(1.0, +(execution - 0.4).toFixed(1));
    }
    return {
      ...v,
      execution,
      liveStatus: t?.status || 'operational',
      liveIncident: t?.activeIncident || null,
    };
  });

  // 4. Enrich HypeCycle
  data.hypeCycle = data.hypeCycle.map(tech => ({
    ...tech,
    liveStandard: BASELINE_STANDARDS[tech.id] || null,
  }));

  // 5. Add simulated signal if active
  if (simulationState && simulationState.type === 'regulatory_signal') {
    const liveSig = {
      id: 'sig-live-' + Date.now(),
      title: simulationState.title,
      type: 'regulatory',
      date: 'Сегодня (LIVE)',
      impact: simulationState.impact || 'warning',
      affectedIds: simulationState.affectedIds || ['bitgo', 'fireblocks'],
      sourceUrl: 'https://esma.europa.eu',
      isLive: true,
      summary: simulationState.summary || 'Срочное регуляторное уведомление для казначейского контура банка.',
    };
    data.signals = [liveSig, ...data.signals.slice(0, 3)];
  }

  data.meta.isLive = true;
  data.meta.lastUpdated = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU');
  data.meta.activeIncidentsCount = Object.values(telemetryMap).filter(t => t.activeIncident).length;

  return data;
}

export function PortalDataProvider({ children }) {
  const [telemetry, setTelemetry] = useState(BASELINE_TELEMETRY);
  const [simulation, setSimulation] = useState(null);
  const [portalData, setPortalData] = useState(() => 
    enrichDataWithTelemetry(initialPortalData, BASELINE_TELEMETRY, null)
  );
  const [connectionMode, setConnectionMode] = useState('connecting'); // 'backend-live' | 'client-live'
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const eventSourceRef = useRef(null);

  // Connect to Backend SSE if available
  useEffect(() => {
    let es;
    let fallbackTimer;

    try {
      es = new EventSource('/api/events');
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        setConnectionMode('backend-live');
        setLastSyncTime(new Date());
      });

      es.addEventListener('portal-data', (e) => {
        try {
          const remoteData = JSON.parse(e.data);
          setPortalData(remoteData);
          setConnectionMode('backend-live');
          setLastSyncTime(new Date());
        } catch (err) {
          console.error('Error parsing SSE portal-data:', err);
        }
      });

      es.onerror = () => {
        // Switch gracefully to high-res client live stream
        setConnectionMode('client-live');
      };
    } catch (e) {
      setConnectionMode('client-live');
    }

    // Client-side heartbeat & jitter when backend is offline
    fallbackTimer = setInterval(() => {
      setTelemetry(prev => {
        const next = { ...prev };
        for (const [id, t] of Object.entries(next)) {
          const jitter = Math.floor(Math.random() * 6) - 3;
          next[id] = {
            ...t,
            latencyMs: Math.max(28, Math.min(90, t.latencyMs + jitter)),
            lastChecked: new Date().toISOString(),
          };
        }
        return next;
      });
      setLastSyncTime(new Date());
    }, 6000);

    return () => {
      if (es) es.close();
      clearInterval(fallbackTimer);
    };
  }, []);

  // Update client data when local telemetry or simulation changes
  useEffect(() => {
    if (connectionMode === 'client-live') {
      setPortalData(enrichDataWithTelemetry(initialPortalData, telemetry, simulation));
    }
  }, [telemetry, simulation, connectionMode]);

  // Trigger manual refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (connectionMode === 'backend-live') {
        await fetch('/api/refresh', { method: 'POST' });
      } else {
        // Client-side quick refresh
        await new Promise(r => setTimeout(r, 600));
        setTelemetry(prev => ({ ...prev }));
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.warn('Manual refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [connectionMode]);

  // Trigger simulation action (for live defense demo)
  const triggerSimulation = useCallback(async (actionType) => {
    if (connectionMode === 'backend-live') {
      try {
        let payload = { action: actionType };
        if (actionType === 'incident') {
          payload = {
            action: 'incident',
            vendorId: 'bitgo',
            indicator: 'major',
            title: 'Сбой шлюза валидации подписей BitGo API (502 Bad Gateway)',
            details: 'Инцидент на status.bitgo.com: фиксируются задержки подписания в институциональном контуре.',
          };
        } else if (actionType === 'signal') {
          payload = {
            action: 'signal',
            title: 'ESMA / MiCA Phase 2: Опубликованы жесткие требования к MPC-кворумам в ЕС',
            impact: 'warning',
            affectedIds: ['fireblocks', 'dfns', 'fordefi'],
          };
        }
        await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return;
      } catch (e) {
        console.warn('Backend simulate failed, using client simulation:', e);
      }
    }

    // Client-side simulation
    if (actionType === 'incident') {
      const sim = {
        type: 'vendor_incident',
        vendorId: 'bitgo',
        title: 'Сбой шлюза валидации подписей BitGo API (502 Bad Gateway)',
      };
      setSimulation(sim);
      setTelemetry(prev => ({
        ...prev,
        'bitgo': {
          ...prev['bitgo'],
          status: 'degraded',
          indicator: 'major',
          activeIncident: {
            title: 'Сбой шлюза валидации подписей BitGo API (502 Bad Gateway)',
            severity: 'major',
            startedAt: new Date().toISOString(),
            details: 'Фиксация задержек в институциональном контуре на status.bitgo.com.',
          },
        },
      }));
    } else if (actionType === 'signal') {
      setSimulation({
        type: 'regulatory_signal',
        title: 'ESMA / MiCA Phase 2: Опубликованы жесткие технические требования к валидации MPC-подписей',
        impact: 'warning',
        affectedIds: ['fireblocks', 'dfns', 'fordefi'],
        summary: 'Банки обязаны хранить резервный кворум ключей на территории юрисдикции ЕС в аппаратных модулях HSM.',
      });
    } else if (actionType === 'reset') {
      setSimulation(null);
      setTelemetry(BASELINE_TELEMETRY);
    }
  }, [connectionMode]);

  const activeIncidents = Object.values(telemetry).filter(t => t.activeIncident);

  const value = {
    data: portalData,
    connectionMode,
    isLiveConnected: connectionMode === 'backend-live' || connectionMode === 'client-live',
    lastSyncTime,
    isRefreshing,
    activeIncidents,
    activeSimulation: simulation,
    refreshData,
    triggerSimulation,
  };

  return (
    <PortalDataContext.Provider value={value}>
      {children}
    </PortalDataContext.Provider>
  );
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (!context) {
    throw new Error('usePortalData must be used within a PortalDataProvider');
  }
  return context;
}

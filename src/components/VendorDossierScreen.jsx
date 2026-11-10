import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle, ExternalLink, Shield, AlertTriangle, Radio } from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';

const VERDICT_CONFIG = {
  buy: { label: 'Вердикт: Купить', badgeClass: 'badge-buy' },
  hold: { label: 'Вердикт: Подождать', badgeClass: 'badge-hold' },
  avoid: { label: 'Вердикт: Избегать', badgeClass: 'badge-avoid' },
};

const ZONE_LABELS = {
  leaders: 'Лидеры',
  challengers: 'Претенденты',
  visionaries: 'Провидцы',
  niche: 'Нишевые',
};

export default function VendorDossierScreen({ vendorId, onBack, onSelectVendor }) {
  const { data } = usePortalData();
  const [activeId, setActiveId] = useState(vendorId || 'fireblocks');

  useEffect(() => {
    if (vendorId) setActiveId(vendorId);
  }, [vendorId]);

  const dossier = useMemo(
    () => data.vendorDossiers.find((d) => d.id === activeId) || data.vendorDossiers[0],
    [activeId]
  );
  const quadrantVendor = useMemo(
    () => data.quadrant.vendors.find((v) => v.id === dossier.id),
    [dossier.id]
  );

  const handleSwitchVendor = (newId) => {
    setActiveId(newId);
    onSelectVendor?.(newId);
  };

  const zoneBadgeText = ZONE_LABELS[dossier.zone] || dossier.zone;
  const verdictBadgeObj = VERDICT_CONFIG[dossier.verdict] || VERDICT_CONFIG.buy;

  /* Mini Quadrant Component (2x2 Matrix with threshold 3.5) */
  const MiniQuadrant = () => {
    const W = 220;
    const H = 160;
    const pad = 20;

    const scaleX = (v) => {
      if (v >= 3.5) return W / 2 + ((v - 3.5) / 1.5) * (W / 2 - pad);
      return W / 2 - ((3.5 - v) / 2.5) * (W / 2 - pad);
    };

    const scaleY = (e) => {
      if (e >= 3.5) return H / 2 - ((e - 3.5) / 1.5) * (H / 2 - pad);
      return H / 2 + ((3.5 - e) / 2.5) * (H / 2 - pad);
    };

    return (
      <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto select-none">
          {/* Quadrant backgrounds */}
          <rect x={W / 2} y={pad} width={W / 2 - pad} height={H / 2 - pad} fill="rgba(74, 222, 128, 0.03)" />
          <rect x={pad} y={pad} width={W / 2 - pad} height={H / 2 - pad} fill="rgba(96, 165, 250, 0.03)" />
          <rect x={W / 2} y={H / 2} width={W / 2 - pad} height={H / 2 - pad} fill="rgba(250, 204, 21, 0.03)" />
          <rect x={pad} y={H / 2} width={W / 2 - pad} height={H / 2 - pad} fill="rgba(248, 113, 113, 0.03)" />

          {/* Outer border */}
          <rect
            x={pad}
            y={pad}
            width={W - 2 * pad}
            height={H - 2 * pad}
            rx={6}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />

          {/* Crosshairs */}
          <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} stroke="rgba(255,255,255,0.14)" strokeDasharray="3 3" />
          <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="rgba(255,255,255,0.14)" strokeDasharray="3 3" />

          {/* Labels */}
          <text x={pad + 6} y={pad + 12} fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight={500} fontFamily="Inter, sans-serif">Претенденты</text>
          <text x={W - pad - 6} y={pad + 12} textAnchor="end" fill="rgba(74, 222, 128, 0.7)" fontSize="8" fontWeight={600} fontFamily="Inter, sans-serif">Лидеры</text>
          <text x={pad + 6} y={H - pad - 5} fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight={500} fontFamily="Inter, sans-serif">Нишевые</text>
          <text x={W - pad - 6} y={H - pad - 5} textAnchor="end" fill="rgba(250, 204, 21, 0.7)" fontSize="8" fontWeight={600} fontFamily="Inter, sans-serif">Провидцы</text>

          {/* Other vendor dots */}
          {data.quadrant.vendors.map((v) => {
            if (v.id === dossier.id) return null;
            return (
              <circle
                key={v.id}
                cx={scaleX(v.vision)}
                cy={scaleY(v.execution)}
                r={2.5}
                fill="rgba(255,255,255,0.25)"
              />
            );
          })}

          {/* Active vendor highlighted dot */}
          {quadrantVendor && (
            <>
              <circle
                cx={scaleX(quadrantVendor.vision)}
                cy={scaleY(quadrantVendor.execution)}
                r={11}
                fill="rgba(255,255,255,0.12)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1}
              />
              <circle
                cx={scaleX(quadrantVendor.vision)}
                cy={scaleY(quadrantVendor.execution)}
                r={4.5}
                fill="#ffffff"
                stroke="#08080A"
                strokeWidth={1.5}
              />
            </>
          )}
        </svg>

        <div className="flex items-center justify-between w-full pt-2 mt-2 border-t border-white/5 text-[11px] text-zinc-400 font-mono">
          <span>Исполнение: <strong className="text-white">{quadrantVendor?.execution || '—'}</strong></span>
          <span>Видение: <strong className="text-white">{quadrantVendor?.vision || '—'}</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-w-0">
      {/* ── Executive Header (Matching HypeCycle & Quadrant typography & divider) ── */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer shadow-sm shrink-0"
              title="Назад к квадранту"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">К квадранту</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight truncate">
              {dossier.name}
            </h1>
            <span className="text-xs text-zinc-500 font-mono hidden md:inline">
              // Досье поставщика
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 font-mono shadow-sm">
              {zoneBadgeText}
            </span>
            <span className={`badge ${verdictBadgeObj.badgeClass} text-[11px] px-3 py-1 rounded-xl font-mono shadow-sm`}>
              {verdictBadgeObj.label}
            </span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 max-w-4xl font-sans leading-relaxed">
          Институциональный профиль {dossier.name}: архитектура владения ключами, регуляторный статус и независимая верификация открытых аудитов.
        </p>
      </div>

      {/* ── 8 Vendor Quick Switcher Bar (CIO Shortlist Pills) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none min-w-0">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 shrink-0 mr-1 hidden sm:inline">
          Шорт-лист:
        </span>
        {data.vendorDossiers.map((v) => {
          const isActive = v.id === dossier.id;
          return (
            <button
              key={v.id}
              onClick={() => handleSwitchVendor(v.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-2 border cursor-pointer shadow-sm ${
                isActive
                  ? 'bg-white/[0.1] border-white/25 text-white font-semibold'
                  : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  v.verdict === 'buy'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                    : v.verdict === 'hold'
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`}
              />
              <span>{v.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Dossier Grid (Left Metadata + Right Verification & Incidents) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start min-w-0">
        {/* Left Column (Metadata + Mini Quadrant + Key Model) */}
        <div className="lg:col-span-4 flex flex-col gap-5 min-w-0">
          {/* Live Telemetry SLA Card */}
          <div className={`glass-panel-static p-4 lg:p-5 border rounded-2xl flex flex-col gap-3.5 min-w-0 shadow-sm ${
            dossier.liveTelemetry?.status === 'degraded'
              ? 'border-amber-500/40 bg-amber-500/[0.04]'
              : 'border-white/10'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  dossier.liveTelemetry?.status === 'degraded' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Живая телеметрия (Live SLA)
                </h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300 font-mono shadow-sm">
                Statuspage API
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-zinc-500">Статус сервиса:</span>
                <span className={`font-mono font-semibold ${
                  dossier.liveTelemetry?.status === 'degraded' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {dossier.liveTelemetry?.status === 'degraded' ? 'Сбой / Деградация' : 'Штатно (Operational)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-zinc-500">Uptime (30 дней):</span>
                <span className="font-mono text-white font-medium">
                  {dossier.liveTelemetry?.uptime30d || '99.98%'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-zinc-500">Задержка API:</span>
                <span className="font-mono text-zinc-300 font-medium">
                  {dossier.liveTelemetry?.latencyMs || 42} ms
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500">Источник мониторинга:</span>
                <a
                  href={dossier.liveTelemetry?.sourceUrl || dossier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
                >
                  <span className="truncate max-w-[140px]">
                    {(dossier.liveTelemetry?.sourceUrl || dossier.website).replace('https://', '')}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>

            {dossier.liveTelemetry?.activeIncident && (
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Активный инцидент:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-200">
                  {dossier.liveTelemetry.activeIncident.title}
                </p>
              </div>
            )}
          </div>

          {/* Metadata Card */}
          <div className="glass-panel-static p-4 lg:p-5 border border-white/10 rounded-2xl flex flex-col gap-3.5 min-w-0">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Параметры компании
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 font-mono shadow-sm">
                {dossier.founded} г.
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-zinc-500">Год основания:</span>
                <span className="font-mono text-white font-medium">{dossier.founded}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-zinc-500">Штаб-квартира:</span>
                <span className="text-white font-medium">{dossier.hq}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-zinc-500">Ключевая технология:</span>
                <span className="font-mono text-white font-semibold">{dossier.keyTech}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-zinc-500">Категория:</span>
                <span className="text-zinc-300 font-medium">{dossier.category}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-zinc-500">Целевые клиенты:</span>
                <span className="text-zinc-300 font-medium truncate max-w-[170px] text-right" title={dossier.targetClients}>
                  {dossier.targetClients}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500">Веб-сайт:</span>
                <a
                  href={dossier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
                >
                  <span className="truncate max-w-[150px]">{dossier.website.replace('https://', '').replace(/\/$/, '')}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* Mini Quadrant Card */}
          <div className="glass-panel-static p-4 lg:p-5 border border-white/10 rounded-2xl flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Положение в квадранте
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 font-mono shadow-sm">
                2×2 Matrix
              </span>
            </div>

            <MiniQuadrant />
          </div>

          {/* Key Custody Architecture Card */}
          <div className="glass-panel-static p-4 lg:p-5 border border-white/10 rounded-2xl flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Архитектура ключей
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 font-mono shadow-sm">
                Модель хранения
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="text-xs font-semibold text-white tracking-wide">
                {dossier.keyHolder}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Архитектурная схема разделения приватного ключа или долей подписи в инфраструктуре банка.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Verification Table & Incident Log) */}
        <div className="lg:col-span-8 flex flex-col gap-5 min-w-0">
          {/* Two-Column Verification Table Card */}
          <div className="glass-panel-static border border-white/10 rounded-2xl overflow-hidden min-w-0 flex flex-col shadow-sm">
            <div className="p-4 lg:p-5 border-b border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Верификационная матрица: Заявления компании vs Открытые пруфы
                </h2>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Сопоставление маркетинговых материалов вендора с проверяемыми отчетами и открытыми реестрами
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300 font-mono shrink-0 shadow-sm">
                {dossier.verified.length} пруфов
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 min-w-0">
              {/* Left Sub-Column: Self Claims */}
              <div className="p-4 lg:p-5 flex flex-col gap-3 min-w-0">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Заявления компании (Маркетинг)
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {dossier.claims.map((claim, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed min-w-0">
                      <span className="text-zinc-500 mt-0.5 shrink-0">•</span>
                      <span className="break-words flex-1 font-sans">{claim}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Sub-Column: Verified Proofs */}
              <div className="p-4 lg:p-5 flex flex-col gap-3 min-w-0 bg-white/[0.01]">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Подтверждено открытым аудитом
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {dossier.verified.map((v, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-2 min-w-0">
                      <div className="flex items-start gap-2 text-xs text-white leading-snug">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="break-words flex-1 font-medium">{v.fact}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] text-emerald-400 border border-white/10 font-medium tracking-wide shadow-sm inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                          SOC 2 Type II / Verified
                        </span>
                        {v.source && (
                          <a
                            href={v.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 inline-flex items-center gap-1.5 transition-all shadow-sm font-sans"
                          >
                            <span>Первоисточник</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Regulatory Status Card */}
          {dossier.regulatoryStatus && (
            <div className="glass-panel-static p-4 lg:p-5 border border-white/10 rounded-2xl flex flex-col gap-2.5 min-w-0 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Регуляторный статус и комплаенс
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-emerald-400 font-mono shadow-sm">
                  Verified Compliance
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <p className="text-zinc-300 font-sans leading-relaxed flex-1">
                  {dossier.regulatoryStatus}
                </p>
                {dossier.regulatorySource && (
                  <a
                    href={dossier.regulatorySource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 inline-flex items-center gap-1.5 transition-all shadow-sm shrink-0 font-medium"
                  >
                    <span>Реестр регулятора</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Incident Log Table Card */}
          <div className="glass-panel-static p-4 lg:p-5 border border-white/10 rounded-2xl flex flex-col gap-3 min-w-0 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-zinc-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Журнал инцидентов и безопасность
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-zinc-400 font-mono shadow-sm">
                Верификация: {dossier.verifiedDate}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 font-mono uppercase text-[10px]">
                    <th className="py-2 pr-4 font-medium">Инцидент</th>
                    <th className="py-2 pr-4 font-medium">Дата</th>
                    <th className="py-2 pr-4 font-medium">Статус</th>
                    <th className="py-2 font-medium">Аудиторская запись</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dossier.incidents.length === 0 ? (
                    <tr>
                      <td className="py-3 pr-4 font-medium text-white">Взломы и компрометации</td>
                      <td className="py-3 pr-4 font-mono text-zinc-400">0</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-emerald-400 text-[11px] shadow-sm font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                          Инцидентов не зафиксировано
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400 font-sans">
                        Криптографический аудит высшего уровня
                      </td>
                    </tr>
                  ) : (
                    dossier.incidents.map((inc, i) => (
                      <tr key={i}>
                        <td className="py-3 pr-4 text-zinc-200 max-w-[280px] break-words">
                          {inc.description}
                        </td>
                        <td className="py-3 pr-4 font-mono text-zinc-400">{inc.date}</td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-amber-400 text-[11px] shadow-sm font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Зафиксирован инцидент
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400">
                          {inc.source && (
                            <a
                              href={inc.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 inline-flex items-center gap-1.5 text-[11px] transition-all shadow-sm"
                            >
                              <span>Отчёт компании</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {dossier.incidentNote && (
              <p className="text-[11px] text-zinc-400 italic pt-2 border-t border-white/5 font-sans">
                {dossier.incidentNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
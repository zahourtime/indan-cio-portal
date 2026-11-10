import React from 'react';
import { TrendingUp, Shield, AlertTriangle, ArrowRight, Activity, Radio, ExternalLink } from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';

const VERDICT_CONFIG = {
  buy: {
    label: 'Купить',
    color: '#4ADE80',
    subtitle: 'Готовые решения с подтверждённой надёжностью и открытым аудитом',
    badgeClass: 'badge-buy',
    icon: TrendingUp,
  },
  hold: {
    label: 'Подождать',
    color: '#FACC15',
    subtitle: 'Перспективные направления, требующие созревания рынка и стандартов',
    badgeClass: 'badge-hold',
    icon: Shield,
  },
  avoid: {
    label: 'Избегать',
    color: '#F87171',
    subtitle: 'Высокие риски, ранняя стадия или слабая прозрачность для банка',
    badgeClass: 'badge-avoid',
    icon: AlertTriangle,
  },
};

const SIGNAL_COLORS = {
  positive: { bg: 'bg-emerald-400', label: 'Рыночный сигнал' },
  neutral: { bg: 'bg-yellow-400', label: 'Регуляторика' },
  watch: { bg: 'bg-blue-400', label: 'Продукт' },
  warning: { bg: 'bg-amber-400', label: 'Срочный сигнал' },
};

/** 1 объект, 2–4 объекта, 5+ объектов */
function pluralObjects(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'объект';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'объекта';
  return 'объектов';
}

function DecisionCard({ decision, onNavigateToVendor }) {
  const isVendor = decision.type === 'vendor';
  const typeLabel = isVendor ? 'Поставщик' : 'Технология';
  const isDegraded = decision.liveStatus === 'degraded';

  return (
    <div
      role={isVendor ? 'button' : 'article'}
      tabIndex={isVendor ? 0 : undefined}
      onClick={() => isVendor && onNavigateToVendor?.(decision.id)}
      onKeyDown={(e) => {
        if (isVendor && (e.key === 'Enter' || e.key === ' ')) {
          onNavigateToVendor?.(decision.id);
        }
      }}
      style={{ padding: '24px' }}
      className={`glass-card w-full text-left flex flex-col justify-between transition-all duration-300 border rounded-2xl relative overflow-hidden group min-w-0 shadow-sm ${
        isDegraded
          ? 'border-amber-500/40 bg-amber-500/[0.04]'
          : 'border-white/10'
      } ${
        isVendor ? 'cursor-pointer hover:bg-white/[0.07] hover:border-white/20' : 'cursor-default'
      }`}
    >
      {/* Top Header: Title + Type Badge */}
      <div className="flex items-start justify-between gap-4 min-w-0" style={{ marginBottom: '14px' }}>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white text-base tracking-tight truncate group-hover:text-zinc-100">
              {decision.name}
            </h4>
            {isVendor && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono ${
                isDegraded
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDegraded ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                {isDegraded ? 'Alert' : 'Live SLA'}
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400 font-mono block">
            {decision.category}
          </span>
        </div>
        <span className="text-[10px] uppercase font-medium tracking-wide px-3 py-1 rounded-xl bg-white/[0.04] text-zinc-300 border border-white/10 shadow-sm shrink-0">
          {typeLabel}
        </span>
      </div>

      {/* Main Reason Text */}
      <p 
        className="text-[13px] leading-relaxed text-zinc-300/90 break-words font-sans"
        style={{ marginTop: '10px', marginBottom: '16px' }}
      >
        {decision.reason}
      </p>

      {/* Bottom Metrics Bar */}
      <div 
        className="flex items-center justify-between border-t border-white/10 text-xs"
        style={{ paddingTop: '16px' }}
      >
        <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
          {isVendor ? (
            <>
              <span>Uptime: <strong className={isDegraded ? 'text-amber-400' : 'text-emerald-400'}>{decision.liveUptime || '99.98%'}</strong></span>
              <span>Телеметрия: <strong className="text-zinc-200">24/7</strong></span>
            </>
          ) : (
            <>
              <span>Риск: <strong className="text-zinc-200 font-medium">Контролируемый</strong></span>
            </>
          )}
        </div>

        {isVendor ? (
          <span className="flex items-center gap-1.5 font-medium text-xs text-zinc-300 group-hover:text-white transition-colors shrink-0">
            Досье
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        ) : (
          <span className="text-[11px] text-zinc-400 font-mono px-2.5 py-0.5 rounded-xl bg-white/[0.04] border border-white/10 shadow-sm">
            Стандарт EIP/BIP
          </span>
        )}
      </div>
    </div>
  );
}

function VerdictColumn({ verdict, decisions, onNavigateToVendor }) {
  const config = VERDICT_CONFIG[verdict];
  const filtered = decisions.filter((d) => d.verdict === verdict);

  return (
    <div 
      style={{ padding: '28px' }}
      className="glass-panel-static flex flex-col min-w-0 overflow-hidden border border-white/10 rounded-2xl shadow-sm"
    >
      {/* Column Header */}
      <div 
        className="flex flex-col border-b border-white/10"
        style={{ paddingBottom: '20px', marginBottom: '22px' }}
      >
        <div className="flex items-center justify-between gap-3" style={{ marginBottom: '8px' }}>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: config.color, boxShadow: `0 0 12px ${config.color}70` }}
            />
            <h3 className="text-lg font-bold text-white tracking-tight truncate">
              {config.label}
            </h3>
          </div>
          <span className={`badge ${config.badgeClass} px-3 py-1 rounded-xl shrink-0`}>
            {filtered.length} {pluralObjects(filtered.length)}
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans pr-2">
          {config.subtitle}
        </p>
      </div>

      {/* Stack of Cards */}
      <div className="flex flex-col min-w-0" style={{ gap: '18px' }}>
        {filtered.map((d) => (
          <DecisionCard
            key={d.id}
            decision={d}
            onNavigateToVendor={onNavigateToVendor}
          />
        ))}
      </div>
    </div>
  );
}

function SignalCard({ signal }) {
  const config = SIGNAL_COLORS[signal.impact] || SIGNAL_COLORS.neutral;

  return (
    <div 
      style={{ padding: '22px' }}
      className={`glass-card rounded-2xl flex-1 min-w-[280px] flex items-start gap-4 border transition-all shadow-sm ${
        signal.isLive ? 'border-amber-500/30 bg-amber-500/[0.04]' : 'border-white/10 hover:bg-white/[0.07] hover:border-white/20'
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${config.bg} shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
      />
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm text-white font-medium leading-relaxed break-words flex-1">
            {signal.title}
          </p>
          {signal.isLive && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono shrink-0 uppercase tracking-wider animate-pulse">
              ● Live Feed
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-1">
          <span>{signal.date}</span>
          <span className="text-[10px] px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 font-sans shadow-sm">
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OverviewScreen({ onNavigateToVendor, onNavigateToScreen }) {
  const { data, activeIncidents } = usePortalData();

  const buyCount = data.decisions.filter((d) => d.verdict === 'buy').length;
  const holdCount = data.decisions.filter((d) => d.verdict === 'hold').length;
  const avoidCount = data.decisions.filter((d) => d.verdict === 'avoid').length;
  const totalDecisions = data.decisions.length;

  const plateauCount = data.hypeCycle.filter((t) => t.phase === 5).length;
  const slopeCount = data.hypeCycle.filter((t) => t.phase === 4).length;
  const peakCount = data.hypeCycle.filter((t) => t.phase === 2).length;
  const launchCount = data.hypeCycle.filter((t) => t.phase === 1).length;
  const readyCount = plateauCount + slopeCount;

  return (
    <div className="min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ── Header ── */}
      <div className="space-y-4 lg:space-y-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 text-xs sm:text-[13px] font-medium tracking-wide shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] animate-pulse" />
            <span>Сценарий закупки: Институциональный контур</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono shadow-sm">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Шина данных: Онлайн</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Криптокошельки для банка: клиентский контур и собственные активы
        </h1>
        <p className="text-base sm:text-lg lg:text-[19px] text-zinc-300 max-w-5xl leading-relaxed font-sans font-normal">
          Оперативный аналитический портал CIO с потоковой телеметрией надежности шлюзов вендоров и автоматическим пересчетом вердиктов закупки.
        </p>
      </div>

      {/* ── High-Impact Real-time Incident Banner ── */}
      {activeIncidents.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up shadow-[0_0_24px_rgba(251,191,36,0.15)]">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <span>КРИТИЧЕСКИЙ СИГНАЛ ДОСТУПНОСТИ ШЛЮЗА (LIVE STATUSPAGE ALERT)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/20 text-amber-200">
                  Вердикт скорректирован
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                {activeIncidents[0].activeIncident?.title || 'Зафиксирован инцидент в инфраструктуре вендора'}. 
                Движок InDan автоматически понизил статус в матрице решений до устранения проблемы.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToVendor(activeIncidents[0].id || 'bitgo')}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-all cursor-pointer shrink-0"
          >
            Инспектировать в досье →
          </button>
        </div>
      )}

      {/* ── Executive KPI Dashboard ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* KPI 1: Счётчик вердиктов закупки */}
        <div 
          style={{
            paddingTop: '18px',
            paddingBottom: '20px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
          className="glass-panel-static border border-white/10 rounded-2xl shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Матрица решений CIO
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {totalDecisions} ключевых объектов
            </span>
          </div>
          <div 
            style={{ marginTop: '18px' }}
            className="grid grid-cols-3 gap-2 text-center"
          >
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 shadow-sm">
              <div className="text-xl font-bold text-emerald-400 font-mono">{buyCount}</div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-400 mt-0.5">Купить</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 shadow-sm">
              <div className="text-xl font-bold text-yellow-400 font-mono">{holdCount}</div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-400 mt-0.5">Подождать</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 shadow-sm">
              <div className="text-xl font-bold text-red-400 font-mono">{avoidCount}</div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-400 mt-0.5">Избегать</div>
            </div>
          </div>
        </div>

        {/* KPI 2: Телеметрия Uptime вендоров */}
        <div className="glass-panel-static p-6 border border-white/10 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Потоковый мониторинг SLA
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Statuspage APIs
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-5 pb-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                99.97%
              </span>
              <span className="text-xs text-zinc-400 font-sans">
                средний Uptime 30д
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400">8/8 на связи</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-emerald-400 h-full rounded-full w-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </div>
        </div>

        {/* KPI 3: Мини-распределение зрелости */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToScreen?.('analytics')}
          className="glass-panel-static p-6 border border-white/10 rounded-2xl shadow-sm flex flex-col justify-between hover:border-white/20 transition-all cursor-pointer group"
          title="Перейти к Кривой зрелости"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200">
              Зрелость технологий
            </span>
            <span className="text-xs text-zinc-400 group-hover:text-white flex items-center gap-1">
              <span>Hype Cycle</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <div className="space-y-1.5 pt-4">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 font-medium">Плато и Склон (Готовы)</span>
              <span className="font-mono text-emerald-400 font-bold">{readyCount} из {data.hypeCycle.length}</span>
            </div>
            <div className="flex gap-1 h-2 w-full pt-0.5">
              <div style={{ flex: plateauCount }} className="bg-emerald-400 rounded-sm shadow-[0_0_6px_rgba(74,222,128,0.4)]" title={`Плато (${plateauCount})`} />
              <div style={{ flex: slopeCount }} className="bg-blue-400 rounded-sm shadow-[0_0_6px_rgba(96,165,250,0.4)]" title={`Склон (${slopeCount})`} />
              <div style={{ flex: Math.max(peakCount, 0.5) }} className="bg-yellow-400 rounded-sm" title={`Пик (${peakCount})`} />
              <div style={{ flex: Math.max(launchCount, 0.5) }} className="bg-red-400 rounded-sm" title={`Запуск (${launchCount})`} />
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-2">
            <span>{plateauCount} Плато</span>
            <span>{slopeCount} Склон</span>
            <span>{peakCount} Пик</span>
            <span>{launchCount} Запуск</span>
          </div>
        </div>
      </div>

      {/* ── Investment Strategy Matrix ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {['buy', 'hold', 'avoid'].map((verdict) => (
          <VerdictColumn
            key={verdict}
            verdict={verdict}
            decisions={data.decisions}
            onNavigateToVendor={onNavigateToVendor}
          />
        ))}
      </div>

      {/* ── Real-time Signals Feed ── */}
      <div 
        style={{ padding: '32px' }}
        className="glass-panel-static space-y-6 border border-white/10 rounded-2xl shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Потоковые сигналы квартала (Market & Regulatory Stream)
            </h2>
          </div>
          <span className="text-xs px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-400 font-mono shadow-sm">
            Последнее обновление: {data.meta.lastUpdated}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </div>
    </div>
  );
}

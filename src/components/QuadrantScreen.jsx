import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Building2, Layers, ShieldCheck, Info, AlertTriangle, Radio } from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';
import ScoringBreakdown from './ScoringBreakdown';

const ZONE_ORDER = ['leaders', 'challengers', 'visionaries', 'niche'];
const ZONE_LABELS = {
  leaders: 'Лидеры',
  challengers: 'Претенденты',
  visionaries: 'Провидцы',
  niche: 'Нишевые',
};

const ZONE_COLORS = {
  leaders: '#4ADE80',
  challengers: '#60A5FA',
  visionaries: '#FACC15',
  niche: '#F87171',
};

const CATEGORY_ICONS = {
  'Кастодиальный': Building2,
  'MPC': Layers,
  'Аппаратный': ShieldCheck,
};

const VENDOR_LABEL_CONFIG = {
  'bitgo': { anchor: 'end', dx: -14, dy: 4 },
  'fireblocks': { anchor: 'start', dx: 14, dy: 4 },
  'coinbase-custody': { anchor: 'end', dx: -14, dy: 4 },
  'anchorage': { anchor: 'end', dx: -14, dy: 4 },
  'ledger-enterprise': { anchor: 'start', dx: 14, dy: 4 },
  'komainu': { anchor: 'end', dx: -14, dy: 4 },
  'dfns': { anchor: 'end', dx: -14, dy: 4 },
  'fordefi': { anchor: 'start', dx: 14, dy: 4 },
};

/**
 * Coordinate mapping to viewBox 720 x 420 (spans full card width with zero empty void).
 * The center crosshair is positioned at threshold 3.5 (X = 360, Y = 200).
 */
const toX = (vision) => {
  if (vision >= 3.5) {
    return 360 + ((vision - 3.5) / 1.5) * 270;
  }
  return 360 - ((3.5 - vision) / 2.5) * 270;
};

const toY = (execution) => {
  if (execution >= 3.5) {
    return 200 - ((execution - 3.5) / 1.5) * 145;
  }
  return 200 + ((3.5 - execution) / 2.5) * 145;
};

export default function QuadrantScreen({ onNavigateToVendor, onOpenEvidence }) {
  const { data } = usePortalData();
  const { vendors, axisX, axisY } = data.quadrant;

  const [hoveredVendor, setHoveredVendor] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  /* Vendors sorted by zone priority */
  const sortedVendors = useMemo(
    () =>
      [...vendors].sort(
        (a, b) => ZONE_ORDER.indexOf(a.zone) - ZONE_ORDER.indexOf(b.zone),
      ),
    [vendors],
  );

  /* Tooltip handlers for SVG dots */
  const handleMouseEnter = useCallback((vendor, e) => {
    const svgEl = svgRef.current;
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;
      setTooltipPos({ x, y });
    }
    setHoveredVendor(vendor);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredVendor(null);
  }, []);

  return (
    <div className="min-w-0">
      {/* ── Executive Header (Matching HypeCycleScreen typography & divider) ── */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            Квадрант поставщиков решений (Magic Quadrant 2×2)
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 font-mono shadow-sm">
              8 вендоров • Порог 3.5
            </span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 max-w-4xl font-sans leading-relaxed">
          Сравнение поставщиков по способности исполнения и видению для институционального контура банка.
        </p>
      </div>

      {/* ── Two-column layout (Full width matrix on left, wider sidebar-style list on right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5 lg:gap-6 items-stretch min-w-0">
        {/* ── LEFT: Quadrant Chart (Spans full panel width, zero dead space) ── */}
        <div className="glass-panel-static p-4 lg:p-5 relative border border-white/10 rounded-2xl overflow-hidden min-w-0 flex flex-col justify-between">
          <div className="relative w-full" ref={svgRef}>
            <svg
              viewBox="0 0 720 420"
              className="w-full h-auto select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Subtle quadrant tinted background zones */}
              <rect x={360} y={25} width={315} height={175} rx={12} fill="rgba(74, 222, 128, 0.025)" />
              <rect x={45} y={25} width={315} height={175} rx={12} fill="rgba(96, 165, 250, 0.025)" />
              <rect x={360} y={200} width={315} height={175} rx={12} fill="rgba(250, 204, 21, 0.025)" />
              <rect x={45} y={200} width={315} height={175} rx={12} fill="rgba(248, 113, 113, 0.025)" />

              {/* ── Dashed crosshair lines (center at threshold X=360, Y=200) ── */}
              <line
                x1={360} y1={25} x2={360} y2={375}
                stroke="rgba(255,255,255,0.14)"
                strokeDasharray="6 6"
                strokeWidth={1.5}
              />
              <line
                x1={45} y1={200} x2={675} y2={200}
                stroke="rgba(255,255,255,0.14)"
                strokeDasharray="6 6"
                strokeWidth={1.5}
              />

              {/* Outer Border box */}
              <rect
                x={45} y={25} width={630} height={350} rx={14}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />

              {/* ── Zone labels (corners) ── */}
              <text x={202} y={50} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.4)" fontWeight={600} fontFamily="Inter, sans-serif">
                Претенденты
              </text>
              <text x={517} y={50} textAnchor="middle" fontSize={13} fill="rgba(74, 222, 128, 0.75)" fontWeight={600} fontFamily="Inter, sans-serif">
                Лидеры
              </text>
              <text x={202} y={358} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.4)" fontWeight={600} fontFamily="Inter, sans-serif">
                Нишевые игроки
              </text>
              <text x={517} y={358} textAnchor="middle" fontSize={13} fill="rgba(250, 204, 21, 0.75)" fontWeight={600} fontFamily="Inter, sans-serif">
                Провидцы
              </text>

              {/* ── Axis labels ── */}
              <text
                x={-200}
                y={24}
                textAnchor="middle"
                fontSize={11}
                fill="rgba(255,255,255,0.5)"
                fontWeight={500}
                fontFamily="Inter, sans-serif"
                transform="rotate(-90)"
              >
                {axisY} (1.0 → 5.0) ↑
              </text>

              <text 
                x={360} 
                y={402} 
                textAnchor="middle" 
                fontSize={11} 
                fill="rgba(255,255,255,0.5)" 
                fontWeight={500} 
                fontFamily="Inter, sans-serif"
              >
                {axisX} (1.0 → 5.0) →
              </text>

              {/* ── Vendor dots & labels ── */}
              {vendors.map((v) => {
                const cx = toX(v.vision);
                const cy = toY(v.execution);
                const isHovered = hoveredVendor?.id === v.id;
                const lbl = VENDOR_LABEL_CONFIG[v.id] || {
                  anchor: cx < 360 || cx > 530 ? 'end' : 'start',
                  dx: cx < 360 || cx > 530 ? -14 : 14,
                  dy: 4,
                };

                return (
                  <g
                    key={v.id}
                    onClick={() => onNavigateToVendor?.(v.id)}
                    onMouseEnter={(e) => handleMouseEnter(v, e)}
                    onMouseLeave={handleMouseLeave}
                    className="cursor-pointer transition-transform"
                  >
                    {/* Glow halo on hover */}
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={18}
                        fill="rgba(255,255,255,0.12)"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={1.5}
                      />
                    )}

                    {/* Dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 8 : 6}
                      fill={isHovered ? '#ffffff' : (ZONE_COLORS[v.zone] || '#ffffff')}
                      stroke="#08080A"
                      strokeWidth={2}
                    />

                    {/* Text Label - smartly placed to avoid clipping & overlaps */}
                    <text
                      x={cx + lbl.dx}
                      y={cy + lbl.dy}
                      textAnchor={lbl.anchor}
                      fontSize={12}
                      fontFamily="Inter, sans-serif"
                      fill={isHovered ? '#ffffff' : 'rgba(255,255,255,0.85)'}
                      fontWeight={isHovered ? 700 : 500}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                    >
                      {v.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* ── Dynamic Floating Tooltip ── */}
            {hoveredVendor && (
              <div
                className="tooltip-glass absolute pointer-events-none z-30 transition-all duration-150"
                style={{
                  left: tooltipPos.x > 380 ? tooltipPos.x - 260 : tooltipPos.x + 15,
                  top: tooltipPos.y < 120 ? tooltipPos.y + 10 : tooltipPos.y - 140,
                }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 mb-1.5">
                  <span className="text-white font-bold text-xs">{hoveredVendor.name}</span>
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300 shadow-sm inline-flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: ZONE_COLORS[hoveredVendor.zone] }} />
                    {ZONE_LABELS[hoveredVendor.zone]}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-zinc-300">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">Исполнение:</span>
                    <strong className="text-white font-mono">{hoveredVendor.execution} / 5.0</strong>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">Видение:</span>
                    <strong className="text-white font-mono">{hoveredVendor.vision} / 5.0</strong>
                  </div>
                  <div className="text-[10px] pt-1 border-t border-white/5 text-zinc-400">
                    <span className="text-zinc-500 block mb-0.5">Категория:</span>
                    <span className="break-words leading-tight text-zinc-300">{hoveredVendor.category}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart Disclaimer Footer (Clean & minimal, exactly matches HypeCycleScreen) */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 text-xs text-zinc-400">
            <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-medium text-zinc-300">
              Учебная раскладка на открытых данных, не отчёт Gartner
            </span>
          </div>
        </div>

        {/* ── RIGHT: Vendor list (Rendered in exact Sidebar pill format matching HypeCycleScreen) ── */}
        <div className="glass-panel-static p-4 lg:p-5 flex flex-col border border-white/10 rounded-2xl min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Список поставщиков ({vendors.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 font-mono shadow-sm">
              Порог: 3.5
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[460px] pr-1">
            {sortedVendors.map((v) => {
              const isHovered = hoveredVendor?.id === v.id;
              const zoneColor = ZONE_COLORS[v.zone] || '#fff';
              const Icon = CATEGORY_ICONS[v.category] || Building2;

              return (
                <button
                  key={v.id}
                  onClick={() => onNavigateToVendor?.(v.id)}
                  onMouseEnter={() => setHoveredVendor(v)}
                  onMouseLeave={() => setHoveredVendor(null)}
                  style={{
                    paddingLeft: '20px',
                    paddingRight: '18px',
                    gap: '16px',
                  }}
                  className={`w-full flex items-center py-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer text-left group ${
                    isHovered
                      ? 'bg-white/[0.08] text-white shadow-sm border border-white/20 font-semibold'
                      : 'bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 transition-colors" style={{ color: zoneColor }} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-xs font-semibold text-white">
                      {v.name}
                    </span>
                    <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300 font-normal truncate mt-0.5">
                      {ZONE_LABELS[v.zone]} • {v.category} • Исполнение {v.execution}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Transparent scoring formula ── */}
      <ScoringBreakdown onOpenEvidence={onOpenEvidence} />
    </div>
  );
}
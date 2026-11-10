import React, { useState, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  Key,
  Building2,
  Layers,
  FileCode,
  Fingerprint,
  Wallet,
  Sparkles,
  Info,
} from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';

const PHASE_COLORS = {
  1: '#F87171', // Запуск – red
  2: '#F87171', // Пик ожиданий – red
  3: '#FACC15', // Впадина – yellow
  4: '#60A5FA', // Склон прояснения – blue
  5: '#4ADE80', // Плато – green
};

const TECH_ICONS = {
  'hardware-wallet': ShieldCheck,
  'multisig': Key,
  'custodial-licensed': Building2,
  'mpc-tss': Layers,
  'smart-accounts': FileCode,
  'passkey-auth': Fingerprint,
  'embedded-wallet-tech': Wallet,
  'quantum-sig': Sparkles,
};

const PHASE_LABELS = [
  { label: 'Запуск', x: 90 },
  { label: 'Пик ожиданий', x: 205 },
  { label: 'Впадина', x: 330 },
  { label: 'Склон прояснения', x: 495 },
  { label: 'Плато', x: 640 },
];

/* Exact dot coordinates positioned on the Hype Cycle curve spanning full 720 width */
const TECH_COORDS = {
  'quantum-sig': { x: 85, y: 320, labelX: 85, labelY: 340, textAnchor: 'middle', shortName: 'Постквантовые' },
  'embedded-wallet-tech': { x: 205, y: 48, labelX: 220, labelY: 52, textAnchor: 'start', shortName: 'Встроенный кошелёк' },
  'passkey-auth': { x: 420, y: 285, labelX: 420, labelY: 304, textAnchor: 'middle', shortName: 'Passkey' },
  'smart-accounts': { x: 470, y: 250, labelX: 470, labelY: 234, textAnchor: 'middle', shortName: 'ERC-4337' },
  'mpc-tss': { x: 520, y: 225, labelX: 520, labelY: 244, textAnchor: 'middle', shortName: 'MPC / TSS' },
  'custodial-licensed': { x: 570, y: 205, labelX: 570, labelY: 189, textAnchor: 'middle', shortName: 'Кастоди' },
  'hardware-wallet': { x: 620, y: 190, labelX: 620, labelY: 210, textAnchor: 'middle', shortName: 'Аппаратный' },
  'multisig': { x: 665, y: 188, labelX: 665, labelY: 172, textAnchor: 'middle', shortName: 'Мультиподпись' },
};

export default function HypeCycleScreen() {
  const { data } = usePortalData();
  const [hoveredTech, setHoveredTech] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const technologies = data.hypeCycle || [];

  const handleMouseEnter = useCallback((tech, e) => {
    const svgEl = svgRef.current;
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;
      setTooltipPos({ x, y });
    }
    setHoveredTech(tech);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredTech(null);
  }, []);

  return (
    <div className="min-w-0">
      {/* ── Executive Header ── */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            Кривая зрелости технологий криптокошельков (Hype Cycle)
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 font-mono shadow-sm">
              8 технологий • 5 фаз
            </span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 max-w-4xl font-sans leading-relaxed">
          Стадии внедрения и зрелости ключевых технологий от запуска до промышленного использования в банке.
        </p>
      </div>

      {/* ── Two-column layout (Full width curve on left, wider sidebar-style list on right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5 lg:gap-6 items-stretch min-w-0">
        {/* ── LEFT: Hype Cycle Curve Chart (Spans full panel width, zero dead space) ── */}
        <div className="glass-panel-static p-4 lg:p-5 relative border border-white/10 rounded-2xl overflow-hidden min-w-0 flex flex-col justify-between">
          <div className="relative w-full" ref={svgRef}>
            <svg
              viewBox="0 0 720 420"
              className="w-full h-auto select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="curveGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>

              {/* Subtle horizontal grid lines */}
              {[100, 180, 260, 340].map((y) => (
                <line
                  key={y}
                  x1="35"
                  y1={y}
                  x2="685"
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              ))}

              {/* Phase vertical separator lines */}
              {[150, 270, 400, 560].map((x) => (
                <line
                  key={x}
                  x1={x}
                  y1="35"
                  x2={x}
                  y2="360"
                  stroke="rgba(255,255,255,0.04)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              ))}

              {/* Filled area under curve */}
              <path
                d="M 40,350 C 70,345 110,320 140,250 C 170,160 190,48 205,48 C 220,48 245,180 275,300 C 295,335 320,345 345,340 C 380,330 420,285 470,250 C 520,225 570,205 620,190 C 645,188 665,188 680,188 L 680,350 Z"
                fill="url(#curveGrad)"
                opacity="0.4"
              />

              {/* Main Hype Cycle Spline Curve */}
              <path
                d="M 40,350 C 70,345 110,320 140,250 C 170,160 190,48 205,48 C 220,48 245,180 275,300 C 295,335 320,345 345,340 C 380,330 420,285 470,250 C 520,225 570,205 620,190 C 645,188 665,188 680,188"
                stroke="#ffffff"
                strokeWidth="2.5"
                fill="none"
                filter="url(#curveGlow)"
              />

              {/* Phase labels at top */}
              {PHASE_LABELS.map((p) => (
                <text
                  key={p.label}
                  x={p.x}
                  y={24}
                  fill="rgba(255,255,255,0.45)"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                  textAnchor="middle"
                >
                  {p.label}
                </text>
              ))}

              {/* Axis labels */}
              <text x={680} y={385} fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="end" fontFamily="Inter, sans-serif">
                Время развития технологии →
              </text>
              <text x={40} y={385} fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="Inter, sans-serif">
                ↑ Ожидания рынка
              </text>

              {/* Interactive Technology Dots */}
              {technologies.map((tech) => {
                const config = TECH_COORDS[tech.id] || { x: 300, y: 200, labelX: 300, labelY: 180, textAnchor: 'middle', shortName: tech.name };
                const isHovered = hoveredTech?.id === tech.id;
                const color = PHASE_COLORS[tech.phase] || '#fff';

                return (
                  <g
                    key={tech.id}
                    className="cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(tech, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Glow ring */}
                    {isHovered && (
                      <circle
                        cx={config.x}
                        cy={config.y}
                        r={18}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    )}

                    {/* Center Dot */}
                    <circle
                      cx={config.x}
                      cy={config.y}
                      r={isHovered ? 8 : 6}
                      fill={color}
                      stroke="#08080A"
                      strokeWidth={2}
                    />

                    {/* Clean Text Label */}
                    <text
                      x={config.labelX}
                      y={config.labelY}
                      fill={isHovered ? '#ffffff' : 'rgba(255,255,255,0.85)'}
                      fontSize="11"
                      fontFamily="Inter, sans-serif"
                      fontWeight={isHovered ? '700' : '500'}
                      textAnchor={config.textAnchor}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                    >
                      {config.shortName}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating Tooltip */}
            {hoveredTech && (
              <div
                className="tooltip-glass absolute pointer-events-none z-30 transition-all duration-150"
                style={{
                  left: tooltipPos.x > 380 ? tooltipPos.x - 260 : tooltipPos.x + 15,
                  top: tooltipPos.y < 120 ? tooltipPos.y + 10 : tooltipPos.y - 140,
                }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 mb-1.5">
                  <span className="text-white font-bold text-xs">{hoveredTech.name}</span>
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-300 shadow-sm inline-flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: PHASE_COLORS[hoveredTech.phase] }} />
                    {hoveredTech.phaseName}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-zinc-300">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">Горизонт:</span>
                    <strong className="text-white font-mono">{hoveredTech.horizon}</strong>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">Контур:</span>
                    <span className="text-zinc-300">{hoveredTech.scenario}</span>
                  </div>
                  {hoveredTech.standard && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">Стандарт:</span>
                      <span className="text-zinc-300 font-mono truncate max-w-[150px]">{hoveredTech.standard}</span>
                    </div>
                  )}
                  <div className="text-[10px] pt-1 border-t border-white/5 text-zinc-400">
                    <span className="text-zinc-500 block mb-0.5">Ключевой риск:</span>
                    <span className="break-words leading-tight text-zinc-300">{hoveredTech.risk}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart Disclaimer Footer (Clean & minimal, text specifications completely removed) */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 text-xs text-zinc-400">
            <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-medium text-zinc-300">
              Учебная раскладка на открытых данных, не отчёт Gartner
            </span>
          </div>
        </div>

        {/* ── RIGHT: Technologies list (Rendered in exact Sidebar pill format) ── */}
        <div className="glass-panel-static p-4 lg:p-5 flex flex-col border border-white/10 rounded-2xl min-w-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Список технологий ({technologies.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400 font-mono shadow-sm">
              5 фаз зрелости
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[460px] pr-1">
            {technologies.map((tech) => {
              const isHovered = hoveredTech?.id === tech.id;
              const color = PHASE_COLORS[tech.phase] || '#fff';
              const Icon = TECH_ICONS[tech.id] || Sparkles;

              return (
                <button
                  key={tech.id}
                  onClick={() => setHoveredTech(isHovered ? null : tech)}
                  onMouseEnter={() => setHoveredTech(tech)}
                  onMouseLeave={() => setHoveredTech(null)}
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
                    <Icon className="w-4 h-4 transition-colors" style={{ color: color }} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-xs font-semibold text-white">
                      {tech.name}
                    </span>
                    <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300 font-normal truncate mt-0.5">
                      {tech.phaseName} • {tech.horizon}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

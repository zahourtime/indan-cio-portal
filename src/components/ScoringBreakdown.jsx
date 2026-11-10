import React, { useMemo, useState } from 'react';
import { Calculator, Info, FileSearch, TrendingDown } from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';
import { computeAxisScore, round1 } from '../utils/evidence';

const AXES = [
  { key: 'execution', short: 'Execution', color: '#60A5FA' },
  { key: 'vision', short: 'Vision', color: '#4ADE80' },
];

const selectClass =
  'rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/25 transition-all cursor-pointer';

function ScoreBar({ value, color }) {
  const pct = Math.max(0, Math.min(100, ((value - 1) / 4) * 100));
  return (
    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

/**
 * Transparent scoring: shows how Ability to Execute / Completeness of Vision
 * are derived from weighted criteria, for one vendor or side by side for two.
 */
export default function ScoringBreakdown({ onOpenEvidence }) {
  const { data } = usePortalData();
  const scoring = data.scoring;
  const vendors = data.quadrant.vendors;

  const [vendorA, setVendorA] = useState('fireblocks');
  const [vendorB, setVendorB] = useState('komainu');

  const byId = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v])), [vendors]);

  if (!scoring) return null;

  const a = byId[vendorA] || vendors[0];
  const b = byId[vendorB] || vendors[1];

  const renderAxis = (axis) => {
    const def = scoring[axis.key];
    const scoresA = scoring.vendors[a.id]?.[axis.key];
    const scoresB = scoring.vendors[b.id]?.[axis.key];
    if (!scoresA || !scoresB) return null;

    const rawA = computeAxisScore(def.criteria, scoresA);
    const rawB = computeAxisScore(def.criteria, scoresB);
    const baseA = round1(rawA);
    const baseB = round1(rawB);
    // Live value from the quadrant may include a telemetry penalty (incident).
    const liveA = a[axis.key];
    const liveB = b[axis.key];
    const adjA = round1(liveA - baseA);
    const adjB = round1(liveB - baseB);
    const delta = round1(liveA - liveB);

    return (
      <div key={axis.key} className="glass-panel-static p-4 lg:p-5 border border-white/10 rounded-2xl min-w-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">{def.title}</h3>
          <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10">
            Σ веса = {Math.round(def.criteria.reduce((s, c) => s + c.weight, 0) * 100)}%
          </span>
        </div>

        <p className="text-[11px] text-zinc-500 font-mono leading-relaxed mb-3 break-words">
          {axis.short} = {def.criteria.map((c) => `${Math.round(c.weight * 100)}%·${c.id}`).join(' + ')}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[520px]">
            <thead>
              <tr className="text-[10px] uppercase font-mono text-zinc-500 border-b border-white/10">
                <th className="py-2 pr-3 text-left font-medium">Критерий</th>
                <th className="py-2 px-2 text-right font-medium w-14">Вес</th>
                <th className="py-2 px-2 text-left font-medium w-[26%]">{a.name}</th>
                <th className="py-2 pl-2 text-left font-medium w-[26%]">{b.name}</th>
              </tr>
            </thead>
            <tbody>
              {def.criteria.map((c) => {
                const sa = scoresA[c.id];
                const sb = scoresB[c.id];
                return (
                  <tr key={c.id} className="border-b border-white/5 align-top">
                    <td className="py-3 pr-3">
                      <div className="text-zinc-100 font-medium leading-snug">{c.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-1 leading-snug">{c.hint}</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-zinc-300">
                      {Math.round(c.weight * 100)}%
                    </td>
                    {[sa, sb].map((s, i) => (
                      <td key={i} className={`py-3 ${i === 0 ? 'px-2' : 'pl-2'}`}>
                        <div className="flex items-baseline justify-between gap-2 mb-1.5">
                          <span className="font-mono font-bold text-white">{s.score.toFixed(1)}</span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            +{(s.score * c.weight).toFixed(2)}
                          </span>
                        </div>
                        <ScoreBar value={s.score} color={axis.color} />
                        <div className="text-[10px] text-zinc-400 mt-1.5 leading-snug break-words">{s.note}</div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/15">
                <td className="pt-3 pr-3 text-zinc-300 font-semibold" colSpan={2}>
                  Сумма взвешенных оценок
                </td>
                <td className="pt-3 px-2 font-mono text-zinc-200">{rawA.toFixed(2)} → {baseA.toFixed(1)}</td>
                <td className="pt-3 pl-2 font-mono text-zinc-200">{rawB.toFixed(2)} → {baseB.toFixed(1)}</td>
              </tr>
              {(Math.abs(adjA) >= 0.05 || Math.abs(adjB) >= 0.05) && (
                <tr>
                  <td className="pt-2 pr-3 text-amber-300 text-[11px]" colSpan={2}>
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Live-корректировка за активный инцидент
                    </span>
                  </td>
                  <td className="pt-2 px-2 font-mono text-amber-300">{adjA ? adjA.toFixed(1) : '—'}</td>
                  <td className="pt-2 pl-2 font-mono text-amber-300">{adjB ? adjB.toFixed(1) : '—'}</td>
                </tr>
              )}
              <tr>
                <td className="pt-2 pr-3 text-white font-bold" colSpan={2}>
                  Итог на квадранте
                </td>
                <td className="pt-2 px-2 font-mono text-lg font-bold text-white">{liveA.toFixed(1)}</td>
                <td className="pt-2 pl-2 font-mono text-lg font-bold text-white">{liveB.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-zinc-400 leading-relaxed">
          {a.id === b.id ? (
            'Выберите разных вендоров, чтобы увидеть, какие критерии формируют разрыв.'
          ) : (
            <>
              Разрыв {a.name} vs {b.name}:{' '}
              <strong className={`font-mono ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}
              </strong>
              . Наибольший вклад даёт критерий «
              {
                def.criteria
                  .map((c) => ({
                    c,
                    gap: (scoresA[c.id].score - scoresB[c.id].score) * c.weight,
                  }))
                  .sort((x, y) => Math.abs(y.gap) - Math.abs(x.gap))[0].c.label
              }
              ».
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="mt-6 min-w-0" aria-label="Прозрачный скоринг">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-zinc-300" />
            Как считаются оценки (Scoring Breakdown)
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Каждая ось квадранта собирается из четырёх взвешенных критериев. Выберите двух вендоров, чтобы увидеть,
            откуда берётся разрыв в оценках.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Первый вендор"
            value={vendorA}
            onChange={(e) => setVendorA(e.target.value)}
            style={{ colorScheme: 'dark', padding: '8px 12px' }}
            className={selectClass}
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-zinc-500 font-mono">vs</span>
          <select
            aria-label="Второй вендор"
            value={vendorB}
            onChange={(e) => setVendorB(e.target.value)}
            style={{ colorScheme: 'dark', padding: '8px 12px' }}
            className={selectClass}
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {onOpenEvidence && (
            <button
              onClick={() => onOpenEvidence({ vendor: a.id })}
              className="px-3 py-2 rounded-xl text-xs bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all inline-flex items-center gap-2 cursor-pointer"
              title={`Документы, подтверждающие оценки ${a.name}`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              Источники {a.name}
            </button>
          )}
          {onOpenEvidence && a.id !== b.id && (
            <button
              onClick={() => onOpenEvidence({ vendor: b.id })}
              className="px-3 py-2 rounded-xl text-xs bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all inline-flex items-center gap-2 cursor-pointer"
              title={`Документы, подтверждающие оценки ${b.name}`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              Источники {b.name}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5 lg:gap-6 items-start">
        {AXES.map(renderAxis)}
      </div>

      <div className="glass-panel-static p-4 mt-5 border border-white/10 rounded-2xl bg-white/[0.03] shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">{scoring.note}</p>
        </div>
      </div>
    </section>
  );
}

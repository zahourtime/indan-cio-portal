import React, { useMemo, useState } from 'react';
import { Check, Plus, FileSearch, ArrowUpRight, Info, Trophy } from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';

const VERDICT = {
  buy: { label: 'Купить', cls: 'badge-buy' },
  hold: { label: 'Подождать', cls: 'badge-hold' },
  avoid: { label: 'Избегать', cls: 'badge-avoid' },
};

const CIRCUIT_STYLES = {
  client: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
  treasury: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
  pilot: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
};

const ZONE_LABELS = {
  leaders: 'Лидеры',
  challengers: 'Претенденты',
  visionaries: 'Провидцы',
  niche: 'Нишевые',
};

/** Head-to-head comparison table of finalists for the board (Правление). */
export default function ComparisonScreen({ onNavigateToVendor, onOpenEvidence }) {
  const { data } = usePortalData();
  const comparison = data.comparison;

  const [selected, setSelected] = useState(comparison?.defaultVendors || []);

  const dossiers = useMemo(
    () => Object.fromEntries(data.vendorDossiers.map((v) => [v.id, v])),
    [data.vendorDossiers],
  );
  const quadrant = useMemo(
    () => Object.fromEntries(data.quadrant.vendors.map((v) => [v.id, v])),
    [data.quadrant.vendors],
  );
  const evidenceCount = useMemo(() => {
    const counts = {};
    for (const d of data.evidenceCatalog?.documents || []) {
      for (const id of d.vendors) counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [data.evidenceCatalog]);

  if (!comparison) return null;

  const max = comparison.maxVendors || 4;
  const available = Object.keys(comparison.vendors).filter((id) => dossiers[id]);

  const toggle = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.length > 2 ? prev.filter((x) => x !== id) : prev;
      if (prev.length >= max) return prev;
      return [...prev, id];
    });
  };

  const cols = selected.filter((id) => comparison.vendors[id] && dossiers[id]);

  const bestExec = Math.max(...cols.map((id) => quadrant[id]?.execution ?? 0));
  const bestVision = Math.max(...cols.map((id) => quadrant[id]?.vision ?? 0));
  const bestInsurance = Math.max(...cols.map((id) => comparison.vendors[id].insuranceValue ?? 0));

  const byCircuit = (circuit) => cols.filter((id) => comparison.vendors[id].circuit === circuit);
  const names = (ids) => ids.map((id) => dossiers[id].name).join(', ');
  const clientIds = byCircuit('client');
  const treasuryIds = byCircuit('treasury');
  const pilotIds = byCircuit('pilot');

  const labelCell =
    'py-3 pr-4 pl-4 text-[11px] font-bold uppercase tracking-wider text-zinc-400 align-top w-[170px] min-w-[150px] bg-[#0c0c10]/90 sticky left-0 z-10';

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            Прямое сравнение вендоров (Head-to-Head)
          </h1>
          <span className="text-[11px] px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 font-mono shadow-sm shrink-0">
            {cols.length} из {max} вендоров • для Правления
          </span>
        </div>
        <p className="text-sm text-zinc-300 max-w-4xl font-sans leading-relaxed">
          Сравнительная таблица финалистов: модель ключа, держатели ключей, лицензия, страхование и рекомендуемый контур.
          Выберите от 2 до {max} вендоров.
        </p>
      </div>

      {/* Vendor picker */}
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Выбор вендоров для сравнения">
        {available.map((id) => {
          const on = selected.includes(id);
          const disabled = !on && selected.length >= max;
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              disabled={disabled}
              aria-pressed={on}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-2 border transition-all ${
                on
                  ? 'bg-white/[0.09] border-white/25 text-white cursor-pointer'
                  : disabled
                    ? 'bg-white/[0.02] border-white/5 text-zinc-600 cursor-not-allowed'
                    : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer'
              }`}
            >
              {on ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
              {dossiers[id].name}
            </button>
          );
        })}
      </div>

      {/* Recommendation summary (derived from the selected set) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          { id: 'client', title: 'Клиентский контур', ids: clientIds, hint: 'Passkey, MPC, розничные кошельки' },
          { id: 'treasury', title: 'Казначейский контур', ids: treasuryIds, hint: 'Собственные активы банка, квалифицированное кастоди' },
          { id: 'pilot', title: 'Пилот', ids: pilotIds, hint: 'Отдельный проект без основного бюджета' },
        ].map((card) => (
          <div key={card.id} className="glass-panel-static p-4 border border-white/10 rounded-2xl shadow-sm min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${CIRCUIT_STYLES[card.id]}`}>
                {card.title}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">{card.ids.length}</span>
            </div>
            <div className="text-sm font-semibold text-white mt-2.5 min-h-[20px] break-words">
              {card.ids.length ? names(card.ids) : '—'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">{card.hint}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel-static border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: 170 + cols.length * 250 }}>
            <thead>
              <tr className="border-b border-white/10">
                <th className={labelCell}>Критерий</th>
                {cols.map((id) => {
                  const d = dossiers[id];
                  const v = VERDICT[d.verdict] || VERDICT.hold;
                  return (
                    <th key={id} className="py-4 px-4 text-left align-top font-normal">
                      <button
                        onClick={() => onNavigateToVendor?.(id)}
                        className="group inline-flex items-center gap-1.5 text-base font-bold text-white hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Открыть досье вендора"
                      >
                        {d.name}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                      </button>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={`badge ${v.cls} text-[10px]`}>{v.label}</span>
                        <span className="badge badge-zone text-[10px]">{ZONE_LABELS[d.zone] || d.zone}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Numeric scores */}
              <tr className="border-b border-white/5">
                <td className={labelCell}>Execution / Vision</td>
                {cols.map((id) => {
                  const q = quadrant[id];
                  return (
                    <td key={id} className="py-3 px-4 align-top">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
                        <span className={q.execution === bestExec ? 'text-emerald-300 font-bold' : 'text-zinc-200'}>
                          E {q.execution.toFixed(1)}
                          {q.execution === bestExec && cols.length > 1 && (
                            <Trophy className="w-3 h-3 inline ml-1 -mt-0.5" />
                          )}
                        </span>
                        <span className={q.vision === bestVision ? 'text-emerald-300 font-bold' : 'text-zinc-200'}>
                          V {q.vision.toFixed(1)}
                          {q.vision === bestVision && cols.length > 1 && (
                            <Trophy className="w-3 h-3 inline ml-1 -mt-0.5" />
                          )}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {comparison.rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className={labelCell}>{row.label}</td>
                  {cols.map((id) => {
                    const c = comparison.vendors[id];
                    const isBestInsurance =
                      row.id === 'insurance' && c.insuranceValue != null && c.insuranceValue === bestInsurance && cols.length > 1;
                    return (
                      <td key={id} className="py-3 px-4 align-top text-zinc-300 leading-relaxed break-words">
                        {row.id === 'insurance' && c.insuranceValue != null ? (
                          <span className={isBestInsurance ? 'text-emerald-300 font-semibold' : ''}>{c[row.id]}</span>
                        ) : (
                          c[row.id]
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Recommended circuit */}
              <tr className="border-b border-white/5">
                <td className={labelCell}>Рекомендован для контура</td>
                {cols.map((id) => {
                  const c = comparison.vendors[id];
                  return (
                    <td key={id} className="py-3 px-4 align-top">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                          CIRCUIT_STYLES[c.circuit] || CIRCUIT_STYLES.pilot
                        }`}
                      >
                        {c.circuitLabel}
                      </span>
                      <p className="text-zinc-400 mt-2 leading-relaxed">{c.circuitNote}</p>
                    </td>
                  );
                })}
              </tr>

              {/* Evidence link */}
              <tr>
                <td className={labelCell}>Доказательная база</td>
                {cols.map((id) => (
                  <td key={id} className="py-3 px-4 align-top">
                    <button
                      onClick={() => onOpenEvidence?.({ vendor: id })}
                      className="text-[11px] px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 hover:text-white hover:border-white/25 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileSearch className="w-3 h-3" />
                      {evidenceCount[id] || 0} док. в реестре
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel-static p-4 mt-5 border border-white/10 rounded-2xl bg-white/[0.03] shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            Значения «заявлено вендором» не подтверждены независимым документом, а «не раскрыто» означает, что в проверенных
            источниках портала данных нет. Страховые лимиты перед подачей в Правление нужно запросить у вендора. Учебная
            раскладка на открытых данных, не отчёт Gartner.
          </p>
        </div>
      </div>
    </div>
  );
}

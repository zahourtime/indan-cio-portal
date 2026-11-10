import React, { useMemo, useState } from 'react';
import {
  Search,
  ExternalLink,
  BadgeCheck,
  Scale,
  FileText,
  Landmark,
  Cpu,
  ShieldCheck,
  Siren,
  FilterX,
} from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';
import { quarterLabel, formatRuDate, STATUS_STYLES, STATUS_OPTIONS } from '../utils/evidence';

const GROUP_ICONS = {
  license: Landmark,
  regulation: Scale,
  standard: Cpu,
  audit: ShieldCheck,
  postmortem: Siren,
};

const selectClass =
  'w-full rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/25 transition-all cursor-pointer';

/**
 * Clickable registry of primary-source documents (Evidence Catalog).
 * `initialFilters` lets other screens deep-link here, e.g. { vendor: 'bitgo' }.
 */
export default function EvidenceCatalog({ initialFilters, onNavigateToVendor }) {
  const { data } = usePortalData();
  const catalog = data.evidenceCatalog;

  const [group, setGroup] = useState(initialFilters?.group || 'all');
  const [authority, setAuthority] = useState('all');
  const [vendor, setVendor] = useState(initialFilters?.vendor || 'all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState(initialFilters?.query || '');

  const vendorNames = useMemo(
    () => Object.fromEntries(data.vendorDossiers.map((v) => [v.id, v.name])),
    [data.vendorDossiers],
  );

  const documents = useMemo(() => catalog?.documents ?? [], [catalog]);
  const groups = useMemo(() => catalog?.groups ?? [], [catalog]);

  const authorities = useMemo(
    () => [...new Set(documents.map((d) => d.authority))].sort((a, b) => a.localeCompare(b, 'ru')),
    [documents],
  );

  const vendorsWithDocs = useMemo(() => {
    const ids = new Set(documents.flatMap((d) => d.vendors));
    return data.vendorDossiers.filter((v) => ids.has(v.id));
  }, [documents, data.vendorDossiers]);

  const groupCounts = useMemo(() => {
    const counts = {};
    for (const d of documents) counts[d.group] = (counts[d.group] || 0) + 1;
    return counts;
  }, [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (group !== 'all' && d.group !== group) return false;
      if (authority !== 'all' && d.authority !== authority) return false;
      if (vendor !== 'all' && !d.vendors.includes(vendor)) return false;
      if (status !== 'all' && d.status !== status) return false;
      if (!q) return true;
      return [d.title, d.identifier, d.authority, d.summary, d.usedFor, d.jurisdiction]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [documents, group, authority, vendor, status, query]);

  const hasFilters =
    group !== 'all' || authority !== 'all' || vendor !== 'all' || status !== 'all' || query !== '';

  const resetFilters = () => {
    setGroup('all');
    setAuthority('all');
    setVendor('all');
    setStatus('all');
    setQuery('');
  };

  const latestVerified = useMemo(
    () => documents.map((d) => d.verifiedDate).sort().at(-1),
    [documents],
  );

  if (!catalog) {
    return (
      <div className="glass-panel-static p-6 border border-white/10 rounded-2xl text-xs text-zinc-400">
        Каталог первоисточников недоступен в загруженном наборе данных.
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      {/* Group tiles (act as category filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setGroup('all')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            group === 'all'
              ? 'bg-white/[0.08] border-white/25 shadow-sm'
              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
          }`}
        >
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <FileText className="w-3.5 h-3.5" />
            Все документы
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">{documents.length}</div>
        </button>

        {groups.map((g) => {
          const Icon = GROUP_ICONS[g.id] || FileText;
          const active = group === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setGroup(active ? 'all' : g.id)}
              title={g.purpose}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-w-0 ${
                active
                  ? 'bg-white/[0.08] border-white/25 shadow-sm'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 min-w-0">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{g.label}</span>
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {groupCounts[g.id] || 0}
              </div>
            </button>
          );
        })}
      </div>

      {/* Why this category matters */}
      {group !== 'all' && (
        <p className="text-xs text-zinc-400 px-1 leading-relaxed">
          <span className="text-zinc-300 font-semibold">Зачем на защите: </span>
          {groups.find((g) => g.id === group)?.purpose}
        </p>
      )}

      {/* Filters */}
      <div className="glass-panel-static p-4 border border-white/10 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 items-end">
          <label className="block min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5 block">
              Поиск
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Номер чартера, стандарт, вендор…"
                style={{ paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9 }}
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25 transition-all"
              />
            </div>
          </label>

          <label className="block min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5 block">
              Регулятор / орган
            </span>
            <select
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
              style={{ colorScheme: 'dark', padding: '9px 12px' }}
              className={selectClass}
            >
              <option value="all">Все</option>
              {authorities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5 block">
              Вендор
            </span>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              style={{ colorScheme: 'dark', padding: '9px 12px' }}
              className={selectClass}
            >
              <option value="all">Все</option>
              {vendorsWithDocs.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5 block">
              Статус
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ colorScheme: 'dark', padding: '9px 12px' }}
              className={selectClass}
            >
              <option value="all">Любой</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={resetFilters}
            disabled={!hasFilters}
            className="px-3.5 py-2.5 rounded-xl text-xs bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5" />
            Сбросить
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
          <span>
            Показано <strong className="text-white font-mono">{filtered.length}</strong> из{' '}
            <span className="font-mono">{documents.length}</span> документов
          </span>
          {latestVerified && (
            <span className="font-mono text-zinc-500">
              Последняя проверка ссылок: {quarterLabel(latestVerified)} ({formatRuDate(latestVerified)})
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="glass-panel-static p-8 border border-white/10 rounded-2xl text-center text-xs text-zinc-400">
          По выбранным фильтрам документов нет.{' '}
          <button onClick={resetFilters} className="underline text-zinc-200 cursor-pointer">
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
          {filtered.map((doc) => {
            const Icon = GROUP_ICONS[doc.group] || FileText;
            const groupLabel = groups.find((g) => g.id === doc.group)?.label;
            return (
              <article
                key={doc.id}
                className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.03] flex flex-col gap-3 min-w-0 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-white leading-snug break-words">
                        {doc.title}
                      </h3>
                      <div className="text-[11px] text-zinc-500 font-mono mt-1 break-words">
                        {doc.identifier} • {doc.jurisdiction}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
                      STATUS_STYLES[doc.status] || STATUS_STYLES.closed
                    }`}
                  >
                    {doc.statusLabel}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed break-words">{doc.summary}</p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-zinc-300 font-mono">
                    {doc.authority}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-zinc-400">
                    {groupLabel}
                  </span>
                  {doc.vendors.map((vid) => (
                    <button
                      key={vid}
                      onClick={() => onNavigateToVendor?.(vid)}
                      title="Открыть досье вендора"
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
                    >
                      {vendorNames[vid] || vid}
                    </button>
                  ))}
                </div>

                <div className="mt-auto pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 font-mono">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Verified: {quarterLabel(doc.verifiedDate)} ({formatRuDate(doc.verifiedDate)})
                    </span>
                    <span className="text-[10px] text-zinc-500 break-words">
                      Используется для: {doc.usedFor}
                    </span>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-200 hover:text-white hover:border-white/25 inline-flex items-center gap-1.5 transition-all shadow-sm shrink-0 font-medium"
                  >
                    Первоисточник
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

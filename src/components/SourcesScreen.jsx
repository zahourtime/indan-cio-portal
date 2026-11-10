import React from 'react';
import { Database, ShieldAlert, Ban, Info, CheckCircle2 } from 'lucide-react';
import { usePortalData } from '../context/PortalDataContext';

export default function SourcesScreen() {
  const { data } = usePortalData();
  const { trusted, excluded } = data.sources;

  return (
    <div className="min-w-0">
      {/* ── Executive Header (Unified styling) ── */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            Источники данных и методология верификации
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 font-mono shadow-sm">
              5 категорий • Сквозная верификация
            </span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 max-w-4xl font-sans leading-relaxed">
          Реестр проверяемых открытых источников (OCC, NYDFS, MiCA, EIP/BIP, NIST), отчётов Big-4 и жесткие критерии исключения недостоверных данных.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-start min-w-0">
        {/* LEFT — Откуда данные */}
        <div className="glass-panel-static p-4 lg:p-5 border border-white/10 rounded-2xl flex flex-col gap-4 min-w-0 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-2 rounded-xl bg-white/[0.04] text-emerald-400 border border-white/10 shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Откуда данные (Доверенный периметр)
              </h2>
              <span className="text-[11px] text-zinc-400">Первоисточники фактов, лицензий и спецификаций</span>
            </div>
          </div>

          <div className="space-y-3">
            {trusted.map((item, idx) => (
              <div key={idx} className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-2 min-w-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <p className="font-semibold text-xs text-white tracking-tight">{item.category}</p>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed pl-5 break-words">{item.examples}</p>
                <div className="pt-2 pl-5 border-t border-white/5 flex items-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-zinc-300 font-mono shadow-sm">
                    <span className="text-zinc-500">Используется для:</span>
                    <span className="text-zinc-200">{item.usedFor}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Что не берём */}
        <div className="glass-panel-static p-4 lg:p-5 border border-white/10 rounded-2xl flex flex-col gap-4 min-w-0 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-2 rounded-xl bg-white/[0.04] text-red-400 border border-white/10 shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Что не берём (Исключения)
              </h2>
              <span className="text-[11px] text-zinc-400">Невалидированные данные, не допускаемые к оценке</span>
            </div>
          </div>

          <div className="space-y-3">
            {excluded.map((item, idx) => (
              <div key={idx} className="glass-card p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-2 min-w-0 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Ban className="w-3.5 h-3.5 text-red-400/80 shrink-0" />
                    <p className="font-semibold text-xs text-white tracking-tight">{item.category}</p>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-lg bg-white/[0.04] text-red-400/90 border border-white/10 shadow-sm inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Исключено
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-5 break-words">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="glass-panel-static p-4 mt-6 border border-white/10 rounded-2xl bg-white/[0.03] shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            Учебная раскладка на открытых данных, не отчёт Gartner. Все позиции и оценки сформированы исследовательской группой на основе публичных спецификаций, отчётов регуляторов и аудитов.
          </p>
        </div>
      </div>
    </div>
  );
}

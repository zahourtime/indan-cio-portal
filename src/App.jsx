import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import OverviewScreen from './components/OverviewScreen';
import HypeCycleScreen from './components/HypeCycleScreen';
import QuadrantScreen from './components/QuadrantScreen';
import VendorDossierScreen from './components/VendorDossierScreen';
import SourcesScreen from './components/SourcesScreen';
import AICopilotModal from './components/AICopilotModal';
import { Search, Sparkles, ShieldCheck, RefreshCw, BarChart3, Radio, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { PortalDataProvider, usePortalData } from './context/PortalDataContext';

function PortalAppMain() {
  const {
    data: portalData,
    connectionMode,
    isLiveConnected,
    lastSyncTime,
    isRefreshing,
    activeIncidents,
    activeSimulation,
    refreshData,
    triggerSimulation,
  } = usePortalData();

  const [activeScreen, setActiveScreen] = useState('home');
  const [selectedVendor, setSelectedVendor] = useState('fireblocks');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live search calculation across vendors, technologies, and signals
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return null;

    const matchedVendors = portalData.vendorDossiers.filter(v => 
      v.name.toLowerCase().includes(q) || 
      v.category.toLowerCase().includes(q) || 
      (v.keyTech && v.keyTech.toLowerCase().includes(q))
    );

    const matchedTech = portalData.hypeCycle.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.phaseName.toLowerCase().includes(q) || 
      t.risk.toLowerCase().includes(q)
    );

    const matchedSignals = portalData.signals.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.impact.toLowerCase().includes(q)
    );

    const totalCount = matchedVendors.length + matchedTech.length + matchedSignals.length;

    return {
      vendors: matchedVendors,
      technologies: matchedTech,
      signals: matchedSignals,
      totalCount,
    };
  }, [searchQuery, portalData]);

  const handleNavigate = (screenId) => {
    if (screenId === 'copilot') {
      setIsCopilotOpen(true);
    } else {
      setActiveScreen(screenId);
    }
  };

  const handleNavigateToVendor = (vendorId) => {
    setSelectedVendor(vendorId);
    setActiveScreen('card');
  };

  const formatLastSync = (date) => {
    if (!date) return 'Только что';
    const d = new Date(date);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-white flex flex-col w-full relative overflow-x-hidden selection:bg-white/20 selection:text-white antialiased">
      {/* Ambient background depth blobs */}
      <div className="ambient-glow w-[500px] h-[500px] bg-white/[0.015] top-[-100px] left-[200px]" />
      <div className="ambient-glow w-[600px] h-[600px] bg-emerald-500/[0.015] bottom-[-150px] right-[100px]" />
      <div className="ambient-glow w-[400px] h-[400px] bg-blue-500/[0.015] top-[30%] right-[30%]" />

      {/* ── Slide-over Sidebar Drawer ── */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeScreen={activeScreen} 
        onNavigate={handleNavigate}
      />

      {/* ── Main Site Canvas ── */}
      <div className="flex-1 flex flex-col w-full min-h-screen relative z-10">
        {/* Top Executive Header */}
        <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-white/[0.06] bg-black/60 backdrop-blur-xl sticky top-0 z-30 w-full">
          <div className="flex items-center gap-5 min-w-0">
            {/* The InDan Logo Trigger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-3 p-1 pr-3 rounded-xl hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer group border border-transparent hover:border-white/10 shrink-0"
              title="Открыть меню навигации"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center backdrop-blur-md border border-white/10 shadow-sm shrink-0 group-hover:scale-105 group-hover:bg-white/[0.08] group-hover:border-white/20 transition-all">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-bold text-white tracking-tight leading-tight">
                  InDan
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Навигация
                </span>
              </div>
            </button>

            <span className="hidden md:inline-block h-4 w-[1px] bg-white/10" />

            <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase font-mono truncate hidden sm:inline-block">
              Analytical AI Platform for Banking CIO
            </span>

            {/* Live Real-time Status Badge */}
            <div className="hidden xl:inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-[11px] font-medium tracking-wide bg-white/[0.04] border border-white/10 text-zinc-300 shadow-sm shrink-0">
              <span className={`w-2 h-2 rounded-full ${
                activeIncidents.length > 0 
                  ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-ping'
                  : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] animate-pulse'
              }`} />
              <span className="font-mono text-zinc-200">
                {connectionMode === 'backend-live' ? 'LIVE BUS (FastAPI/Node)' : 'LIVE ENGINE (Telemetry Sync)'}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {formatLastSync(lastSyncTime)}
              </span>
            </div>

            {/* Active Incident Warning in Header */}
            {activeIncidents.length > 0 && (
              <button
                onClick={() => handleNavigateToVendor(activeIncidents[0].id || 'bitgo')}
                className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse hover:bg-amber-500/20 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Внимание: {activeIncidents.length} активный инцидент</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Search */}
            <div className="relative hidden md:flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 flex items-center z-10">
                <Search className="w-4 h-4 text-zinc-400" />
              </div>
              <input
                type="text"
                placeholder="Поиск по вендорам, технологиям и рискам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                style={{
                  paddingLeft: '42px',
                  paddingRight: '16px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  width: '320px',
                }}
                className="rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all font-sans shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              )}

              {/* Live Search Results Dropdown */}
              {searchResults && (
                <div 
                  style={{ width: '420px', maxHeight: '440px' }}
                  className="absolute top-full mt-2 left-0 glass-panel-static p-4 border border-white/15 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.85)] z-50 overflow-y-auto space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] font-mono text-zinc-400">
                    <span>Результаты поиска ({searchResults.totalCount})</span>
                    <span className="text-[10px] text-zinc-500">Esc для закрытия</span>
                  </div>

                  {searchResults.totalCount === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-500 font-sans">
                      Ничего не найдено по запросу «{searchQuery}»
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Vendors */}
                      {searchResults.vendors.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 block">
                            Поставщики ({searchResults.vendors.length})
                          </span>
                          {searchResults.vendors.map(v => (
                            <button
                              key={v.id}
                              onClick={() => {
                                handleNavigateToVendor(v.id);
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                  {v.name}
                                </div>
                                <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                  {v.category} • {v.keyTech}
                                </div>
                              </div>
                              <span className={`badge ${
                                v.verdict === 'buy' ? 'badge-buy' : v.verdict === 'hold' ? 'badge-hold' : 'badge-avoid'
                              } text-[10px] shrink-0`}>
                                {v.verdict.toUpperCase()}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Technologies */}
                      {searchResults.technologies.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 block">
                            Технологии Hype Cycle ({searchResults.technologies.length})
                          </span>
                          {searchResults.technologies.map(t => (
                            <button
                              key={t.id}
                              onClick={() => {
                                handleNavigate('analytics');
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                                  {t.name}
                                </div>
                                <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                  Фаза: {t.phaseName} • Риск: {t.risk}
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-zinc-300 font-mono shrink-0">
                                {t.horizon}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Signals */}
                      {searchResults.signals.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-1 block">
                            Регуляторные сигналы ({searchResults.signals.length})
                          </span>
                          {searchResults.signals.map(s => (
                            <button
                              key={s.id}
                              onClick={() => {
                                handleNavigate('home');
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
                                  {s.title}
                                </div>
                                <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                  {s.date} • {s.impact}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Force Refresh Button */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
              title="Принудительная синхронизация с источниками данных"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Синхронизация</span>
            </button>
          </div>
        </header>

        {/* Dynamic Screen View */}
        <main className="flex-1 px-6 lg:px-10 py-5 w-full max-w-[1440px] mx-auto min-w-0">
          {activeScreen === 'home' && (
            <OverviewScreen 
              onNavigateToVendor={handleNavigateToVendor}
              onNavigateToScreen={handleNavigate}
            />
          )}

          {activeScreen === 'analytics' && (
            <HypeCycleScreen />
          )}

          {activeScreen === 'strategy' && (
            <QuadrantScreen 
              onNavigateToVendor={handleNavigateToVendor}
            />
          )}

          {activeScreen === 'card' && (
            <VendorDossierScreen 
              vendorId={selectedVendor}
              onBack={() => setActiveScreen('strategy')}
              onSelectVendor={(vId) => setSelectedVendor(vId)}
            />
          )}

          {activeScreen === 'sources' && (
            <SourcesScreen />
          )}

          {activeScreen === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6 pt-4">
              {/* Real-time Data Hub Controls */}
              <div className="glass-panel-static p-8 space-y-6 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                      <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                      Центр управления шиной данных реального времени
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Мониторинг активных коннекторов и демонстрация сценариев пересчета скоринга в реальном времени.
                    </p>
                  </div>
                  <span className="badge badge-buy font-mono text-xs">
                    {connectionMode === 'backend-live' ? 'FastAPI/Node Live' : 'High-Res Stream'}
                  </span>
                </div>

                {/* 4 Pipeline Status Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                    <div>
                      <div className="text-xs font-semibold text-white">Statuspage.io Telemetry</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Fireblocks, BitGo, Coinbase — статус шлюзов и задержка API</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                    <div>
                      <div className="text-xs font-semibold text-white">GitHub Standards (EIPs / BIPs)</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Мониторинг коммитов EIP-4337, ERC-7579, NIST FIPS 203</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                    <div>
                      <div className="text-xs font-semibold text-white">Security Vulnerability Feeds</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">NVD NIST, SlowMist, GitHub Security Advisories по библиотекам MPC</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                    <div>
                      <div className="text-xs font-semibold text-white">Regulatory Radar (MiCA / OCC)</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Реестры лицензий CASP, директивы регуляторов ЕС и США</div>
                    </div>
                  </div>
                </div>

                {/* Live Simulation Controls for Presentation Demo */}
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-white">
                        Интерактивная демонстрация реакции портала (Live Demo)
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Нажмите для проверки динамической реакции портала и пересчета матрицы решений CIO:
                      </div>
                    </div>
                    {activeSimulation && (
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Тест активен
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => triggerSimulation('incident')}
                      className="p-3.5 rounded-xl text-left bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-200 text-xs transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Сбой BitGo API</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 leading-tight">
                        Имитация сбоя шлюза: BitGo переходит в Hold, execution падает
                      </span>
                    </button>

                    <button
                      onClick={() => triggerSimulation('signal')}
                      className="p-3.5 rounded-xl text-left bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-200 text-xs transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Сигнал MiCA Phase 2</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 leading-tight">
                        Новый регуляторный сигнал в ленте решений
                      </span>
                    </button>

                    <button
                      onClick={() => triggerSimulation('reset')}
                      className="p-3.5 rounded-xl text-left bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-200 text-xs transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Штатный режим</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 leading-tight">
                        Сброс всех инцидентов, все 8 вендоров в норме (100% SLA)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Portal Metadata info */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <div>
                    Синхронизация датасета: <strong className="text-zinc-200 font-mono">{portalData.meta.lastUpdated}</strong>
                  </div>
                  <button
                    onClick={() => setActiveScreen('home')}
                    className="px-4 py-2 rounded-xl text-xs bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    Вернуться к обзору
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Liquid Glass AI Copilot Pill */}
      <aside 
        aria-label="AI Copilot Quick Launch"
        className="fixed bottom-6 right-8 z-40"
      >
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3.5 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.6)] group cursor-pointer"
        >
          <div className="p-1.5 rounded-xl bg-white/10 border border-white/15 text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              InDan AI
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[11px] text-zinc-400 font-sans group-hover:text-zinc-200 transition-colors">
              Задать вопрос ИИ-советнику CIO...
            </span>
          </div>

          <div className="flex items-center gap-0.5 pl-2 border-l border-white/10">
            <span className="w-0.5 h-2 bg-white/50 rounded-full animate-pulse" />
            <span className="w-0.5 h-4 bg-white rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="w-0.5 h-2.5 bg-white/70 rounded-full animate-pulse [animation-delay:300ms]" />
          </div>
        </button>
      </aside>

      {/* AI Copilot Modal Dialog */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigateToSources={() => {
          setIsCopilotOpen(false);
          setActiveScreen('sources');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <PortalDataProvider>
      <PortalAppMain />
    </PortalDataProvider>
  );
}

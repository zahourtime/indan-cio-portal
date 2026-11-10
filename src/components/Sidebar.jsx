import React, { useEffect } from 'react';
import {
  BarChart3,
  Home,
  TrendingUp,
  LayoutGrid,
  FileText,
  Database,
  Sparkles,
  Settings,
  X,
} from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Обзор решений', icon: Home, description: 'Матрица Buy / Hold / Avoid' },
  { id: 'analytics', label: 'Кривая зрелости', icon: TrendingUp, description: 'Hype Cycle 5 фаз' },
  { id: 'strategy', label: 'Квадрант поставщиков', icon: LayoutGrid, description: 'Magic Quadrant 2x2' },
  { id: 'card', label: 'Досье вендора', icon: FileText, description: 'Карточка Fireblocks / BitGo' },
  { id: 'sources', label: 'Источники данных', icon: Database, description: 'Реестр верификации и аудит' },
  { id: 'copilot', label: 'InDan AI', icon: Sparkles, description: 'ИИ-советник CIO и диалог' },
];

export default function Sidebar({ isOpen, onClose, activeScreen, onNavigate }) {
  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* ── Затемняющий фон (Backdrop) с мягким blur ── */}
      <div
        onClick={onClose}
        style={{
          transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Выдвижная панель поверх контента (Плавная шелковистая анимация 0.55s) ── */}
      <aside
        style={{
          width: 300,
          willChange: 'transform',
          transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: isOpen ? '24px 0 72px rgba(0, 0, 0, 0.85)' : 'none',
        }}
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col py-6 px-4 glass-sidebar border-r border-white/10 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header: Логотип с иконкой графика (клик по ней закрывает сайдбар) */}
        <div 
          style={{
            marginBottom: '32px',
            paddingBottom: '20px',
          }}
          className="flex items-center justify-between px-2 border-b border-white/10 shrink-0"
        >
          <button
            onClick={onClose}
            className="flex items-center gap-3 text-left cursor-pointer group"
            title="Закрыть меню"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center backdrop-blur-md border border-white/10 shadow-sm shrink-0 group-hover:scale-105 group-hover:bg-white/[0.08] group-hover:border-white/20 transition-all">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold tracking-tight text-white leading-tight">
                InDan
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                CIO Executive Portal
              </span>
            </div>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer shadow-sm"
            title="Закрыть меню"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Список навигации */}
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 pb-4">
          {navItems.map(({ id, label, icon: Icon, description }) => {
            const isActive = activeScreen === id;
            return (
              <button
                key={id}
                onClick={() => {
                  onNavigate(id);
                  onClose();
                }}
                style={{
                  paddingLeft: '18px',
                  paddingRight: '14px',
                  gap: '18px',
                }}
                className={`w-full flex items-center py-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer text-left group ${
                  isActive
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/15 font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] hover:border-white/10 border border-transparent'
                }`}
              >
                <div className="w-5 flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate">{label}</span>
                  <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-normal truncate">
                    {description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Нижние действия */}
        <div 
          style={{
            marginTop: 'auto',
            paddingTop: '28px',
          }}
          className="border-t border-white/10 flex flex-col gap-2 shrink-0"
        >
          <button
            onClick={() => {
              onNavigate('settings');
              onClose();
            }}
            style={{
              paddingLeft: '18px',
              paddingRight: '14px',
              gap: '18px',
            }}
            className={`w-full flex items-center py-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer text-left group ${
              activeScreen === 'settings'
                ? 'bg-white/[0.08] text-white border border-white/15 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/10'
            }`}
          >
            <div className="w-5 flex items-center justify-center shrink-0">
              <Settings className={`w-4 h-4 ${activeScreen === 'settings' ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
            </div>
            <span>Настройки системы</span>
          </button>
        </div>
      </aside>
    </>
  );
}

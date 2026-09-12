import React from 'react';
import {
  Plus,
  Sparkles,
  Image,
  History,
  Download,
  PanelLeftClose,
  PanelLeft,
  X,
  ListOrdered,
} from 'lucide-react';
import { SessionItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeView: 'studio' | 'queue' | 'gallery';
  onSelectView: (view: 'studio' | 'queue' | 'gallery') => void;
  onNewGeneration: () => void;
  sessions: SessionItem[];
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  totalTasksCount: number;
  resultsCount: number;
  isRunning: boolean;
  deferredPrompt: any;
  onInstallPwa: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeView,
  onSelectView,
  onNewGeneration,
  sessions,
  currentSessionId,
  onSelectSession,
  totalTasksCount,
  resultsCount,
  isRunning,
  deferredPrompt,
  onInstallPwa,
}) => {
  const handleViewClick = (view: 'studio' | 'queue' | 'gallery') => {
    onSelectView(view);
    if (window.innerWidth < 1024 && isOpen) {
      onToggle();
    }
  };

  const handleNewGenClick = () => {
    onNewGeneration();
    if (window.innerWidth < 1024 && isOpen) {
      onToggle();
    }
  };

  const handleSessionClick = (id: string) => {
    onSelectSession(id);
    if (window.innerWidth < 1024 && isOpen) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-deep-charcoal/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-sidebar-mist border-r border-hairline transition-all duration-300 ${
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        {/* Header */}
        <div className="h-14 border-b border-hairline flex items-center justify-between px-3.5">
          {isOpen ? (
            <>
              <img
                src="./logo.svg"
                alt="Logo"
                className="h-6 w-auto object-contain shrink-0 text-graphite-ink"
              />
              <button
                onClick={onToggle}
                className="text-mid-ash hover:text-graphite-ink p-1.5 rounded-[10px] hover:bg-hover-veil transition"
                title="Свернуть панель"
              >
                <PanelLeftClose className="w-4 h-4 hidden lg:block" />
                <X className="w-4 h-4 lg:hidden" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="w-full h-full flex items-center justify-center text-mid-ash hover:text-graphite-ink rounded-[10px] hover:bg-hover-veil transition"
              title="Развернуть панель"
            >
              <PanelLeft className="w-5 h-5 hidden lg:block" />
            </button>
          )}
        </div>

        {/* New Generation Button */}
        <div className="p-3">
          <button
            onClick={handleNewGenClick}
            className={`w-full flex items-center justify-center gap-2 bg-graphite-ink hover:bg-ink-press text-pure-white font-medium text-xs py-2 px-3 rounded-[10px] transition ${
              !isOpen && 'lg:px-0'
            }`}
            title="Новая генерация"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {isOpen && <span>Новая генерация</span>}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-2 space-y-1">
          {/* Studio Tab */}
          <button
            onClick={() => handleViewClick('studio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-medium transition ${
              activeView === 'studio'
                ? 'bg-hover-veil text-graphite-ink font-semibold'
                : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
            } ${!isOpen && 'lg:justify-center lg:px-0'}`}
            title="Студия создания"
          >
            <Sparkles className="w-4 h-4 text-graphite-ink shrink-0" />
            {isOpen && <span>Студия (Создание)</span>}
          </button>

          {/* Queue Tab */}
          <button
            onClick={() => handleViewClick('queue')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-medium transition ${
              activeView === 'queue'
                ? 'bg-hover-veil text-graphite-ink font-semibold'
                : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
            } ${!isOpen && 'lg:justify-center lg:px-0'}`}
            title="Очередь задач"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ListOrdered className="w-4 h-4 text-graphite-ink shrink-0" />
              {isOpen && <span>Очередь задач</span>}
            </div>
            {isOpen && totalTasksCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-[10px] font-mono border ${
                isRunning
                  ? 'bg-graphite-ink text-pure-white border-graphite-ink animate-pulse'
                  : 'bg-pure-white border-hairline text-mid-ash'
              }`}>
                {totalTasksCount}
              </span>
            )}
          </button>

          {/* Gallery Tab */}
          <button
            onClick={() => handleViewClick('gallery')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-medium transition ${
              activeView === 'gallery'
                ? 'bg-hover-veil text-graphite-ink font-semibold'
                : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
            } ${!isOpen && 'lg:justify-center lg:px-0'}`}
            title="Галерея результатов"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Image className="w-4 h-4 text-graphite-ink shrink-0" />
              {isOpen && <span className="truncate">Галерея</span>}
            </div>
            {isOpen && resultsCount > 0 && (
              <span className="text-[10px] bg-pure-white border border-hairline text-mid-ash px-1.5 py-0.5 rounded-[10px] font-mono">
                {resultsCount}
              </span>
            )}
          </button>
        </div>

        {/* Sessions History List */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-semibold text-mid-ash uppercase tracking-wider">
              <History className="w-3 h-3" />
              <span>История запусков</span>
            </div>

            {sessions.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-hollow">
                Пока нет сохраненных запусков
              </p>
            ) : (
              sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => handleSessionClick(sess.id)}
                  className={`w-full text-left p-2 rounded-[10px] text-xs transition border ${
                    currentSessionId === sess.id
                      ? 'bg-pure-white border-hairline text-graphite-ink font-medium'
                      : 'border-transparent text-mid-ash hover:bg-hover-veil hover:text-graphite-ink'
                  }`}
                >
                  <p className="truncate font-medium">{sess.title}</p>
                  <p className="text-[10px] text-hollow mt-0.5 font-mono">
                    {sess.totalTasks} задач • {sess.date}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

        {!isOpen && <div className="flex-1" />}

        {/* Bottom Section */}
        <div className="border-t border-hairline p-2.5 space-y-2">
          {isOpen && (
            <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-graphite-ink font-medium">
              <span className="w-2 h-2 rounded-full bg-graphite-ink" />
              <span>1.5K Ultra HD</span>
            </div>
          )}

          {deferredPrompt && (
            <button
              onClick={onInstallPwa}
              className={`w-full flex items-center justify-center gap-2 bg-pure-white hover:bg-hover-veil border border-hairline text-graphite-ink font-medium text-xs py-1.5 px-3 rounded-full transition ${
                !isOpen && 'lg:px-0'
              }`}
              title="Установить PWA"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              {isOpen && <span>Установить PWA</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

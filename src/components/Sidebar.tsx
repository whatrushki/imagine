import React, { useRef } from 'react';
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
  Trash2,
} from 'lucide-react';
import { SessionItem } from '../types';
import { CURRENT_VERSION } from '../lib/updateChecker';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeView: 'studio' | 'queue' | 'gallery';
  onSelectView: (view: 'studio' | 'queue' | 'gallery') => void;
  onNewGeneration: () => void;
  sessions: SessionItem[];
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onClearHistory?: () => void;
  onDeleteSession?: (id: string) => void;
  totalTasksCount: number;
  resultsCount: number;
  isRunning: boolean;
  deferredPrompt: any;
  onInstallPwa: () => void;
  hasUpdate?: boolean;
  latestVersion?: string;
  onOpenUpdateModal?: () => void;
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
  onClearHistory,
  onDeleteSession,
  totalTasksCount,
  resultsCount,
  isRunning,
  deferredPrompt,
  onInstallPwa,
  hasUpdate,
  latestVersion,
  onOpenUpdateModal,
}) => {
  const handleViewClick = (view: 'studio' | 'queue' | 'gallery') => {
    onSelectView(view);
    if (view === 'gallery') {
      onSelectSession('');
    }
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

  // Touch gesture to swipe-close sidebar on mobile
  const asideTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    asideTouchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!asideTouchStartRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - asideTouchStartRef.current.x;
    const deltaY = e.touches[0].clientY - asideTouchStartRef.current.y;
    if (deltaX < -30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1 && isOpen) {
      onToggle();
      asideTouchStartRef.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!asideTouchStartRef.current || e.changedTouches.length !== 1) return;
    const deltaX = e.changedTouches[0].clientX - asideTouchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - asideTouchStartRef.current.y;
    if (deltaX < -30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1 && isOpen) {
      onToggle();
    }
    asideTouchStartRef.current = null;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 bg-deep-charcoal/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container with Safe Area Support */}
      <aside
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-sidebar-mist border-r border-hairline transition-all duration-300 pt-safe pb-safe pl-safe ${
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        {/* Header */}
        <div className="h-14 border-b border-hairline flex items-center justify-between px-3 shrink-0">
          {isOpen ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-pure-white border border-hairline flex items-center justify-center shadow-xs shrink-0">
                  <img
                    src="./logo.svg"
                    alt="Imagine"
                    className="w-5 h-auto object-contain text-graphite-ink"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs text-graphite-ink leading-tight truncate">Imagine</span>
                  <span className="text-[10px] font-mono text-mid-ash leading-none">by W.H.A.T.</span>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="text-mid-ash hover:text-graphite-ink p-1.5 rounded-lg hover:bg-hover-veil transition"
                title="Свернуть панель"
              >
                <PanelLeftClose className="w-4 h-4 hidden lg:block" />
                <X className="w-4 h-4 lg:hidden" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="w-full h-full flex items-center justify-center text-mid-ash hover:text-graphite-ink rounded-lg hover:bg-hover-veil transition group"
              title="Развернуть панель"
            >
              <div className="w-8 h-8 rounded-xl bg-pure-white border border-hairline flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition">
                <img
                  src="./logo.svg"
                  alt="Imagine"
                  className="w-5 h-auto object-contain text-graphite-ink"
                />
              </div>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="px-2 pt-3 space-y-1 shrink-0">
          {/* Studio Tab */}
          <button
            onClick={() => handleViewClick('studio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeView === 'studio'
                ? 'bg-hover-veil text-graphite-ink font-semibold'
                : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
            } ${!isOpen && 'lg:justify-center lg:px-0'}`}
            title="Студия создания"
          >
            <Sparkles className="w-4 h-4 text-graphite-ink shrink-0" />
            {isOpen && <span>Студия</span>}
          </button>

          {/* Queue Tab */}
          <button
            onClick={() => handleViewClick('queue')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeView === 'queue'
                ? 'bg-hover-veil text-graphite-ink font-semibold'
                : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
            } ${!isOpen && 'lg:justify-center lg:px-0'}`}
            title="Очередь задач"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ListOrdered className="w-4 h-4 text-graphite-ink shrink-0" />
              {isOpen && <span>Очередь</span>}
            </div>
            {isOpen && totalTasksCount > 0 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                  isRunning
                    ? 'bg-graphite-ink text-pure-white border-graphite-ink animate-pulse'
                    : 'bg-pure-white border-hairline text-mid-ash'
                }`}
              >
                {totalTasksCount}
              </span>
            )}
          </button>

          {/* Gallery Tab */}
          <button
            onClick={() => handleViewClick('gallery')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
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
              <span className="text-[10px] bg-pure-white border border-hairline text-mid-ash px-2 py-0.5 rounded-full font-mono">
                {resultsCount}
              </span>
            )}
          </button>
        </div>

        {/* Sessions History List with Clear History button */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            <div className="flex items-center justify-between px-1 py-1 text-[11px] font-semibold text-mid-ash uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>История</span>
              </div>
              {sessions.length > 0 && onClearHistory && (
                <button
                  onClick={onClearHistory}
                  className="text-mid-ash hover:text-red-600 transition p-1 rounded-md hover:bg-red-50"
                  title="Очистить историю запусков"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-hollow">
                История пуста
              </p>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`group flex items-center justify-between p-2 rounded-xl text-xs transition border ${
                    currentSessionId === sess.id
                      ? 'bg-pure-white border-hairline text-graphite-ink font-medium shadow-2xs'
                      : 'border-transparent text-mid-ash hover:bg-hover-veil hover:text-graphite-ink'
                  }`}
                >
                  <button
                    onClick={() => handleSessionClick(sess.id)}
                    className="flex-1 text-left min-w-0 pr-1"
                  >
                    <p className="truncate font-medium">{sess.title}</p>
                    <p className="text-[10px] text-hollow mt-0.5 font-mono">
                      {sess.totalTasks} фото • {sess.date}
                    </p>
                  </button>

                  {onDeleteSession && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(sess.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-600 text-mid-ash transition shrink-0"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {!isOpen && <div className="flex-1" />}

        {/* Bottom Section */}
        <div className="border-t border-hairline p-2.5 space-y-2 shrink-0">
          {hasUpdate && onOpenUpdateModal && (
            <button
              onClick={onOpenUpdateModal}
              className={`w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-pure-white font-medium text-xs py-1.5 px-3 rounded-full transition active:scale-95 shadow-xs animate-pulse ${
                !isOpen && 'lg:px-0'
              }`}
              title="Доступна новая версия Imagine"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              {isOpen && <span>Обновление v{latestVersion}</span>}
            </button>
          )}

          {isOpen && onOpenUpdateModal && (
            <div className="flex items-center justify-end px-2 py-0.5 text-[11px] text-mid-ash">
              <button
                onClick={onOpenUpdateModal}
                className="font-mono text-mid-ash hover:text-graphite-ink hover:underline"
                title="Проверить обновления"
              >
                v{CURRENT_VERSION}
              </button>
            </div>
          )}

          {deferredPrompt && (
            <button
              onClick={onInstallPwa}
              className={`w-full flex items-center justify-center gap-2 bg-pure-white hover:bg-hover-veil border border-hairline text-graphite-ink font-medium text-xs py-1.5 px-3 rounded-full transition active:scale-95 ${
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

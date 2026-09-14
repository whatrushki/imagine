import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  RotateCw,
  Plus,
  Image as ImageIcon,
  Maximize2,
  Check,
  Sparkles,
  X,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { MatrixTask, PhotoItem } from '../types';

interface ResultsFeedProps {
  tasks: MatrixTask[];
  photos: PhotoItem[];
  isRunning: boolean;
  onStop: () => void;
  onNewGeneration: () => void;
  onRegenerateTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDownloadZip: () => void;
  onDownloadSingle: (task: MatrixTask) => void;
  onOpenLightbox: (task: MatrixTask) => void;
  onClearGallery?: () => void;
  onSaveAllToGallery?: () => void;
  onSendSelectedToStudio?: (tasks: MatrixTask[]) => void;
  onDownloadSelected?: (tasks: MatrixTask[]) => void;
  selectionMode?: boolean;
  setSelectionMode?: (val: boolean) => void;
  isSessionFiltered?: boolean;
  onResetSessionFilter?: () => void;
}

export const ResultsFeed: React.FC<ResultsFeedProps> = ({
  tasks,
  photos,
  isRunning,
  onStop,
  onNewGeneration,
  onRegenerateTask,
  onDeleteTask,
  onDownloadZip,
  onDownloadSingle,
  onOpenLightbox,
  onClearGallery,
  onSaveAllToGallery,
  onSendSelectedToStudio,
  onDownloadSelected,
  selectionMode: externalSelectionMode,
  setSelectionMode: externalSetSelectionMode,
  isSessionFiltered,
  onResetSessionFilter,
}) => {
  const [internalSelectionMode, setInternalSelectionMode] = useState(false);
  const selectionMode = externalSelectionMode !== undefined ? externalSelectionMode : internalSelectionMode;
  const setSelectionMode = externalSetSelectionMode || setInternalSelectionMode;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    task: MatrixTask;
  } | null>(null);

  const longPressTimerRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Gallery is the permanent storage vault: show successful completed images
  const successTasks = tasks.filter((t) => t.status === 'success' && t.resultUrl);

  const isMobile =
    typeof navigator !== 'undefined' &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      !!(window as any).Capacitor?.isNativePlatform?.());

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handlePointerDown = (e: PointerEvent | MouseEvent) => {
      const el = document.getElementById('gallery-context-menu');
      if (el && !el.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    // Small delay ensures the opening click/event doesn't immediately dismiss the menu
    const timer = window.setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown);
    }, 50);

    window.addEventListener('keydown', handleKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [contextMenu]);

  const toggleSelect = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === successTasks.length) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedIds(new Set(successTasks.map((t) => t.id)));
      setSelectionMode(true);
    }
  };

  // Touch handlers for long-press selection on mobile
  const handleTouchStart = (task: MatrixTask, e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    longPressTimerRef.current = window.setTimeout(() => {
      setSelectionMode(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(task.id);
        return next;
      });
      try {
        navigator.vibrate?.(45);
      } catch {}
      longPressTimerRef.current = null;
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartPosRef.current.x;
    const dy = e.touches[0].clientY - touchStartPosRef.current.y;
    if (Math.hypot(dx, dy) > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCardClick = (task: MatrixTask) => {
    if (selectionMode) {
      toggleSelect(task.id);
    } else {
      onOpenLightbox(task);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, task: MatrixTask) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 190;
    const menuHeight = 230;
    const x = Math.min(Math.max(12, e.clientX), window.innerWidth - menuWidth - 12);
    const y = Math.min(Math.max(12, e.clientY), window.innerHeight - menuHeight - 12);
    setContextMenu({
      x,
      y,
      task,
    });
  };

  const selectedTasks = successTasks.filter((t) => selectedIds.has(t.id));

  return (
    <div className="max-w-6xl mx-auto w-full pb-32 px-1 sm:px-4 pt-2 sm:pt-4">
      {/* Grid of Results */}
      {successTasks.length === 0 ? (
        /* Empty state: Clean minimal message */
        <div className="py-20 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sidebar-mist border border-hairline mx-auto flex items-center justify-center text-mid-ash">
            <ImageIcon className="w-6 h-6 opacity-60" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-graphite-ink">
              {isSessionFiltered
                ? 'В этой генерации нет завершённых изображений'
                : 'В галерее пока ничего нет'}
            </p>
            <p className="text-xs text-mid-ash max-w-sm mx-auto leading-relaxed">
              {isSessionFiltered
                ? 'Задачи этой сессии ещё могут выполняться в очереди или были удалены.'
                : 'Все сгенерированные фотографии автоматически сохраняются здесь по мере завершения в очереди.'}
            </p>
          </div>
          {isSessionFiltered && onResetSessionFilter ? (
            <button
              onClick={onResetSessionFilter}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-graphite-ink text-pure-white px-4 py-2 rounded-full hover:bg-black transition active:scale-95 shadow-xs"
            >
              <span>Показать всю галерею</span>
            </button>
          ) : (
            <button
              onClick={onNewGeneration}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-graphite-ink text-pure-white px-4 py-2 rounded-full hover:bg-black transition active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Перейти в студию</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Grid: 3-column square images with modern rounded corners */}
          <div className="grid grid-cols-3 gap-2 sm:hidden px-0.5">
            {successTasks.map((task) => {
              const isSelected = selectedIds.has(task.id);
              return (
                <div
                  key={`mobile-${task.id}`}
                  onClick={() => handleCardClick(task)}
                  onTouchStart={(e) => handleTouchStart(task, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onContextMenu={(e) => handleContextMenu(e, task)}
                  className={`aspect-square relative rounded-xl overflow-hidden bg-sidebar-mist border transition cursor-pointer select-none active:scale-97 ${
                    isSelected
                      ? 'ring-2 ring-graphite-ink border-transparent shadow-md'
                      : 'border-hairline/60 shadow-2xs'
                  }`}
                >
                  <img
                    src={task.resultUrl!}
                    alt=""
                    className="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                  />

                  {/* Selection Checkbox Badge */}
                  {selectionMode ? (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition shadow ${
                          isSelected
                            ? 'bg-graphite-ink text-pure-white'
                            : 'bg-black/40 text-transparent border border-white/70 backdrop-blur-xs'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  ) : (
                    /* Mobile 3-dots Quick Options Trigger */
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({
                          x: Math.min(Math.max(12, rect.left - 140), window.innerWidth - 190),
                          y: Math.min(Math.max(12, rect.bottom + 6), window.innerHeight - 230),
                          task,
                        });
                      }}
                      className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/45 hover:bg-black/65 text-pure-white flex items-center justify-center backdrop-blur-xs transition active:scale-90 shadow"
                      title="Меню действий"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop / Tablet Grid: Clean minimal cards */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1">
            {successTasks.map((task) => {
              const isSelected = selectedIds.has(task.id);
              return (
                <div
                  key={task.id}
                  className={`group relative aspect-square rounded-2xl overflow-hidden bg-sidebar-mist border transition cursor-pointer select-none ${
                    isSelected
                      ? 'ring-2 ring-graphite-ink border-transparent shadow-md'
                      : 'border-hairline shadow-xs hover:shadow'
                  }`}
                  onClick={() => handleCardClick(task)}
                  onContextMenu={(e) => handleContextMenu(e, task)}
                >
                  <img
                    src={task.resultUrl!}
                    alt={task.promptText}
                    className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    loading="lazy"
                  />

                  {/* Selection Checkbox Pill on Desktop */}
                  {selectionMode ? (
                    <div className="absolute top-2.5 left-2.5 z-20">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition shadow ${
                          isSelected
                            ? 'bg-graphite-ink text-pure-white'
                            : 'bg-black/35 hover:bg-black/50 text-transparent border border-white/70 backdrop-blur-xs'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  ) : (
                    /* Top Action Hover Overlay (When not in select mode) */
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({
                            x: Math.min(Math.max(12, rect.left - 140), window.innerWidth - 190),
                            y: Math.min(Math.max(12, rect.bottom + 6), window.innerHeight - 230),
                            task,
                          });
                        }}
                        className="p-2 rounded-full bg-black/70 hover:bg-black text-pure-white backdrop-blur-xs transition shadow active:scale-90"
                        title="Действия"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadSingle(task);
                        }}
                        className="p-2 rounded-full bg-black/70 hover:bg-black text-pure-white backdrop-blur-xs transition shadow active:scale-90"
                        title="Скачать фото"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLightbox(task);
                        }}
                        className="p-2 rounded-full bg-black/70 hover:bg-black text-pure-white backdrop-blur-xs transition shadow active:scale-90"
                        title="На весь экран"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Bottom Prompt Caption Gradient */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-pure-white">
                    <p className="text-xs font-medium line-clamp-2 drop-shadow-xs">
                      {task.promptText}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-pure-white/70 font-mono">
                      <span className="truncate">{task.photoName}</span>
                      {task.duration && <span>• {task.duration.toFixed(1)}с</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Floating Multi-Select Toolbar (Adaptive for Mobile & Desktop) */}
      {selectionMode && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 sm:max-w-md w-auto bg-graphite-ink text-pure-white rounded-2xl p-2 sm:p-2.5 shadow-2xl border border-hairline/20 flex items-center justify-between gap-1.5 sm:gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 min-w-0 shrink-0">
            <span className="text-xs font-semibold whitespace-nowrap bg-white/15 px-2 py-0.5 rounded-lg">
              {selectedIds.size}
              <span className="hidden xs:inline ml-1 font-normal text-white/80">выбрано</span>
            </span>
            <button
              onClick={handleSelectAll}
              className="text-[11px] text-white/70 hover:text-white underline whitespace-nowrap shrink-0"
            >
              {selectedIds.size === successTasks.length ? 'Снять' : 'Все'}
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={() => {
                    if (onDownloadSelected) {
                      onDownloadSelected(selectedTasks);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs bg-pure-white text-graphite-ink px-2.5 sm:px-3 py-1.5 rounded-xl font-medium hover:bg-white/90 active:scale-95 transition shadow-xs whitespace-nowrap shrink-0"
                  title={isMobile ? 'Сохранить в галерею устройства' : 'Скачать выбранные'}
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] sm:text-xs">{isMobile ? 'В галерею' : 'Скачать'}</span>
                </button>

                {onSendSelectedToStudio && (
                  <button
                    onClick={() => {
                      onSendSelectedToStudio(selectedTasks);
                    }}
                    className="inline-flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-pure-white px-2 sm:px-2.5 py-1.5 rounded-xl font-medium active:scale-95 transition backdrop-blur-xs whitespace-nowrap shrink-0"
                    title="Отправить в студию на новую генерацию"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline text-[11px] sm:text-xs">В студию</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition shrink-0"
              title="Отмена"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Shadcn-styled Desktop / Mobile Context Menu */}
      {contextMenu && (
        <div
          id="gallery-context-menu"
          className="fixed z-50 min-w-[180px] bg-pure-white text-graphite-ink border border-hairline rounded-xl shadow-2xl p-1 text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setSelectionMode(true);
              toggleSelect(contextMenu.task.id);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-hover-veil transition font-medium text-left"
          >
            <Check className="w-3.5 h-3.5 text-mid-ash" />
            <span>
              {selectedIds.has(contextMenu.task.id) ? 'Снять выбор' : 'Выбрать'}
            </span>
          </button>

          <button
            onClick={() => {
              onDownloadSingle(contextMenu.task);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-hover-veil transition font-medium text-left"
          >
            <Download className="w-3.5 h-3.5 text-mid-ash" />
            <span>{isMobile ? 'В галерею' : 'Скачать'}</span>
          </button>

          {onSendSelectedToStudio && (
            <button
              onClick={() => {
                onSendSelectedToStudio([contextMenu.task]);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-hover-veil transition font-medium text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-mid-ash" />
              <span>В студию (повтор)</span>
            </button>
          )}

          <button
            onClick={() => {
              onRegenerateTask(contextMenu.task.id);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-hover-veil transition font-medium text-left"
          >
            <RotateCw className="w-3.5 h-3.5 text-mid-ash" />
            <span>Повторная генерация</span>
          </button>

          <div className="h-[1px] bg-hairline my-1" />

          <button
            onClick={() => {
              onOpenLightbox(contextMenu.task);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-hover-veil transition font-medium text-left text-mid-ash"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Открыть</span>
          </button>

          {onDeleteTask && (
            <button
              onClick={() => {
                onDeleteTask(contextMenu.task.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 transition font-medium text-left"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Удалить</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};


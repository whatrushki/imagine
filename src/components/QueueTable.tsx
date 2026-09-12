import React, { useState } from 'react';
import {
  Play,
  Square,
  Download,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Maximize2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { MatrixTask } from '../types';

interface QueueTableProps {
  tasks: MatrixTask[];
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onRegenerateTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onClearCompleted?: () => void;
  onClearAll?: () => void;
  onDownloadZip: () => void;
  onDownloadSingle: (task: MatrixTask) => void;
  onOpenLightbox?: (task: MatrixTask) => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({
  tasks,
  isRunning,
  onStart,
  onStop,
  onRegenerateTask,
  onDeleteTask,
  onClearCompleted,
  onClearAll,
  onDownloadZip,
  onDownloadSingle,
  onOpenLightbox,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'success' | 'error'>('all');

  const total = tasks.length;
  const successCount = tasks.filter((t) => t.status === 'success').length;
  const errorCount = tasks.filter((t) => t.status === 'error').length;
  const processingCount = tasks.filter(
    (t) => t.status === 'processing' || t.status === 'requeued'
  ).length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = successCount + errorCount;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  // Active / featured task for top hero card:
  // 1. Currently processing / requeued
  // 2. Or most recent finished task
  // 3. Or first pending task
  const activeTask =
    tasks.find((t) => t.status === 'processing' || t.status === 'requeued') ||
    [...tasks].reverse().find((t) => t.status === 'success' && t.resultUrl) ||
    tasks.find((t) => t.status === 'pending') ||
    tasks[0] ||
    null;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending')
      return (
        t.status === 'pending' ||
        t.status === 'processing' ||
        t.status === 'requeued'
      );
    if (filter === 'success') return t.status === 'success';
    if (filter === 'error') return t.status === 'error';
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto w-full pb-28 px-1 sm:px-4">
      {/* 1. TOP HERO: Current Image (as requested: "сверху изображение текущее") */}
      {activeTask && (
        <div className="mb-4">
          <div
            className="relative w-full aspect-[16/10] max-h-[280px] sm:max-h-[340px] rounded-2xl overflow-hidden bg-sidebar-mist border border-hairline group cursor-pointer select-none"
            onClick={() => {
              if (activeTask.resultUrl && onOpenLightbox) {
                onOpenLightbox(activeTask);
              }
            }}
          >
            <img
              src={activeTask.resultUrl || activeTask.photoDataUrl || ''}
              alt={activeTask.photoName}
              className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
            />

            {/* Top glass pill badge */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/70 backdrop-blur-md text-pure-white shadow-xs">
                {activeTask.status === 'processing' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>Генерация в процессе...</span>
                  </>
                ) : activeTask.status === 'requeued' ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>Повторная попытка ({activeTask.failCount}/5)</span>
                  </>
                ) : activeTask.status === 'success' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Последний результат</span>
                  </>
                ) : activeTask.status === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Ошибка генерации</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Ожидает генерации</span>
                  </>
                )}
              </span>

              {activeTask.resultUrl && onOpenLightbox && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLightbox(activeTask);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-black/70 hover:bg-black text-pure-white backdrop-blur-md pointer-events-auto transition active:scale-95"
                  title="На весь экран"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Открыть</span>
                </button>
              )}
            </div>

            {/* Bottom gradient prompt info banner */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 sm:p-4 text-pure-white">
              <p className="text-xs sm:text-sm font-medium line-clamp-2 drop-shadow-xs">
                {activeTask.promptText}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-pure-white/75 font-mono">
                <span className="truncate">{activeTask.photoName}</span>
                {activeTask.duration && (
                  <span>• {activeTask.duration.toFixed(1)}с</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROGRESS BAR & CONTROLS (as requested: "под ним прогресс бар") */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-graphite-ink">
            {total === 0
              ? 'Очередь пуста'
              : isRunning
              ? `Выполняется: ${completedCount} из ${total}`
              : completedCount === total
              ? `Все ${total} задач завершены`
              : `Готово ${successCount} из ${total} (${pendingCount + processingCount} в очереди)`}
          </span>
          <span className="font-bold text-graphite-ink">{percent}%</span>
        </div>

        {/* Smooth rounded progress track */}
        <div className="w-full h-2 bg-sidebar-mist rounded-full overflow-hidden border border-hairline/40">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isRunning ? 'bg-graphite-ink' : 'bg-graphite-ink'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Controls row for phone & desktop */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Main playback & zip actions */}
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={onStop}
                className="inline-flex items-center gap-1.5 bg-graphite-ink hover:bg-black text-pure-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Пауза</span>
              </button>
            ) : (
              (pendingCount > 0 || errorCount > 0) && (
                <button
                  onClick={onStart}
                  className="inline-flex items-center gap-1.5 bg-graphite-ink hover:bg-black text-pure-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{completedCount > 0 ? 'Продолжить' : 'Запустить'}</span>
                </button>
              )
            )}

            {successCount > 0 && (
              <button
                onClick={onDownloadZip}
                className="inline-flex items-center gap-1.5 border border-hairline hover:bg-hover-veil text-graphite-ink text-xs font-medium px-3.5 py-2 rounded-full transition active:scale-95"
                title="Скачать все готовые в ZIP"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ZIP ({successCount})</span>
              </button>
            )}
          </div>

          {/* Clean minimal clear buttons */}
          <div className="flex items-center gap-1">
            {onClearCompleted && completedCount > 0 && !isRunning && (
              <button
                onClick={onClearCompleted}
                className="text-xs text-mid-ash hover:text-graphite-ink px-2.5 py-1.5 rounded-lg transition hover:bg-hover-veil"
                title="Убрать завершенные задачи"
              >
                Очистить готовые
              </button>
            )}
            {onClearAll && total > 0 && !isRunning && (
              <button
                onClick={onClearAll}
                className="text-xs text-mid-ash hover:text-red-600 px-2.5 py-1.5 rounded-lg transition hover:bg-red-50"
                title="Очистить всю очередь"
              >
                Очистить всё
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. QUEUE LIST (as requested: "и под ним уже очередь") */}
      <div className="pt-2">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              filter === 'all'
                ? 'bg-graphite-ink text-pure-white'
                : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
            }`}
          >
            Все ({total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              filter === 'pending'
                ? 'bg-graphite-ink text-pure-white'
                : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
            }`}
          >
            В очереди ({pendingCount + processingCount})
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              filter === 'success'
                ? 'bg-graphite-ink text-pure-white'
                : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
            }`}
          >
            Готовые ({successCount})
          </button>
          {errorCount > 0 && (
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                filter === 'error'
                  ? 'bg-red-600 text-pure-white'
                  : 'text-red-500 hover:text-red-700 hover:bg-red-50'
              }`}
            >
              Сбои ({errorCount})
            </button>
          )}
        </div>

        {/* Empty state */}
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center space-y-2 border-t border-hairline">
            <Sparkles className="w-7 h-7 text-mid-ash mx-auto opacity-40" />
            <p className="text-sm font-medium text-graphite-ink">Список пуст</p>
            <p className="text-xs text-mid-ash">
              {total === 0
                ? 'Загрузите фото на главной странице и начните генерацию'
                : 'В этой категории пока нет задач'}
            </p>
          </div>
        ) : (
          /* Flat edge-to-edge list with hairline dividers (no block-in-block cards!) */
          <div className="divide-y divide-hairline border-t border-hairline">
            {filteredTasks.map((task) => {
              const isProcessing = task.status === 'processing';
              const isRequeued = task.status === 'requeued';
              const isSuccess = task.status === 'success' && !!task.resultUrl;
              const isError = task.status === 'error';

              return (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-sidebar-mist/60 transition group px-1 sm:px-2 rounded-xl"
                >
                  {/* Fixed-size thumbnail with guaranteed width/height */}
                  <div
                    style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', maxWidth: '56px', maxHeight: '56px' }}
                    className="relative rounded-xl overflow-hidden bg-sidebar-mist shrink-0 border border-hairline cursor-pointer"
                    onClick={() => {
                      if (isSuccess && onOpenLightbox) {
                        onOpenLightbox(task);
                      }
                    }}
                  >
                    <img
                      src={isSuccess ? task.resultUrl! : task.photoDataUrl || ''}
                      alt={task.photoName}
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Overlay status badge */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-pure-white/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="w-5 h-5 border-2 border-graphite-ink border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {isRequeued && (
                      <div className="absolute inset-0 bg-pure-white/70 backdrop-blur-xs flex items-center justify-center">
                        <RotateCw className="w-4 h-4 text-amber-600 animate-spin" />
                      </div>
                    )}
                    {isSuccess && (
                      <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs rounded-full p-0.5 text-pure-white">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Prompt info & meta */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-xs sm:text-sm font-medium text-graphite-ink truncate leading-tight">
                      {task.promptText}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-mid-ash flex-wrap">
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                          Генерация 1.5K...
                        </span>
                      )}
                      {isRequeued && (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                          <RotateCw className="w-3 h-3 animate-spin" />
                          Повтор ({task.failCount}/5)
                        </span>
                      )}
                      {isSuccess && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Готово{task.duration ? ` • ${task.duration.toFixed(1)}с` : ''}
                        </span>
                      )}
                      {isError && (
                        <span className="inline-flex items-center gap-1 font-medium text-red-600 truncate max-w-[200px]" title={task.error}>
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {task.error ? task.error.slice(0, 32) : 'Сбой'}
                        </span>
                      )}
                      {!isProcessing && !isRequeued && !isSuccess && !isError && (
                        <span className="inline-flex items-center gap-1 text-mid-ash">
                          <Clock className="w-3 h-3" />
                          В очереди
                        </span>
                      )}

                      <span className="opacity-40">•</span>
                      <span className="font-mono text-mid-ash truncate max-w-[120px] sm:max-w-[200px]">
                        {task.photoName}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    {isSuccess && (
                      <>
                        <button
                          onClick={() => onDownloadSingle(task)}
                          className="p-2 rounded-xl text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition active:scale-90"
                          title="Сохранить в галерею"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {onOpenLightbox && (
                          <button
                            onClick={() => onOpenLightbox(task)}
                            className="p-2 rounded-xl text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition active:scale-90"
                            title="На весь экран"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {(isError || isRequeued || (!isRunning && !isSuccess)) && (
                      <button
                        onClick={() => onRegenerateTask(task.id)}
                        className="p-2 rounded-xl text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition active:scale-90"
                        title="Повторить генерацию"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    )}

                    {onDeleteTask && !isProcessing && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 rounded-xl text-mid-ash hover:text-red-600 hover:bg-red-50 transition active:scale-90"
                        title="Удалить задачу"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

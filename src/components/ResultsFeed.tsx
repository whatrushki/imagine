import React, { useState } from 'react';
import {
  Download,
  RotateCw,
  Maximize2,
  Square,
  AlertCircle,
  Plus,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import { MatrixTask, PhotoItem } from '../types';

interface ResultsFeedProps {
  tasks: MatrixTask[];
  photos: PhotoItem[];
  isRunning: boolean;
  onStop: () => void;
  onNewGeneration: () => void;
  onRegenerateTask: (taskId: string) => void;
  onDownloadZip: () => void;
  onDownloadSingle: (task: MatrixTask) => void;
  onOpenLightbox: (task: MatrixTask) => void;
}

export const ResultsFeed: React.FC<ResultsFeedProps> = ({
  tasks,
  photos,
  isRunning,
  onStop,
  onNewGeneration,
  onRegenerateTask,
  onDownloadZip,
  onDownloadSingle,
  onOpenLightbox,
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [showingOriginalMap, setShowingOriginalMap] = useState<Record<string, boolean>>({});

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'success' || t.status === 'error').length;
  const successTasks = tasks.filter((t) => t.status === 'success');
  const errorTasks = tasks.filter((t) => t.status === 'error');
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'success') return t.status === 'success';
    if (filter === 'error') return t.status === 'error';
    return true;
  });

  const toggleOriginal = (taskId: string) => {
    setShowingOriginalMap((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-20 px-2 sm:px-4">
      {/* Top Header & Controls (Flat, Modern, Borderless) */}
      <div className="py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-graphite-ink">
              Галерея результатов
            </h1>
            <p className="text-xs text-mid-ash mt-0.5">
              {total === 0
                ? 'Нет сгенерированных изображений'
                : isRunning
                ? `Генерация: ${completed} из ${total} (${percent}%)`
                : `${successTasks.length} готово`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isRunning ? (
              <button
                onClick={onStop}
                className="inline-flex items-center gap-1.5 bg-graphite-ink hover:bg-black text-pure-white text-xs font-medium px-3.5 py-1.5 rounded-full transition shadow-xs"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Остановить</span>
              </button>
            ) : (
              <button
                onClick={onNewGeneration}
                className="inline-flex items-center gap-1.5 bg-graphite-ink hover:bg-black text-pure-white text-xs font-medium px-3.5 py-1.5 rounded-full transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Новая генерация</span>
              </button>
            )}

            {successTasks.length > 0 && (
              <button
                onClick={onDownloadZip}
                className="inline-flex items-center gap-1.5 border border-hairline hover:bg-hover-veil text-graphite-ink text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                title="Скачать все сгенерированные фото в ZIP"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ZIP</span>
                <span>({successTasks.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Hairline Progress Line */}
        {total > 0 && (
          <div className="w-full h-1 bg-sidebar-mist rounded-full overflow-hidden mt-3">
            <div
              className="bg-graphite-ink h-full transition-all duration-300 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        {/* Flat Filter Pills */}
        {total > 0 && (
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                filter === 'all'
                  ? 'bg-graphite-ink text-pure-white'
                  : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
              }`}
            >
              Все ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                filter === 'success'
                  ? 'bg-graphite-ink text-pure-white'
                  : 'text-mid-ash hover:text-graphite-ink hover:bg-hover-veil'
              }`}
            >
              Готовые ({successTasks.length})
            </button>
            {errorTasks.length > 0 && (
              <button
                onClick={() => setFilter('error')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                  filter === 'error'
                    ? 'bg-red-600 text-pure-white'
                    : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                }`}
              >
                Сбои ({errorTasks.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of Results */}
      {filteredTasks.length === 0 ? (
        <div className="bg-pure-white border border-hairline rounded-[10px] p-12 text-center text-mid-ash space-y-2">
          <Layers className="w-10 h-10 mx-auto text-hollow" />
          <p className="text-sm font-medium text-graphite-ink">Нет изображений для отображения</p>
          <p className="text-xs text-mid-ash">
            Перейдите во вкладку Студии и запустите генерацию, или проверьте вкладку Очереди.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Grid: Pure square images without captions (Instagram / Photos style) */}
          <div className="grid grid-cols-3 gap-1 sm:hidden">
        {filteredTasks.map((task) => (
          <div
            key={`mobile-${task.id}`}
            onClick={() => task.resultUrl && onOpenLightbox(task)}
            className="aspect-square relative overflow-hidden bg-sidebar-mist cursor-pointer active:opacity-80 transition"
          >
            {task.status === 'processing' ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-sidebar-mist">
                <span className="w-5 h-5 border-2 border-graphite-ink border-t-transparent rounded-full animate-spin" />
              </div>
            ) : task.status === 'requeued' ? (
              <div className="w-full h-full flex items-center justify-center bg-sidebar-mist">
                <RotateCw className="w-5 h-5 animate-spin text-mid-ash" />
              </div>
            ) : task.status === 'error' ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerateTask(task.id);
                }}
                className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-sidebar-mist"
              >
                <AlertCircle className="w-5 h-5 text-mid-ash" />
                <span className="text-[9px] text-mid-ash mt-0.5">Сбой</span>
              </div>
            ) : task.resultUrl ? (
              <img
                src={task.resultUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-sidebar-mist" />
            )}
          </div>
        ))}
      </div>

      {/* Desktop / Tablet Grid: Detailed Cards with Prompts & Controls */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => {
          const photo = photos.find((p) => p.id === task.photoId);
          const isShowingOriginal = showingOriginalMap[task.id];

          return (
            <div
              key={task.id}
              className="bg-pure-white border border-hairline rounded-[10px] overflow-hidden flex flex-col transition group hover:border-mid-ash"
            >
              {/* Media Container */}
              <div
                onClick={() => task.resultUrl && onOpenLightbox(task)}
                className="relative aspect-square bg-sidebar-mist flex items-center justify-center cursor-pointer overflow-hidden select-none"
              >
                {task.status === 'processing' ? (
                  <div className="flex flex-col items-center gap-2.5 text-graphite-ink text-xs">
                    <span className="w-8 h-8 border-2 border-graphite-ink border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium animate-pulse">Генерация 1.5K...</span>
                  </div>
                ) : task.status === 'requeued' ? (
                  <div className="flex flex-col items-center gap-2 text-graphite-ink text-xs text-center p-4">
                    <RotateCw className="w-6 h-6 animate-spin text-mid-ash" />
                    <span className="font-medium">Возвращено в очередь (повтор {task.failCount})...</span>
                  </div>
                ) : task.status === 'error' ? (
                  <div className="flex flex-col items-center gap-2 text-graphite-ink text-xs text-center p-4">
                    <AlertCircle className="w-7 h-7 text-mid-ash" />
                    <span className="font-semibold">Сбой генерации</span>
                    <p className="text-[11px] text-mid-ash line-clamp-2 max-w-xs">
                      {task.error || 'Ошибка связи с сервером'}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegenerateTask(task.id);
                      }}
                      className="mt-1 text-xs bg-graphite-ink text-pure-white px-3 py-1 rounded-[10px] font-medium"
                    >
                      Повторить
                    </button>
                  </div>
                ) : task.resultUrl ? (
                  <>
                    <img
                      src={isShowingOriginal && photo ? photo.dataUrl : task.resultUrl}
                      alt="Preview"
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {/* Label badge (Original vs Result) */}
                    <span className="absolute top-2 left-2 text-[10px] font-semibold bg-pure-white/90 backdrop-blur-sm text-graphite-ink px-2 py-0.5 rounded-[10px] border border-hairline">
                      {isShowingOriginal ? 'Оригинал' : 'Результат (1.5K)'}
                    </span>
                  </>
                ) : (
                  <div className="text-xs text-mid-ash">Ожидание очереди...</div>
                )}

                {/* Hover Actions Toolbar */}
                {task.resultUrl && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOriginal(task.id);
                      }}
                      className="p-1.5 rounded-[10px] bg-pure-white/90 hover:bg-pure-white text-graphite-ink border border-hairline transition shadow-sm"
                      title={isShowingOriginal ? 'Показать результат' : 'Показать оригинал'}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLightbox(task);
                      }}
                      className="p-1.5 rounded-[10px] bg-pure-white/90 hover:bg-pure-white text-graphite-ink border border-hairline transition shadow-sm"
                      title="На весь экран"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Card Meta & Prompt */}
              <div className="p-3.5 flex flex-col justify-between flex-1 bg-pure-white space-y-2.5">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-mid-ash mb-1">
                    <span className="truncate font-medium">{task.photoName}</span>
                    {task.duration && (
                      <span className="font-mono text-[10px] text-hollow">
                        {task.duration.toFixed(1)}с
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-graphite-ink line-clamp-2 leading-relaxed" title={task.promptText}>
                    "{task.promptText}"
                  </p>
                </div>

                {/* Card Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-hairline">
                  <button
                    onClick={() => onRegenerateTask(task.id)}
                    className="flex items-center gap-1.5 text-xs text-mid-ash hover:text-graphite-ink transition font-medium"
                    title="Перегенерировать этот результат"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Повторить</span>
                  </button>

                  {task.resultUrl && (
                    <button
                      onClick={() => onDownloadSingle(task)}
                      className="flex items-center gap-1 text-xs font-medium text-graphite-ink hover:underline transition"
                      title="Сохранить в галерею"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>В галерею</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
        </>
      )}
    </div>
  );
};

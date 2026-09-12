import React, { useState } from 'react';
import {
  Download,
  RotateCw,
  Plus,
  Image as ImageIcon,
  Trash2,
  Maximize2,
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
  onClearGallery?: () => void;
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
  onClearGallery,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Gallery is the permanent storage vault: show successful completed images
  const successTasks = tasks.filter((t) => t.status === 'success' && t.resultUrl);

  return (
    <div className="max-w-6xl mx-auto w-full pb-28 px-1 sm:px-4">
      {/* Top Header & Actions (No progress bar as requested!) */}
      <div className="py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-graphite-ink">
              Галерея
            </h1>
            <p className="text-xs text-mid-ash mt-0.5">
              {successTasks.length === 0
                ? 'Хранилище пусто'
                : `${successTasks.length} сохранённых изображений (1.5K)`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {successTasks.length > 0 && (
              <button
                onClick={onDownloadZip}
                className="inline-flex items-center gap-1.5 border border-hairline hover:bg-hover-veil text-graphite-ink text-xs font-medium px-3.5 py-1.5 rounded-full transition active:scale-95"
                title="Скачать все в ZIP"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ZIP ({successTasks.length})</span>
              </button>
            )}

            {successTasks.length > 0 && onClearGallery && (
              <>
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <button
                      onClick={() => {
                        onClearGallery();
                        setShowClearConfirm(false);
                      }}
                      className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-pure-white px-3 py-1.5 rounded-full transition active:scale-95 shadow-xs"
                    >
                      Удалить все ({successTasks.length})
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="text-xs text-mid-ash hover:text-graphite-ink px-2 py-1.5 rounded-lg transition"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="inline-flex items-center gap-1 text-xs text-mid-ash hover:text-red-600 px-2.5 py-1.5 rounded-lg transition hover:bg-red-50"
                    title="Очистить всю галерею"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Очистить галерею</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={onNewGeneration}
              className="inline-flex items-center gap-1.5 bg-graphite-ink hover:bg-black text-pure-white text-xs font-medium px-3.5 py-1.5 rounded-full transition shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Создать ещё</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {successTasks.length === 0 ? (
        <div className="py-20 text-center space-y-3 border-t border-hairline">
          <div className="w-12 h-12 rounded-2xl bg-sidebar-mist border border-hairline mx-auto flex items-center justify-center text-mid-ash">
            <ImageIcon className="w-6 h-6 opacity-60" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-graphite-ink">В галерее пока ничего нет</p>
            <p className="text-xs text-mid-ash max-w-sm mx-auto leading-relaxed">
              Все сгенерированные фотографии автоматически сохраняются здесь по мере завершения в очереди.
            </p>
          </div>
          <button
            onClick={onNewGeneration}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-graphite-ink text-pure-white px-4 py-2 rounded-full hover:bg-black transition active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Перейти в студию</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Grid: 3-column square images edge-to-edge without clutter (Instagram/Photos style) */}
          <div className="grid grid-cols-3 gap-1 sm:hidden border-t border-hairline pt-1">
            {successTasks.map((task) => (
              <div
                key={`mobile-${task.id}`}
                onClick={() => onOpenLightbox(task)}
                className="aspect-square relative overflow-hidden bg-sidebar-mist cursor-pointer active:opacity-75 transition"
              >
                <img
                  src={task.resultUrl!}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Desktop / Tablet Grid: Clean minimal cards */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 border-t border-hairline pt-4">
            {successTasks.map((task) => (
              <div
                key={task.id}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-sidebar-mist border border-hairline shadow-xs hover:shadow transition cursor-pointer select-none"
                onClick={() => onOpenLightbox(task)}
              >
                <img
                  src={task.resultUrl!}
                  alt={task.promptText}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                  loading="lazy"
                />

                {/* Top Action Hover Overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition z-10">
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
            ))}
          </div>
        </>
      )}
    </div>
  );
};

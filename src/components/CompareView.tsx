import React from 'react';
import { Download, Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { MatrixTask, PhotoItem } from '../types';

interface CompareViewProps {
  selectedTask?: MatrixTask;
  photo?: PhotoItem;
  onDownload: (task: MatrixTask) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  selectedTask,
  photo,
  onDownload,
}) => {
  if (!selectedTask) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center text-center text-xs text-zinc-500 min-h-[220px]">
        <ImageIcon className="w-8 h-8 text-zinc-700 mb-2" />
        <p className="font-medium text-zinc-400">Предпросмотр комбинации</p>
        <p className="text-[11px] text-zinc-600 mt-1">
          Выберите строку в таблице очереди выше, чтобы сравнить оригинал и результат
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 space-y-3">
      {/* Header with Prompt Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs text-zinc-200">
              #{selectedTask.index + 1} • {selectedTask.photoName}
            </span>
            {selectedTask.status === 'success' && (
              <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                {selectedTask.duration?.toFixed(1)}с
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xl">
            "{selectedTask.promptText}"
          </p>
        </div>

        {selectedTask.resultUrl && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onDownload(selectedTask)}
              className="flex items-center gap-1 text-xs font-semibold bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-2.5 py-1 rounded transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать</span>
            </button>
            <a
              href={selectedTask.resultUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 border border-border bg-zinc-900"
              title="Открыть в новой вкладке"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Dual Preview Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Original */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Оригинал
          </span>
          <div className="border border-border/60 rounded-md bg-zinc-950/60 aspect-square flex items-center justify-center overflow-hidden p-1 max-h-[280px]">
            {photo ? (
              <img
                src={photo.dataUrl}
                alt="Оригинал"
                className="w-full h-full object-contain rounded"
              />
            ) : (
              <span className="text-xs text-zinc-600">Нет фото</span>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            Результат генерации (1.5K)
          </span>
          <div className="border border-border/60 rounded-md bg-zinc-950/60 aspect-square flex items-center justify-center overflow-hidden p-1 max-h-[280px]">
            {selectedTask.resultUrl ? (
              <img
                src={selectedTask.resultUrl}
                alt="Результат"
                className="w-full h-full object-contain rounded"
              />
            ) : selectedTask.status === 'processing' ? (
              <div className="flex flex-col items-center gap-2 text-zinc-500 text-xs">
                <span className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Генерация 1.5K...</span>
              </div>
            ) : selectedTask.status === 'error' ? (
              <div className="text-center p-3 text-red-400 text-xs space-y-1">
                <p className="font-semibold">Сбой генерации</p>
                <p className="text-[11px] text-zinc-500 max-w-xs break-words">
                  {selectedTask.error || 'Ошибка связи с сервером'}
                </p>
              </div>
            ) : (
              <span className="text-xs text-zinc-600">Ожидает запуска</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

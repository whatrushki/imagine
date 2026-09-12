import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  RotateCw,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { MatrixTask, PhotoItem } from '../types';

interface LightboxModalProps {
  tasks: MatrixTask[];
  initialTaskId: string;
  photos: PhotoItem[];
  onClose: () => void;
  onRegenerate: (taskId: string) => void;
  onDownload: (task: MatrixTask) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  tasks,
  initialTaskId,
  photos,
  onClose,
  onRegenerate,
  onDownload,
}) => {
  const [currentId, setCurrentId] = useState(initialTaskId);
  const [sliderPos, setSliderPos] = useState(50);
  const [isComparing, setIsComparing] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  // Touch swipe handling
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Filter tasks with resultUrl or available
  const availableTasks = tasks.length > 0 ? tasks : [];
  const currentIndex = Math.max(
    0,
    availableTasks.findIndex((t) => t.id === currentId)
  );
  const currentTask = availableTasks[currentIndex] || null;
  const currentPhoto = currentTask
    ? photos.find((p) => p.id === currentTask.photoId)
    : undefined;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentId(availableTasks[currentIndex - 1].id);
    } else if (availableTasks.length > 1) {
      setCurrentId(availableTasks[availableTasks.length - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < availableTasks.length - 1) {
      setCurrentId(availableTasks[currentIndex + 1].id);
    } else if (availableTasks.length > 1) {
      setCurrentId(availableTasks[0].id);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, availableTasks, onClose]);

  // Touch Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Horizontal swipe between images
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    // Vertical swipe down or up to close full screen
    else if (Math.abs(deltaY) > 65 && Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
      onClose();
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Wheel scroll to next/prev
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 50 || Math.abs(e.deltaX) > 50) {
      if (e.deltaY > 0 || e.deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  if (!currentTask || !currentTask.resultUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black text-white w-screen h-screen flex flex-col select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* 1. TOP OVERLAY HEADER (Floating, edge-to-edge transparent) */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        {/* Left: Close button + counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition"
            title="Закрыть (Esc или свайп)"
          >
            <X className="w-6 h-6" />
          </button>

          {availableTasks.length > 1 && (
            <span className="text-xs sm:text-sm font-mono text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full">
              {currentIndex + 1} / {availableTasks.length}
            </span>
          )}

          <span className="text-xs text-white/60 font-mono truncate max-w-[130px] sm:max-w-[220px] hidden xs:inline">
            {currentTask.photoName}
          </span>
        </div>

        {/* Right: Actions (Compare & Download) */}
        <div className="flex items-center gap-2">
          {currentPhoto && (
            <button
              onClick={() => setIsComparing(!isComparing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition ${
                isComparing
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Сравнить с исходным фото"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">До / После</span>
            </button>
          )}

          <button
            onClick={() => onDownload(currentTask)}
            className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 font-medium text-xs px-3.5 py-1.5 rounded-full transition shadow-md active:scale-95"
            title="Сохранить в галерею"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">В галерею</span>
          </button>
        </div>
      </div>

      {/* 2. FULLSCREEN VIEWPORT (Edge-to-edge full image) */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
        {/* Previous Desktop Arrow */}
        {availableTasks.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center border border-white/10"
            title="Предыдущее (влево)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Desktop Arrow */}
        {availableTasks.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center border border-white/10"
            title="Следующее (вправо)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Display Image or Comparison Slider */}
        {currentPhoto && isComparing ? (
          /* Split Before / After View */
          <div className="relative w-full h-full max-h-screen flex items-center justify-center overflow-hidden select-none">
            {/* Generated (Underneath / Right) */}
            <img
              src={currentTask.resultUrl}
              alt="Результат"
              className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
            />

            {/* Original (Left clipped) */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={currentPhoto.dataUrl}
                alt="Оригинал"
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
              <span className="absolute bottom-20 left-4 text-xs font-semibold bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/15">
                До (Оригинал)
              </span>
            </div>

            <span className="absolute bottom-20 right-4 text-xs font-semibold bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/15 pointer-events-none">
              После (1.5K)
            </span>

            {/* Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-lg z-20 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow-xl">
                ↔
              </div>
            </div>

            {/* Drag input */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
            />
          </div>
        ) : (
          /* True Edge-to-edge Fullscreen Image */
          <div className="w-full h-full flex items-center justify-center p-0">
            <img
              src={currentTask.resultUrl}
              alt={currentTask.promptText}
              className="w-full h-full max-w-full max-h-full object-contain transition-opacity duration-200"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* 3. BOTTOM OVERLAY FOOTER (Floating gradient bar with prompt & regenerate) */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3 max-w-4xl mx-auto w-full">
          {/* Prompt description */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
          >
            <p
              className={`text-xs sm:text-sm font-medium text-white/95 leading-relaxed drop-shadow-xs transition-all ${
                isPromptExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {currentTask.promptText}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-white/60 mt-1 font-mono">
              <span>{currentTask.photoName}</span>
              {currentTask.duration && (
                <span>• {currentTask.duration.toFixed(1)}с</span>
              )}
              <span>• 1.5K UHD</span>
            </div>
          </div>

          {/* Regenerate Action */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => {
                onRegenerate(currentTask.id);
                onClose();
              }}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md px-3.5 py-2 rounded-full transition font-medium text-xs border border-white/15"
              title="Перегенерировать заново"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Повторить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

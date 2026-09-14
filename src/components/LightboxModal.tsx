import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  RotateCw,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
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
  onEditPhoto?: (task: MatrixTask, newPrompt: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  tasks,
  initialTaskId,
  photos,
  onClose,
  onRegenerate,
  onDownload,
  onEditPhoto,
}) => {
  const [currentId, setCurrentId] = useState(initialTaskId);
  const [sliderPos, setSliderPos] = useState(50);
  const [isComparing, setIsComparing] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [editPrompt, setEditPrompt] = useState('');

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch Swipe (follows finger in real-time)
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimatingSlide, setIsAnimatingSlide] = useState(false);

  const availableTasks = tasks.length > 0 ? tasks : [];
  const currentIndex = Math.max(
    0,
    availableTasks.findIndex((t) => t.id === currentId)
  );
  const currentTask = availableTasks[currentIndex] || null;
  const currentPhoto = currentTask
    ? photos.find((p) => p.id === currentTask.photoId)
    : undefined;

  const prevIndex =
    availableTasks.length > 1
      ? (currentIndex - 1 + availableTasks.length) % availableTasks.length
      : null;
  const nextIndex =
    availableTasks.length > 1 ? (currentIndex + 1) % availableTasks.length : null;

  const prevTask = prevIndex !== null ? availableTasks[prevIndex] : null;
  const nextTask = nextIndex !== null ? availableTasks[nextIndex] : null;

  // Refs for tracking touch gestures
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startTime: number;
    hasMoved: boolean;
    isPinching: boolean;
    initialPinchDist: number;
    initialScale: number;
    panStartX: number;
    panStartY: number;
  }>({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0,
    hasMoved: false,
    isPinching: false,
    initialPinchDist: 0,
    initialScale: 1,
    panStartX: 0,
    panStartY: 0,
  });

  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  // Reset zoom on slide change
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setDragOffset(0);
  }, [currentId]);

  const goToPrev = useCallback(() => {
    if (prevTask && !isAnimatingSlide) {
      setIsAnimatingSlide(true);
      setDragOffset(window.innerWidth);
      setTimeout(() => {
        setCurrentId(prevTask.id);
        setDragOffset(0);
        setIsAnimatingSlide(false);
      }, 240);
    }
  }, [prevTask, isAnimatingSlide]);

  const goToNext = useCallback(() => {
    if (nextTask && !isAnimatingSlide) {
      setIsAnimatingSlide(true);
      setDragOffset(-window.innerWidth);
      setTimeout(() => {
        setCurrentId(nextTask.id);
        setDragOffset(0);
        setIsAnimatingSlide(false);
      }, 240);
    }
  }, [nextTask, isAnimatingSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, onClose]);

  // Touch Handlers with real-time finger tracking & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isComparing || isAnimatingSlide) return;

    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStateRef.current.isPinching = true;
      touchStateRef.current.initialPinchDist = dist;
      touchStateRef.current.initialScale = scale;
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStateRef.current.startX = t.clientX;
      touchStateRef.current.startY = t.clientY;
      touchStateRef.current.lastX = t.clientX;
      touchStateRef.current.lastY = t.clientY;
      touchStateRef.current.startTime = Date.now();
      touchStateRef.current.hasMoved = false;
      touchStateRef.current.isPinching = false;
      touchStateRef.current.panStartX = pan.x;
      touchStateRef.current.panStartY = pan.y;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isComparing || isAnimatingSlide) return;

    // Handle 2-finger pinch to zoom
    if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStateRef.current.initialPinchDist > 0) {
        const factor = dist / touchStateRef.current.initialPinchDist;
        const newScale = Math.min(4, Math.max(1, touchStateRef.current.initialScale * factor));
        setScale(newScale);
        if (newScale === 1) {
          setPan({ x: 0, y: 0 });
        }
      }
      return;
    }

    // Single touch
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const deltaX = t.clientX - touchStateRef.current.startX;
      const deltaY = t.clientY - touchStateRef.current.startY;

      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        touchStateRef.current.hasMoved = true;
      }

      // If zoomed in, pan the image
      if (scale > 1.05) {
        const panX = touchStateRef.current.panStartX + (t.clientX - touchStateRef.current.startX);
        const panY = touchStateRef.current.panStartY + (t.clientY - touchStateRef.current.startY);
        const maxPanX = (window.innerWidth * (scale - 1)) / 2;
        const maxPanY = (window.innerHeight * (scale - 1)) / 2;
        setPan({
          x: Math.max(-maxPanX, Math.min(maxPanX, panX)),
          y: Math.max(-maxPanY, Math.min(maxPanY, panY)),
        });
        return;
      }

      // If not zoomed, track horizontal swipe with the finger
      if (availableTasks.length > 1 && Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
        setDragOffset(deltaX);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isComparing || isAnimatingSlide) return;

    if (touchStateRef.current.isPinching) {
      touchStateRef.current.isPinching = false;
      if (scale < 1.05) {
        setScale(1);
        setPan({ x: 0, y: 0 });
      }
      return;
    }

    const duration = Date.now() - touchStateRef.current.startTime;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStateRef.current.startX;
    const deltaY = t.clientY - touchStateRef.current.startY;

    // Tap detection: minimal movement + quick duration (< 300ms)
    if (!touchStateRef.current.hasMoved && duration < 300) {
      const now = Date.now();
      // Check for double tap zoom
      if (now - lastTapRef.current.time < 300) {
        if (scale > 1.05) {
          setScale(1);
          setPan({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
        lastTapRef.current.time = 0;
      } else {
        lastTapRef.current = { time: now, x: t.clientX, y: t.clientY };
        // Single tap: toggle overlay buttons & bars visibility
        setShowChrome((prev) => !prev);
      }
      setDragOffset(0);
      return;
    }

    // Zoomed in: finalize pan
    if (scale > 1.05) {
      return;
    }

    // Vertical swipe down to close full screen
    if (Math.abs(deltaY) > 80 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(dragOffset) < 30) {
      onClose();
      return;
    }

    // Horizontal swipe release: decide next / prev or snap back
    const swipeThreshold = window.innerWidth * 0.18;
    const isQuickFlick = duration < 250 && Math.abs(deltaX) > 40;

    if ((deltaX < -swipeThreshold || (isQuickFlick && deltaX < 0)) && nextTask) {
      // Swiped left -> Next
      setIsAnimatingSlide(true);
      setDragOffset(-window.innerWidth);
      setTimeout(() => {
        setCurrentId(nextTask.id);
        setDragOffset(0);
        setIsAnimatingSlide(false);
      }, 240);
    } else if ((deltaX > swipeThreshold || (isQuickFlick && deltaX > 0)) && prevTask) {
      // Swiped right -> Prev
      setIsAnimatingSlide(true);
      setDragOffset(window.innerWidth);
      setTimeout(() => {
        setCurrentId(prevTask.id);
        setDragOffset(0);
        setIsAnimatingSlide(false);
      }, 240);
    } else {
      // Spring back
      setIsAnimatingSlide(true);
      setDragOffset(0);
      setTimeout(() => {
        setIsAnimatingSlide(false);
      }, 240);
    }
  };

  // Mouse wheel zoom on desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || Math.abs(e.deltaY) < 40) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      const nextScale = Math.min(4, Math.max(1, scale * zoomFactor));
      setScale(nextScale);
      if (nextScale === 1) setPan({ x: 0, y: 0 });
    } else if (scale === 1 && Math.abs(e.deltaX) > 40) {
      if (e.deltaX > 0) goToNext();
      else goToPrev();
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editPrompt.trim();
    if (!trimmed || !currentTask) return;
    if (onEditPhoto) {
      onEditPhoto(currentTask, trimmed);
    }
    setEditPrompt('');
    onClose();
  };

  if (!currentTask || !currentTask.resultUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black text-white w-screen h-screen flex flex-col select-none overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* 1. TOP OVERLAY HEADER */}
      <div
        className={`absolute top-0 inset-x-0 z-40 flex items-center justify-between px-3 sm:px-6 pb-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-all duration-300 ${
          showChrome ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          paddingLeft: 'calc(0.75rem + env(safe-area-inset-left, 0px))',
          paddingRight: 'calc(0.75rem + env(safe-area-inset-right, 0px))',
        }}
      >
        {/* Left: Close button + counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition"
            title="Закрыть (Esc или свайп вниз)"
          >
            <X className="w-6 h-6" />
          </button>

          {availableTasks.length > 1 && (
            <span className="text-xs sm:text-sm font-mono text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {currentIndex + 1} / {availableTasks.length}
            </span>
          )}

          <span className="text-xs text-white/60 font-mono truncate max-w-[130px] sm:max-w-[220px] hidden xs:inline">
            {currentTask.photoName}
          </span>
        </div>

        {/* Right: Actions (Compare & Download) */}
        <div className="flex items-center gap-2">
          {scale > 1.05 && (
            <button
              onClick={() => {
                setScale(1);
                setPan({ x: 0, y: 0 });
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition"
            >
              100%
            </button>
          )}

          {currentPhoto && (
            <button
              onClick={() => {
                setIsComparing(!isComparing);
                setScale(1);
                setPan({ x: 0, y: 0 });
              }}
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

      {/* 2. FULLSCREEN VIEWPORT */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
        {/* Previous Desktop Arrow */}
        {availableTasks.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className={`absolute left-3 sm:left-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center border border-white/15 shadow-xl ${
              showChrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
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
              goToNext();
            }}
            className={`absolute right-3 sm:right-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center border border-white/15 shadow-xl ${
              showChrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            title="Следующее (вправо)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Display: Compare Mode or Smooth Swipe Track */}
        {currentPhoto && isComparing ? (
          /* Split Before / After View */
          <div className="relative w-full h-full max-h-screen flex items-center justify-center overflow-hidden select-none">
            <img
              src={currentTask.resultUrl}
              alt="Результат"
              className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
            />

            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={currentPhoto.dataUrl}
                alt="Оригинал"
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
              <span className="absolute bottom-28 left-4 text-xs font-semibold bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/15">
                До (Оригинал)
              </span>
            </div>

            <span className="absolute bottom-28 right-4 text-xs font-semibold bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/15 pointer-events-none">
              После (1.5K)
            </span>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-lg z-20 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow-xl">
                ↔
              </div>
            </div>

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
          /* Smooth Continuous 3-Slide Track (moves in real-time with touch drag) */
          <div
            className="w-full h-full relative flex items-center justify-center will-change-transform"
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: isAnimatingSlide
                ? 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
            }}
          >
            {/* Previous Slide (Left neighbor) */}
            {prevTask && prevTask.resultUrl && (
              <div
                className="absolute inset-0 flex items-center justify-center p-0"
                style={{ transform: 'translateX(-100%)' }}
              >
                <img
                  src={prevTask.resultUrl}
                  alt=""
                  className="w-full h-full max-w-full max-h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            )}

            {/* Current Active Slide (Center) */}
            <div
              className="w-full h-full flex items-center justify-center p-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transition: touchStateRef.current.isPinching ? 'none' : 'transform 180ms ease-out',
                transformOrigin: 'center center',
              }}
            >
              <img
                src={currentTask.resultUrl}
                alt={currentTask.promptText}
                className="w-full h-full max-w-full max-h-full object-contain pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Next Slide (Right neighbor) */}
            {nextTask && nextTask.resultUrl && (
              <div
                className="absolute inset-0 flex items-center justify-center p-0"
                style={{ transform: 'translateX(100%)' }}
              >
                <img
                  src={nextTask.resultUrl}
                  alt=""
                  className="w-full h-full max-w-full max-h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BOTTOM OVERLAY FOOTER */}
      <div
        className={`absolute bottom-0 inset-x-0 z-40 px-4 sm:px-6 pt-8 pb-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-3 transition-all duration-300 ${
          showChrome ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0px))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right, 0px))',
        }}
      >
        <div className="max-w-3xl mx-auto w-full space-y-2.5">
          {/* Top of footer: Prompt text & Repeat button */}
          <div className="flex items-end justify-between gap-3">
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
                {currentTask.duration && <span>• {currentTask.duration.toFixed(1)}с</span>}
                <span>• 1.5K UHD</span>
              </div>
            </div>

            {/* Repeat button */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => {
                  onRegenerate(currentTask.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md px-3 py-1.5 rounded-full transition font-medium text-xs border border-white/15"
                title="Повторить генерацию"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Повторить</span>
              </button>
            </div>
          </div>

          {/* Inline Edit Prompt Bar (Request 8) */}
          <form
            onSubmit={handleEditSubmit}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 focus-within:bg-black/60 focus-within:border-white/40 border border-white/15 backdrop-blur-md rounded-2xl px-3 py-1.5 transition shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-white/70 shrink-0" />
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Изменить это фото (опишите новый стиль)..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-white/50 focus:outline-none min-w-0 py-1"
            />
            <button
              type="submit"
              disabled={!editPrompt.trim()}
              className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-25 disabled:hover:bg-white transition shrink-0 active:scale-95 shadow-xs"
              title="Запустить изменение фото"
            >
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

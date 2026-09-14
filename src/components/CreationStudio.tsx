import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  ImagePlus,
  X,
  Sparkles,
  ChevronDown,
  Cpu,
  Clock,
  Shuffle,
  Brain,
  ArrowUp,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { PhotoItem, GenerationSettings } from '../types';

interface CreationStudioProps {
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
  onClearPhotos: () => void;
  settings: GenerationSettings;
  onUpdateSettings: (settings: GenerationSettings) => void;
  onStartBatch: (prompt: string) => void;
  isRunning: boolean;
}

export const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Квадрат', res: '1536x1536 ( 1:1 )', short: '1:1' },
  { id: '2:3', label: '2:3 Портрет', res: '1264x1856 ( 2:3 )', short: '2:3' },
  { id: '3:2', label: '3:2 Пейзаж', res: '1856x1264 ( 3:2 )', short: '3:2' },
  { id: '9:16', label: '9:16 Сториз', res: '1152x2032 ( 9:16 )', short: '9:16' },
  { id: '16:9', label: '16:9 Кино', res: '2032x1152 ( 16:9 )', short: '16:9' },
];

export const CreationStudio: React.FC<CreationStudioProps> = ({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onClearPhotos,
  settings,
  onUpdateSettings,
  onStartBatch,
  isRunning,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRatioOpen, setIsRatioOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const ratioPopoverRef = useRef<HTMLDivElement>(null);
  const ratioBtnRef = useRef<HTMLButtonElement>(null);

  // Close popovers on outside click or Escape (Request 3)
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        isSettingsOpen &&
        settingsPopoverRef.current &&
        !settingsPopoverRef.current.contains(target) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(target)
      ) {
        setIsSettingsOpen(false);
      }

      if (
        isRatioOpen &&
        ratioPopoverRef.current &&
        !ratioPopoverRef.current.contains(target) &&
        ratioBtnRef.current &&
        !ratioBtnRef.current.contains(target)
      ) {
        setIsRatioOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsRatioOpen(false);
      }
    };

    if (isSettingsOpen || isRatioOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isSettingsOpen, isRatioOpen]);

  // Auto-expand textarea up to 5 lines
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // 1 line ~24px, 5 lines ~115px
      const clamped = Math.min(Math.max(textareaRef.current.scrollHeight, 24), 115);
      textareaRef.current.style.height = `${clamped}px`;
    }
  }, [promptInput]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddPhotos(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddPhotos(Array.from(e.dataTransfer.files));
    }
  };

  const handleLaunch = () => {
    const trimmed = promptInput.trim();
    if (!trimmed || photos.length === 0) return;
    onStartBatch(trimmed);
    setPromptInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleLaunch();
    }
  };

  const currentRatio =
    ASPECT_RATIOS.find((r) => r.res === settings.resolution) || ASPECT_RATIOS[0];

  const canLaunch = photos.length > 0 && promptInput.trim().length > 0;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-pure-white select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Center Main Canvas / Scrollable Photos */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {photos.length === 0 ? (
          /* Empty State: ChatGPT Style Welcome */
          <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-sidebar-mist border border-hairline flex items-center justify-center shadow-xs">
              <img
                src="./logo.svg"
                alt="Imagine"
                className="w-10 h-auto text-graphite-ink"
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-graphite-ink">
                Что хотите создать?
              </h1>
              <p className="text-xs sm:text-sm text-mid-ash leading-relaxed max-w-md">
                Загрузите фотографии, напишите желаемый стиль в строке ниже и нажмите «Отправить». Каждое фото обработается в качестве 1.5K UHD.
              </p>
            </div>

            {/* Big Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md border-2 border-dashed border-hairline hover:border-graphite-ink bg-sidebar-mist/40 hover:bg-sidebar-mist rounded-2xl p-8 cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-pure-white border border-hairline flex items-center justify-center group-hover:scale-105 transition shadow-xs">
                <UploadCloud className="w-6 h-6 text-graphite-ink" />
              </div>
              <div>
                <p className="text-sm font-medium text-graphite-ink">
                  Нажмите для выбора фото или перетащите файлы
                </p>
                <p className="text-xs text-mid-ash mt-1 font-mono">
                  PNG, JPG, WEBP • пакетная загрузка
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Photos Grid Area */
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Photo Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-hairline bg-sidebar-mist shadow-xs hover:shadow transition"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />

                  {/* Remove Button */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    <button
                      onClick={() => onRemovePhoto(photo.id)}
                      className="p-1 rounded-full bg-graphite-ink/80 text-pure-white hover:bg-black transition backdrop-blur-xs shadow"
                      title="Удалить это фото"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Index */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4">
                    <p className="text-[11px] text-pure-white truncate font-medium text-center">
                      {photo.name}
                    </p>
                  </div>

                  <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-pure-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Docked ChatGPT-Style Prompt Bar */}
      <div className="shrink-0 w-full max-w-5xl mx-auto px-2.5 sm:px-6 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-20 bg-pure-white">
        <div className="relative rounded-2xl sm:rounded-3xl border border-hairline bg-pure-white shadow-xl backdrop-blur-md transition-all duration-200 focus-within:border-graphite-ink focus-within:ring-2 focus-within:ring-graphite-ink/5 p-2 sm:p-3 flex flex-col gap-1.5">
          {/* Settings Drawer / Popover (shadcn/ui style) */}
          {/* Settings Drawer / Popover (Custom shadcn/ui style, zero header, zero separator, Request 3) */}
          {isSettingsOpen && (
            <div
              ref={settingsPopoverRef}
              className="absolute bottom-full mb-3 right-0 w-80 bg-pure-white/95 backdrop-blur-md border border-hairline rounded-2xl shadow-2xl p-3 z-30 space-y-3 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="space-y-3 text-xs">
                {/* Workers: Custom Segmented Control (Zero native select) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-graphite-ink">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-mid-ash" />
                      Параллельных соединений
                    </span>
                    <span className="font-mono text-mid-ash">{settings.workers}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-sidebar-mist rounded-xl border border-hairline/60">
                    {[
                      { val: 1, label: '1 поток', sub: 'стандарт' },
                      { val: 2, label: '2 потока', sub: 'быстрее' },
                      { val: 3, label: '3 потока', sub: 'макс' },
                    ].map((opt) => {
                      const isSel = settings.workers === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => onUpdateSettings({ ...settings, workers: opt.val })}
                          className={`py-1.5 px-1 rounded-lg text-xs font-medium transition text-center flex flex-col items-center justify-center ${
                            isSel
                              ? 'bg-pure-white text-graphite-ink shadow-xs font-semibold'
                              : 'text-mid-ash hover:text-graphite-ink'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span className="text-[9px] opacity-60 font-mono">{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delay: Stepper buttons */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-graphite-ink">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-mid-ash" />
                      Пауза между запросами
                    </span>
                    <span className="font-mono font-semibold text-graphite-ink">{settings.delay}с</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          delay: Math.max(0, +(settings.delay - 0.5).toFixed(1)),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-sidebar-mist border border-hairline/60 flex items-center justify-center text-sm font-bold text-graphite-ink hover:bg-hover-veil transition active:scale-95"
                    >
                      -
                    </button>
                    <div className="flex-1 bg-sidebar-mist border border-hairline/60 rounded-lg py-1.5 text-center font-mono text-xs text-graphite-ink">
                      {settings.delay} сек
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          delay: Math.min(30, +(settings.delay + 0.5).toFixed(1)),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-sidebar-mist border border-hairline/60 flex items-center justify-center text-sm font-bold text-graphite-ink hover:bg-hover-veil transition active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Seed & Thinking: Custom Switch Controls (Zero separator, clean spacing) */}
                <div className="space-y-2.5 pt-0.5">
                  <div
                    onClick={() => onUpdateSettings({ ...settings, randomSeed: !settings.randomSeed })}
                    className="flex items-center justify-between cursor-pointer py-0.5 select-none"
                  >
                    <span className="flex items-center gap-1.5 text-graphite-ink font-medium">
                      <Shuffle className="w-3.5 h-3.5 text-mid-ash" />
                      Случайный Seed
                    </span>
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        settings.randomSeed ? 'bg-graphite-ink' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.randomSeed ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => onUpdateSettings({ ...settings, thinking: !settings.thinking })}
                    className="flex items-center justify-between cursor-pointer py-0.5 select-none"
                  >
                    <span className="flex items-center gap-1.5 text-graphite-ink font-medium">
                      <Brain className="w-3.5 h-3.5 text-mid-ash" />
                      Thinking Mode (PE)
                    </span>
                    <div
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        settings.thinking ? 'bg-graphite-ink' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.thinking ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aspect Ratio Menu Popover (Pure options list without title/divider, Request 3) */}
          {isRatioOpen && (
            <div
              ref={ratioPopoverRef}
              className="absolute bottom-full mb-3 left-3 w-56 bg-pure-white/95 backdrop-blur-md border border-hairline rounded-2xl shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
            >
              {ASPECT_RATIOS.map((item) => {
                const isActive = settings.resolution === item.res;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onUpdateSettings({ ...settings, resolution: item.res });
                      setIsRatioOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer select-none ${
                      isActive
                        ? 'bg-graphite-ink text-pure-white font-medium shadow-xs'
                        : 'hover:bg-hover-veil text-graphite-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-pure-white' : 'bg-transparent'}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isActive ? 'text-pure-white/70' : 'text-mid-ash'}`}>
                      {item.short}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Top Row: Full-width Auto-expanding Textarea (up to 5 lines) */}
          <div className="w-full px-1.5 pt-0.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                photos.length === 0
                  ? 'Сначала выберите фото, затем опишите стиль...'
                  : `Опишите стиль для ${photos.length} фото и нажмите Enter...`
              }
              className="w-full bg-transparent border-none text-sm text-graphite-ink placeholder:text-mid-ash/70 focus:outline-none focus:ring-0 p-0 resize-none max-h-[125px] leading-relaxed overflow-y-auto block"
            />
          </div>

          {/* Bottom Toolbar: Tools on Left, Settings + Send on Right (ChatGPT Style) */}
          <div className="flex items-center justify-between pt-0.5">
            {/* Left Controls: Add Photo + Aspect Ratio */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-graphite-ink hover:text-black bg-sidebar-mist hover:bg-hover-veil border border-hairline transition shrink-0 active:scale-95"
                title="Добавить фотографии"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden xs:inline sm:inline">Фото</span>
              </button>

              <button
                ref={ratioBtnRef}
                type="button"
                onClick={() => setIsRatioOpen(!isRatioOpen)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-mono font-medium text-graphite-ink hover:text-black bg-sidebar-mist hover:bg-hover-veil border border-hairline transition shrink-0 active:scale-95"
                title="Выбрать соотношение сторон"
              >
                <span>{currentRatio.short}</span>
                <ChevronDown className="w-3 h-3 text-mid-ash" />
              </button>
            </div>

            {/* Right Controls: Settings + Submit */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                ref={settingsBtnRef}
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-full text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition shrink-0 active:scale-95 ${
                  isSettingsOpen ? 'bg-hover-veil text-graphite-ink' : ''
                }`}
                title="Параметры генерации"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleLaunch}
                disabled={!canLaunch}
                className="w-8 h-8 rounded-full bg-graphite-ink text-pure-white flex items-center justify-center hover:bg-black disabled:opacity-25 disabled:hover:bg-graphite-ink transition shrink-0 shadow-xs active:scale-95"
                title={
                  photos.length === 0
                    ? 'Сначала добавьте фото'
                    : !promptInput.trim()
                    ? 'Введите описание стиля'
                    : `Запустить генерацию (${photos.length} задач)`
                }
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

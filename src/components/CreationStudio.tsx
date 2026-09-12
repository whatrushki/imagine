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
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 md:px-8 py-4"
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
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-graphite-ink">
                  Выбранные фото
                </span>
                <span className="text-xs font-mono font-medium text-mid-ash bg-sidebar-mist border border-hairline px-2 py-0.5 rounded-full">
                  {photos.length} шт.
                </span>
                {promptInput.trim() && (
                  <span className="text-xs text-mid-ash font-mono hidden sm:inline">
                    • будет создано {photos.length} задач в очереди
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-graphite-ink hover:text-black bg-sidebar-mist hover:bg-hover-veil border border-hairline px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить</span>
                </button>
                <button
                  onClick={onClearPhotos}
                  className="text-xs text-mid-ash hover:text-graphite-ink px-2.5 py-1.5 rounded-lg transition hover:bg-hover-veil"
                >
                  Очистить
                </button>
              </div>
            </div>

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
          {/* Settings Drawer / Popover */}
          {isSettingsOpen && (
            <div className="absolute bottom-full mb-3 right-0 w-80 bg-pure-white border border-hairline rounded-2xl shadow-2xl p-4 z-30 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-graphite-ink" />
                  <span className="font-semibold text-xs text-graphite-ink">
                    Параметры генерации
                  </span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-mid-ash hover:text-graphite-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Workers */}
                <div className="space-y-1">
                  <label className="text-graphite-ink font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-mid-ash" />
                      Потоков генерации
                    </span>
                    <span className="font-mono text-mid-ash">{settings.workers}</span>
                  </label>
                  <select
                    value={settings.workers}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, workers: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-sidebar-mist border border-hairline rounded-lg px-2.5 py-1.5 text-xs text-graphite-ink focus:outline-none"
                  >
                    <option value={1}>1 поток (рекомендуется для избежания 429)</option>
                    <option value={2}>2 потока (быстрее)</option>
                    <option value={3}>3 потока (макс)</option>
                  </select>
                </div>

                {/* Delay */}
                <div className="space-y-1">
                  <label className="text-graphite-ink font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-mid-ash" />
                      Пауза между запросами (сек)
                    </span>
                    <span className="font-mono text-mid-ash">{settings.delay}с</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={settings.delay}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        delay: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-sidebar-mist border border-hairline rounded-lg px-2.5 py-1.5 text-xs text-graphite-ink focus:outline-none"
                  />
                </div>

                {/* Seed & Thinking */}
                <div className="pt-1 space-y-2 border-t border-hairline">
                  <label className="flex items-center justify-between cursor-pointer py-0.5">
                    <span className="flex items-center gap-1.5 text-graphite-ink">
                      <Shuffle className="w-3.5 h-3.5 text-mid-ash" />
                      Случайный Seed
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.randomSeed}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, randomSeed: e.target.checked })
                      }
                      className="rounded accent-graphite-ink"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer py-0.5">
                    <span className="flex items-center gap-1.5 text-graphite-ink">
                      <Brain className="w-3.5 h-3.5 text-mid-ash" />
                      Thinking Mode
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.thinking}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, thinking: e.target.checked })
                      }
                      className="rounded accent-graphite-ink"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Aspect Ratio Menu Popover */}
          {isRatioOpen && (
            <div className="absolute bottom-full mb-3 left-3 w-60 bg-pure-white border border-hairline rounded-2xl shadow-2xl p-2 z-30 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-2 py-1 text-[11px] font-semibold text-mid-ash uppercase tracking-wider">
                Формат изображения (1.5K)
              </div>
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onUpdateSettings({ ...settings, resolution: item.res });
                    setIsRatioOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                    settings.resolution === item.res
                      ? 'bg-graphite-ink text-pure-white font-medium'
                      : 'hover:bg-hover-veil text-graphite-ink'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-70 font-mono">{item.short}</span>
                </button>
              ))}
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

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  ImagePlus,
  X,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Cpu,
  Clock,
  Shuffle,
  Brain,
  ListPlus,
  ArrowUp,
  Trash2,
  Settings2,
  SlidersHorizontal,
  Plus,
  Layers,
  Check,
  Copy,
} from 'lucide-react';
import { PhotoItem, PromptItem, GenerationSettings } from '../types';

interface CreationStudioProps {
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
  onClearPhotos: () => void;
  prompts: PromptItem[];
  onAddPrompt: (text: string) => void;
  onAddBulkPrompts: (texts: string[]) => void;
  onRemovePrompt: (id: string) => void;
  onClearPrompts: () => void;
  settings: GenerationSettings;
  onUpdateSettings: (settings: GenerationSettings) => void;
  onStartGeneration: () => void;
  isRunning: boolean;
}

export const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Квадрат', res: '1536x1536 ( 1:1 )', short: '1:1' },
  { id: '2:3', label: '2:3 Портрет', res: '1264x1856 ( 2:3 )', short: '2:3' },
  { id: '3:2', label: '3:2 Пейзаж', res: '1856x1264 ( 3:2 )', short: '3:2' },
  { id: '9:16', label: '9:16 Сториз', res: '1152x2032 ( 9:16 )', short: '9:16' },
  { id: '16:9', label: '16:9 Кино', res: '2032x1152 ( 16:9 )', short: '16:9' },
];

/** Shorten prompt text to first 2 words + ellipsis if longer */
export const getShortPrompt = (text: string, wordLimit = 2) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text.trim();
  return words.slice(0, wordLimit).join(' ') + '…';
};

export const CreationStudio: React.FC<CreationStudioProps> = ({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onClearPhotos,
  prompts,
  onAddPrompt,
  onAddBulkPrompts,
  onRemovePrompt,
  onClearPrompts,
  settings,
  onUpdateSettings,
  onStartGeneration,
  isRunning,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isPromptListOpen, setIsPromptListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activePromptsCount = prompts.length + (promptInput.trim() ? 1 : 0);
  const totalCalculatedTasks = photos.length * activePromptsCount;

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

  const handleAddPromptFromInput = () => {
    const trimmed = promptInput.trim();
    if (trimmed) {
      onAddPrompt(trimmed);
      setPromptInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddPromptFromInput();
    }
  };

  const handleLaunch = () => {
    if (promptInput.trim()) {
      onAddPrompt(promptInput.trim());
      setPromptInput('');
    }
    onStartGeneration();
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentRatio = ASPECT_RATIOS.find((r) => r.res === settings.resolution) || ASPECT_RATIOS[0];

  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-pure-white select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Center Main Canvas / Scrollable Photo Gallery */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pt-4 pb-48"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {photos.length === 0 ? (
          /* Empty State / Welcome ChatGPT Hero */
          <div className="max-w-xl mx-auto h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-sidebar-mist border border-hairline flex items-center justify-center shadow-sm">
              <img
                src="./logo.svg"
                alt="Imagine"
                className="w-10 h-auto text-graphite-ink"
              />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-graphite-ink">
                Что хотите преобразить?
              </h1>
              <p className="text-sm text-mid-ash leading-relaxed">
                Загрузите фотографии и укажите один или несколько промптов. Каждое изображение будет обработано через каждый указанный стиль в 1.5K качестве.
              </p>
            </div>

            {/* Big Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md border-2 border-dashed border-hairline hover:border-graphite-ink bg-sidebar-mist/40 hover:bg-sidebar-mist rounded-2xl p-8 cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-pure-white border border-hairline flex items-center justify-center group-hover:scale-105 transition shadow-sm">
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
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-hairline">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-sm text-graphite-ink">
                  Исходные фотографии
                </span>
                <span className="text-xs font-mono font-medium text-mid-ash bg-sidebar-mist border border-hairline px-2 py-0.5 rounded-full">
                  {photos.length} шт.
                </span>
                {totalCalculatedTasks > 0 && (
                  <span className="text-xs text-mid-ash font-mono hidden sm:inline">
                    • матрица: {photos.length} фото × {activePromptsCount} стилей = {totalCalculatedTasks} задач
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-graphite-ink hover:text-black bg-sidebar-mist hover:bg-hover-veil border border-hairline px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить еще</span>
                </button>
                <button
                  onClick={onClearPhotos}
                  className="text-xs text-mid-ash hover:text-graphite-ink px-2 py-1.5 rounded-lg transition"
                >
                  Очистить все
                </button>
              </div>
            </div>

            {/* Photo Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-hairline bg-sidebar-mist shadow-sm hover:shadow transition"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />

                  {/* Top action overlay */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    <button
                      onClick={() => onRemovePhoto(photo.id)}
                      className="p-1 rounded-full bg-graphite-ink/80 text-pure-white hover:bg-black transition backdrop-blur-sm shadow"
                      title="Удалить это фото"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom title banner */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4">
                    <p className="text-[11px] text-pure-white truncate font-medium text-center">
                      {photo.name}
                    </p>
                  </div>

                  {/* Index badge */}
                  <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-pure-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Blur & Fade Gradient (Photos slide under input bar and blur into background) */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-pure-white via-pure-white/90 to-transparent backdrop-blur-[2px] z-10" />

      {/* Floating ChatGPT-Style Prompt Bar */}
      <div className="absolute bottom-3 sm:bottom-5 inset-x-0 mx-auto max-w-3xl w-full px-3 sm:px-4 z-20">
        <div className="relative rounded-2xl border border-hairline bg-pure-white/95 shadow-xl backdrop-blur-md transition-all duration-200 focus-within:border-graphite-ink focus-within:ring-2 focus-within:ring-graphite-ink/5">
          
          {/* Prompt Chips Row (Shortened to 2 words, with expand popover) */}
          {prompts.length > 0 && (
            <div className="px-3 pt-2.5 pb-1 border-b border-hairline/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-mid-ash uppercase tracking-wider shrink-0 mr-1">
                Стили:
              </span>

              {/* 2-Word Prompt Pills */}
              {prompts.map((p, idx) => (
                <div
                  key={p.id}
                  title={p.text}
                  className="inline-flex items-center gap-1.5 bg-sidebar-mist border border-hairline hover:border-mid-ash px-2.5 py-1 rounded-full text-xs font-medium text-graphite-ink shrink-0 group transition"
                >
                  <span className="font-mono text-[10px] text-mid-ash">#{idx + 1}</span>
                  <span className="max-w-[120px] truncate">{getShortPrompt(p.text, 2)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePrompt(p.id);
                    }}
                    className="text-mid-ash hover:text-graphite-ink p-0.5 rounded-full transition"
                    title="Удалить стиль"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Expand Upward Button */}
              <button
                onClick={() => setIsPromptListOpen(!isPromptListOpen)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition shrink-0 ${
                  isPromptListOpen
                    ? 'bg-graphite-ink text-pure-white border-graphite-ink'
                    : 'bg-pure-white text-mid-ash hover:text-graphite-ink border-hairline hover:border-mid-ash'
                }`}
                title="Посмотреть все промпты полностью"
              >
                <span>Все ({prompts.length})</span>
                <ChevronUp className={`w-3 h-3 transition-transform duration-200 ${isPromptListOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Bulk Add Trigger */}
              <button
                onClick={() => setIsBulkOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition shrink-0"
                title="Вставить список промптов из буфера"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Списком</span>
              </button>
            </div>
          )}

          {/* Upward Expanding Full Prompts List Popover */}
          {isPromptListOpen && (
            <div className="absolute bottom-full mb-3 inset-x-0 bg-pure-white border border-hairline rounded-2xl shadow-2xl p-4 z-30 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between pb-2.5 border-b border-hairline mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-graphite-ink">
                    Все добавленные промпты ({prompts.length})
                  </span>
                  <span className="text-xs text-mid-ash">
                    (каждое фото получит все эти стили)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBulkOpen(true)}
                    className="text-xs text-graphite-ink hover:underline font-medium"
                  >
                    + Списком
                  </button>
                  <button
                    onClick={onClearPrompts}
                    className="text-xs text-mid-ash hover:text-graphite-ink ml-2"
                  >
                    Очистить все
                  </button>
                  <button
                    onClick={() => setIsPromptListOpen(false)}
                    className="p-1 rounded-lg text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {prompts.length === 0 ? (
                <p className="text-xs text-mid-ash text-center py-4">
                  Промпты пока не добавлены. Введите текст ниже и нажмите Enter.
                </p>
              ) : (
                <div className="space-y-2">
                  {prompts.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-start justify-between gap-3 bg-sidebar-mist border border-hairline p-2.5 rounded-xl text-xs text-graphite-ink hover:bg-hover-veil transition"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="font-mono text-mid-ash text-[11px] font-semibold shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <p className="leading-relaxed break-words font-normal select-text">
                          {p.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyPrompt(p.id, p.text)}
                          className="p-1 rounded text-mid-ash hover:text-graphite-ink transition"
                          title="Скопировать"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-3.5 h-3.5 text-graphite-ink" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onRemovePrompt(p.id)}
                          className="p-1 rounded text-mid-ash hover:text-graphite-ink transition"
                          title="Удалить"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
            <div className="absolute bottom-full mb-3 left-4 w-60 bg-pure-white border border-hairline rounded-2xl shadow-2xl p-2 z-30 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
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

          {/* Main ChatGPT Input Row */}
          <div className="flex items-center px-3 py-2 gap-2">
            {/* Attachment Button (+ Photo) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition shrink-0"
              title="Добавить фотографии"
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            {/* Aspect Ratio Badge */}
            <button
              onClick={() => setIsRatioOpen(!isRatioOpen)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-mid-ash hover:text-graphite-ink bg-sidebar-mist hover:bg-hover-veil border border-hairline transition shrink-0"
              title="Выбрать соотношение сторон"
            >
              <span>{currentRatio.short}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Prompt Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                prompts.length === 0
                  ? 'Введите промпт и нажмите Enter (сохранится как плашка)...'
                  : 'Добавить еще промпт (Enter)...'
              }
              className="flex-1 bg-transparent border-none text-sm text-graphite-ink placeholder:text-hollow focus:outline-none focus:ring-0 py-1.5 px-1 min-w-0"
            />

            {/* Settings Toggle */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-xl text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition shrink-0 ${
                isSettingsOpen ? 'bg-hover-veil text-graphite-ink' : ''
              }`}
              title="Настройки генератора"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Send / Launch Arrow Button (ChatGPT Style) */}
            <button
              onClick={handleLaunch}
              disabled={photos.length === 0 || (prompts.length === 0 && !promptInput.trim())}
              className="w-8 h-8 rounded-full bg-graphite-ink text-pure-white flex items-center justify-center hover:bg-ink-press disabled:opacity-30 disabled:hover:bg-graphite-ink transition shrink-0 shadow-sm"
              title={
                photos.length === 0
                  ? 'Сначала добавьте фото'
                  : prompts.length === 0 && !promptInput.trim()
                  ? 'Сначала укажите промпт'
                  : isRunning
                  ? `Добавить в очередь (${totalCalculatedTasks})`
                  : `Запустить генерацию (${totalCalculatedTasks})`
              }
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Prompts Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 bg-deep-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-pure-white border border-hairline rounded-2xl max-w-lg w-full p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-hairline">
              <span className="font-semibold text-sm text-graphite-ink">Вставить список промптов</span>
              <button
                onClick={() => setIsBulkOpen(false)}
                className="text-mid-ash hover:text-graphite-ink p-1 rounded-lg hover:bg-hover-veil transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-mid-ash leading-relaxed">
              Вставьте каждый промпт с новой строки. Они будут добавлены к списку и сократятся в плашки по 2 слова.
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Каждый промпт с новой строки:&#10;cinematic 35mm film photography, natural lighting&#10;neon cyberpunk streetwear look with reflections&#10;clean minimalist black and white studio portrait..."
              rows={7}
              className="w-full bg-sidebar-mist border border-hairline rounded-xl p-3 text-xs text-graphite-ink placeholder:text-hollow focus:outline-none focus:border-graphite-ink leading-relaxed font-sans"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsBulkOpen(false)}
                className="px-3.5 py-1.5 text-xs text-mid-ash hover:text-graphite-ink border border-hairline rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
                  if (lines.length > 0) {
                    onAddBulkPrompts(lines);
                    setBulkText('');
                    setIsBulkOpen(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-medium bg-graphite-ink text-pure-white hover:bg-ink-press rounded-lg transition"
              >
                Добавить все ({bulkText.split('\n').map((l) => l.trim()).filter(Boolean).length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

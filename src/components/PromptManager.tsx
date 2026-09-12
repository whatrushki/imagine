import React, { useState } from 'react';
import { Plus, X, ListPlus, Sparkles } from 'lucide-react';
import { PromptItem } from '../types';

interface PromptManagerProps {
  prompts: PromptItem[];
  onAddPrompt: (text: string) => void;
  onAddBulkPrompts: (texts: string[]) => void;
  onRemovePrompt: (id: string) => void;
  onClearPrompts: () => void;
}

const PRESETS = [
  'retro vintage 1980s polaroid with soft grain',
  'cyberpunk night city, neon reflections and rain',
  'cinematic golden hour sunset lighting',
  'watercolor artistic sketch painting style',
  'high-end studio fashion magazine lighting',
];

export const PromptManager: React.FC<PromptManagerProps> = ({
  prompts,
  onAddPrompt,
  onAddBulkPrompts,
  onRemovePrompt,
  onClearPrompts,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleAdd = () => {
    if (inputVal.trim()) {
      onAddPrompt(inputVal.trim());
      setInputVal('');
    }
  };

  const handleBulkSubmit = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0) {
      onAddBulkPrompts(lines);
      setBulkText('');
      setIsBulkOpen(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border/60 mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm text-zinc-100">2. Промпты</span>
          <span className="text-[11px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {prompts.length} промптов
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded transition"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>Списком</span>
          </button>

          {prompts.length > 0 && (
            <button
              onClick={onClearPrompts}
              className="text-xs text-zinc-500 hover:text-red-400 transition"
              title="Очистить все промпты"
            >
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Введите инструкцию (промпт)..."
          className="flex-1 bg-zinc-950/60 border border-border rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition"
        />
        <button
          onClick={handleAdd}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold text-xs px-3 py-1.5 rounded-md transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Presets Chips */}
      <div className="mb-2.5 flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onAddPrompt(p)}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 px-2 py-0.5 rounded-full transition truncate max-w-[170px]"
            title={`Добавить: ${p}`}
          >
            + {p}
          </button>
        ))}
      </div>

      {/* Prompts List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[120px] max-h-[220px] sm:max-h-[280px]">
        {prompts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500 py-6">
            Нет добавленных промптов
          </div>
        ) : (
          prompts.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-start justify-between p-2 rounded-md border border-border/40 bg-zinc-950/40 text-xs text-zinc-200 group transition hover:border-zinc-700"
            >
              <div className="flex items-start space-x-2 min-w-0 pr-2">
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 shrink-0">
                  #{idx + 1}
                </span>
                <p className="leading-relaxed break-words">{p.text}</p>
              </div>
              <button
                onClick={() => onRemovePrompt(p.id)}
                className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bulk Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-semibold text-sm text-zinc-100">Вставить список промптов</span>
              <button onClick={() => setIsBulkOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Каждый промпт с новой строки:&#10;make the background sunny beach&#10;cyberpunk night city, neon reflections&#10;vintage 1980s polaroid..."
              rows={6}
              className="w-full bg-zinc-950 border border-border rounded-md p-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsBulkOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-border rounded-md"
              >
                Отмена
              </button>
              <button
                onClick={handleBulkSubmit}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-md"
              >
                Добавить все
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

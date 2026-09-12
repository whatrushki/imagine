import React from 'react';
import { Sliders, Cpu, Clock, Shuffle, Brain } from 'lucide-react';
import { GenerationSettings } from '../types';
import { RESOLUTIONS_1_5K } from '../lib/booguClient';

interface SettingsCardProps {
  settings: GenerationSettings;
  onChange: (settings: GenerationSettings) => void;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ settings, onChange }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5 space-y-3">
      <div className="flex items-center space-x-2 pb-2 border-b border-border/60">
        <Sliders className="w-4 h-4 text-blue-400" />
        <span className="font-semibold text-sm text-zinc-100">3. Параметры 1.5K</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Resolution */}
        <div className="space-y-1">
          <label className="text-zinc-400 font-medium">Разрешение (1.5K)</label>
          <select
            value={settings.resolution}
            onChange={(e) => onChange({ ...settings, resolution: e.target.value })}
            className="w-full bg-zinc-950/60 border border-border rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
          >
            {RESOLUTIONS_1_5K.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Workers */}
        <div className="space-y-1">
          <label className="text-zinc-400 font-medium flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            Потоков (Workers)
          </label>
          <select
            value={settings.workers}
            onChange={(e) => onChange({ ...settings, workers: parseInt(e.target.value, 10) })}
            className="w-full bg-zinc-950/60 border border-border rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
          >
            <option value={1}>1 поток (рекомендуется)</option>
            <option value={2}>2 потока</option>
            <option value={3}>3 потока</option>
            <option value={4}>4 потока</option>
          </select>
        </div>

        {/* Delay */}
        <div className="space-y-1">
          <label className="text-zinc-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            Пауза между запросами (сек)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="30"
            value={settings.delay}
            onChange={(e) => onChange({ ...settings, delay: parseFloat(e.target.value) || 0 })}
            className="w-full bg-zinc-950/60 border border-border rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col justify-center space-y-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={settings.randomSeed}
              onChange={(e) => onChange({ ...settings, randomSeed: e.target.checked })}
              className="rounded bg-zinc-900 border-zinc-700 text-blue-500 focus:ring-0"
            />
            <Shuffle className="w-3 h-3 text-zinc-400" />
            <span>Случайный Seed</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={settings.thinking}
              onChange={(e) => onChange({ ...settings, thinking: e.target.checked })}
              className="rounded bg-zinc-900 border-zinc-700 text-blue-500 focus:ring-0"
            />
            <Brain className="w-3 h-3 text-zinc-400" />
            <span>Thinking Mode</span>
          </label>
        </div>
      </div>
    </div>
  );
};

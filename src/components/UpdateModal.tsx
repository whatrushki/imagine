import React from 'react';
import {
  Download,
  Sparkles,
  X,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { UpdateInfo } from '../lib/updateChecker';

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateInfo, onClose }) => {
  const isAndroid =
    typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isWindows =
    typeof navigator !== 'undefined' && /windows/i.test(navigator.userAgent);

  const handleDownloadApk = () => {
    if (updateInfo.apkDownloadUrl) {
      window.location.href = updateInfo.apkDownloadUrl;
    } else {
      window.open(updateInfo.releaseUrl, '_blank');
    }
  };

  const handleDownloadExe = () => {
    if (updateInfo.exeDownloadUrl) {
      window.location.href = updateInfo.exeDownloadUrl;
    } else {
      window.open(updateInfo.releaseUrl, '_blank');
    }
  };

  const handleWebReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.update();
        }
      });
    }
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-deep-charcoal/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-pure-white border border-hairline rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sidebar-mist border border-hairline flex items-center justify-center text-graphite-ink">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-graphite-ink">
                Доступно обновление
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-mid-ash font-mono mt-0.5">
                <span>v{updateInfo.currentVersion}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="font-semibold text-emerald-600">
                  v{updateInfo.latestVersion}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Release Notes Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 text-xs text-graphite-ink">
          {updateInfo.releaseTitle && (
            <p className="font-semibold text-sm">{updateInfo.releaseTitle}</p>
          )}

          {updateInfo.releaseNotes ? (
            <div className="bg-sidebar-mist border border-hairline rounded-xl p-3 text-mid-ash whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto">
              {updateInfo.releaseNotes}
            </div>
          ) : (
            <p className="text-mid-ash">
              Новая версия включает улучшения стабильности, скорости генерации и обновленный интерфейс.
            </p>
          )}

          <div className="pt-1">
            <a
              href={updateInfo.releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-mid-ash hover:text-graphite-ink hover:underline"
            >
              <span>Посмотреть релиз на GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-hairline bg-sidebar-mist/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-mid-ash hover:text-graphite-ink border border-hairline hover:bg-hover-veil rounded-full transition"
          >
            Напомнить позже
          </button>

          {/* Primary Action Button based on platform */}
          {isAndroid && updateInfo.apkDownloadUrl ? (
            <button
              onClick={handleDownloadApk}
              className="inline-flex items-center justify-center gap-1.5 bg-graphite-ink hover:bg-black text-pure-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Скачать APK ({updateInfo.latestVersion})</span>
            </button>
          ) : isWindows && updateInfo.exeDownloadUrl ? (
            <button
              onClick={handleDownloadExe}
              className="inline-flex items-center justify-center gap-1.5 bg-graphite-ink hover:bg-black text-pure-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs active:scale-95"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Скачать установщик (.exe)</span>
            </button>
          ) : (
            <button
              onClick={handleWebReload}
              className="inline-flex items-center justify-center gap-1.5 bg-graphite-ink hover:bg-black text-pure-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Обновить приложение</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

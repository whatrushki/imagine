import React, { useState, useEffect } from 'react';
import { Sparkles, Download } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="border-b border-border bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <img src="./logo.svg" alt="Imagine" className="h-6 w-auto object-contain" />
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-100">
              Imagine
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-zinc-800/80 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-blue-400" />
              1.5K Turbo
            </span>
          </div>
        </div>

        {/* Action badges */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline font-medium">Сервер активен</span>
          </div>

          {deferredPrompt && !isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-3 py-1.5 rounded-md transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Установить PWA</span>
            </button>
          )}

          <a
            href="https://demo-edit-turbo-1k.boogu.org/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 px-2.5 py-1.5 rounded-md transition"
          >
            Демо Boogu ↗
          </a>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Sidebar } from './components/Sidebar';
import { CreationStudio } from './components/CreationStudio';
import { QueueTable } from './components/QueueTable';
import { ResultsFeed } from './components/ResultsFeed';
import { LightboxModal } from './components/LightboxModal';
import { PhotoItem, PromptItem, MatrixTask, GenerationSettings, SessionItem } from './types';
import { generateImage, resetGradioClient } from './lib/booguClient';
import { sanitizeFilename } from './lib/utils';
import {
  cacheImageBlob,
  getCachedImageBlob,
  exportImageToGallery,
  saveInputPhotos,
  loadInputPhotos,
  saveSourcePhotos,
  loadAllSourcePhotos,
  saveQueueTasks,
  loadQueueTasks,
  saveAppState,
  getAppState,
} from './lib/storage';
import { backgroundRunner } from './lib/backgroundRunner';
import { Menu } from 'lucide-react';

const defaultSettings: GenerationSettings = {
  resolution: '1536x1536 ( 1:1 )',
  workers: 1,
  delay: 2.0,
  randomSeed: true,
  seed: 42,
  thinking: false,
};

export const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'studio' | 'queue' | 'gallery'>('studio');

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>(defaultSettings);

  const [tasks, setTasks] = useState<MatrixTask[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lightboxTask, setLightboxTask] = useState<MatrixTask | null>(null);

  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false);

  // Sessions History
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // PWA Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Persistent cache of source photos across batches
  const sourcePhotosMapRef = useRef<Map<string, PhotoItem>>(new Map());

  const photosRef = useRef<PhotoItem[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const tasksRef = useRef<MatrixTask[]>([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const activeQueueRef = useRef<string[]>([]);
  const isWorkerLoopRunningRef = useRef<boolean>(false);
  const stopSignalRef = useRef(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Restore state from IndexedDB & LocalStorage on mount
  useEffect(() => {
    let isMounted = true;
    async function hydrate() {
      try {
        const [savedPhotos, savedPrompts, savedSettings, savedView, savedTasks, sourcePhotosMap] = await Promise.all([
          loadInputPhotos(),
          getAppState<PromptItem[]>('prompts', []),
          getAppState<GenerationSettings>('settings', defaultSettings),
          getAppState<'studio' | 'queue' | 'gallery'>('activeView', 'studio'),
          loadQueueTasks(),
          loadAllSourcePhotos(),
        ]);

        if (!isMounted) return;

        if (sourcePhotosMap) {
          for (const [k, v] of sourcePhotosMap.entries()) {
            sourcePhotosMapRef.current.set(k, v);
          }
        }

        if (savedPhotos && savedPhotos.length > 0) {
          setPhotos(savedPhotos);
          photosRef.current = savedPhotos;
          for (const p of savedPhotos) {
            sourcePhotosMapRef.current.set(p.id, p);
          }
        }
        if (savedPrompts && savedPrompts.length > 0) setPrompts(savedPrompts);
        if (savedSettings) setSettings(savedSettings);
        if (savedView) setActiveView(savedView);
        if (savedTasks && savedTasks.length > 0) {
          setTasks(savedTasks);
          tasksRef.current = savedTasks;
        }
      } catch (e) {
        console.warn('Hydration notice:', e);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }
    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-save draft photos to IndexedDB
  useEffect(() => {
    if (!isHydrated) return;
    saveInputPhotos(photos);
  }, [photos, isHydrated]);

  // Auto-save prompts
  useEffect(() => {
    if (!isHydrated) return;
    saveAppState('prompts', prompts);
  }, [prompts, isHydrated]);

  // Auto-save settings
  useEffect(() => {
    if (!isHydrated) return;
    saveAppState('settings', settings);
  }, [settings, isHydrated]);

  // Auto-save active view
  useEffect(() => {
    if (!isHydrated) return;
    saveAppState('activeView', activeView);
  }, [activeView, isHydrated]);

  // Auto-save tasks to IndexedDB (debounced)
  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(() => {
      saveQueueTasks(tasks);
    }, 250);
    return () => clearTimeout(timer);
  }, [tasks, isHydrated]);

  // Photo handlers
  const handleAddPhotos = (files: File[]) => {
    const newItems: PhotoItem[] = files.map((file) => ({
      id: `${file.name}_${file.size}_${Date.now()}_${Math.random()}`,
      name: file.name,
      size: file.size,
      dataUrl: URL.createObjectURL(file),
      file,
    }));
    setPhotos((prev) => [...prev, ...newItems]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearPhotos = () => {
    setPhotos([]);
  };

  // Prompt handlers
  const handleAddPrompt = (text: string) => {
    if (prompts.some((p) => p.text === text)) return;
    setPrompts((prev) => [
      ...prev,
      { id: `${Date.now()}_${Math.random()}`, text },
    ]);
  };

  const handleAddBulkPrompts = (texts: string[]) => {
    const newItems: PromptItem[] = texts
      .filter((t) => !prompts.some((p) => p.text === t))
      .map((t) => ({ id: `${Date.now()}_${Math.random()}`, text: t }));
    setPrompts((prev) => [...prev, ...newItems]);
  };

  const handleRemovePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearPrompts = () => {
    setPrompts([]);
  };

  // New Generation
  const handleNewGeneration = () => {
    setActiveView('studio');
  };

  // Core Runner Engine (Processes activeQueueRef)
  const runWorkerEngine = async () => {
    if (isWorkerLoopRunningRef.current) return;
    isWorkerLoopRunningRef.current = true;
    setIsRunning(true);
    stopSignalRef.current = false;

    // Start background persistence (Wake Lock, Silent Audio for iOS/Android, Heartbeat Worker)
    await backgroundRunner.start();

    const workerCount = Math.max(1, settings.workers);

    const runWorker = async () => {
      while (activeQueueRef.current.length > 0 && !stopSignalRef.current) {
        const taskId = activeQueueRef.current.shift();
        if (!taskId) break;

        const task = tasksRef.current.find((t) => t.id === taskId);
        if (!task) continue;

        let photo = sourcePhotosMapRef.current.get(task.photoId);
        if (!photo) {
          photo =
            photosRef.current.find((p) => p.id === task.photoId) ||
            photos.find((p) => p.id === task.photoId);
        }
        if (!photo) {
          const allSources = await loadAllSourcePhotos();
          for (const [k, v] of allSources.entries()) {
            sourcePhotosMapRef.current.set(k, v);
          }
          photo = sourcePhotosMapRef.current.get(task.photoId);
        }
        if (!photo) {
          console.error(`Photo not found for task ${task.id}`);
          continue;
        }

        // Set status to processing
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: 'processing', error: undefined } : t
          )
        );

        try {
          const seed = settings.randomSeed
            ? Math.floor(Math.random() * 2147483647)
            : settings.seed;

          const { resultUrl, duration } = await generateImage(
            photo.file,
            task.promptText,
            settings.resolution,
            seed,
            settings.thinking
          );

          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, status: 'success', resultUrl, duration, failCount: 0, error: undefined }
                : t
            )
          );

          // Silently cache generated image blob inside internal storage
          try {
            const resp = await fetch(resultUrl);
            const blob = await resp.blob();
            await cacheImageBlob(taskId, blob);
          } catch (storageErr) {
            console.warn('Silent cache notice:', storageErr);
          }
        } catch (err: any) {
          console.error(`Task ${taskId} failed:`, err);
          // In case connection dropped during sleep/background, reset Gradio client for clean reconnect
          resetGradioClient();

          const newFailCount = (task.failCount || 0) + 1;
          const MAX_RETRIES = 5;

          const errMsg = err?.message || String(err || '');
          const isRateLimit =
            errMsg.includes('Only one request is permitted') ||
            errMsg.includes('429') ||
            errMsg.includes('rate limit') ||
            errMsg.includes('queue');

          if (newFailCount <= MAX_RETRIES && !stopSignalRef.current) {
            // Gradio demo rate limit requires waiting 6..14 seconds before the next query
            const backoffSec = isRateLimit
              ? Math.min(15, 4 + newFailCount * 2)
              : Math.min(10, 2 + newFailCount * 2);

            const statusMsg = isRateLimit
              ? `Рейт-лимит демо (пауза ${backoffSec}с, попытка ${newFailCount}/${MAX_RETRIES})`
              : `Сбой (${errMsg.slice(0, 40)}). Повтор через ${backoffSec}с (${newFailCount}/${MAX_RETRIES})`;

            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId
                  ? { ...t, status: 'requeued', failCount: newFailCount, error: statusMsg }
                  : t
              )
            );

            // Wait backoff delay
            await new Promise((r) => setTimeout(r, backoffSec * 1000));

            if (!stopSignalRef.current) {
              activeQueueRef.current.push(taskId);
            }
          } else {
            // Max retries exhausted
            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'error',
                      failCount: newFailCount,
                      error: isRateLimit
                        ? 'Сервер перегружен (исчерпано 5 попыток). Нажмите «Повторить» для ручного перезапуска.'
                        : errMsg || 'Ошибка сервера',
                    }
                  : t
              )
            );
          }
        }

        if (settings.delay > 0 && !stopSignalRef.current && activeQueueRef.current.length > 0) {
          await new Promise((r) => setTimeout(r, settings.delay * 1000));
        }
      }
    };

    const workerPromises = Array.from({ length: workerCount }, () => runWorker());
    await Promise.all(workerPromises);

    isWorkerLoopRunningRef.current = false;
    setIsRunning(false);
    backgroundRunner.stop();
  };

  // Re-run or trigger single task
  const handleRegenerateById = (taskId: string) => {
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'pending', error: undefined, failCount: 0, resultUrl: null }
          : t
      )
    );

    if (isWorkerLoopRunningRef.current) {
      if (!activeQueueRef.current.includes(taskId)) {
        activeQueueRef.current.push(taskId);
      }
    } else {
      activeQueueRef.current = [taskId];
      runWorkerEngine();
    }
  };

  // Start or Append to Queue (Non-blocking: creates new batch without deleting previous tasks)
  const startQueue = async () => {
    // 1. If there are photos and prompts on the main page, create a new batch!
    if (photos.length > 0 && prompts.length > 0) {
      // Cache source photos into permanent storage and memory ref
      await saveSourcePhotos(photos);
      for (const p of photos) {
        sourcePhotosMapRef.current.set(p.id, p);
      }

      const batchId = `batch_${Date.now()}`;
      const newBatchTasks: MatrixTask[] = [];
      let idx = tasksRef.current.length;

      prompts.forEach((prompt) => {
        photos.forEach((photo) => {
          newBatchTasks.push({
            id: `${photo.id}_${prompt.id}_${Date.now()}_${idx}`,
            index: idx,
            batchId,
            photoId: photo.id,
            photoName: photo.name,
            photoDataUrl: photo.dataUrl,
            promptId: prompt.id,
            promptText: prompt.text,
            status: 'pending',
            resultUrl: null,
            failCount: 0,
          });
          idx++;
        });
      });

      // Append new batch tasks to existing tasks
      const updatedTasks = [...tasksRef.current, ...newBatchTasks];
      setTasks(updatedTasks);
      tasksRef.current = updatedTasks;
      saveQueueTasks(updatedTasks);

      // Append task IDs to worker active queue
      const newIds = newBatchTasks.map((t) => t.id);
      activeQueueRef.current.push(...newIds);

      // REQUIREMENT 1: CLEAR THE MAIN PAGE!
      setPhotos([]);
      photosRef.current = [];
      setPrompts([]);

      // Session history record
      const sessId = `session-${Date.now()}`;
      const newSession: SessionItem = {
        id: sessId,
        title: `${photos.length} фото • ${prompts[0]?.text.slice(0, 24) || 'Стили'}...`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        photoCount: photos.length,
        promptCount: prompts.length,
        totalTasks: newBatchTasks.length,
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(sessId);
    } else {
      // Resume existing pending/requeued/error tasks
      const pendingIds = tasksRef.current
        .filter((t) => t.status === 'pending' || t.status === 'requeued' || t.status === 'error')
        .map((t) => t.id)
        .filter((id) => !activeQueueRef.current.includes(id));

      if (pendingIds.length > 0) {
        activeQueueRef.current.push(...pendingIds);
      }
    }

    // Navigate to Queue view
    setActiveView('queue');

    // If workers not running, start them!
    if (!isWorkerLoopRunningRef.current) {
      runWorkerEngine();
    }
  };

  const stopQueue = () => {
    stopSignalRef.current = true;
    activeQueueRef.current = [];
    isWorkerLoopRunningRef.current = false;
    setIsRunning(false);
    backgroundRunner.stop();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      tasksRef.current = updated;
      saveQueueTasks(updated);
      return updated;
    });
    activeQueueRef.current = activeQueueRef.current.filter((id) => id !== taskId);
  };

  const handleClearCompletedTasks = () => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.status !== 'success' && t.status !== 'error');
      tasksRef.current = updated;
      saveQueueTasks(updated);
      return updated;
    });
  };

  const handleClearAllTasks = () => {
    stopQueue();
    setTasks([]);
    tasksRef.current = [];
    activeQueueRef.current = [];
    saveQueueTasks([]);
  };

  // Download or Export Single to Device Gallery
  const handleDownloadSingle = async (task: MatrixTask) => {
    if (!task.resultUrl) return;
    try {
      let blob = await getCachedImageBlob(task.id);
      if (!blob) {
        const resp = await fetch(task.resultUrl);
        blob = await resp.blob();
        await cacheImageBlob(task.id, blob);
      }
      const photoStem = task.photoName.replace(/\.[^/.]+$/, '');
      const slug = sanitizeFilename(task.promptText);
      const filename = `${photoStem}__p${task.index + 1}_${slug}.png`;
      await exportImageToGallery(blob, filename, task.promptText);
    } catch (e) {
      console.error('Gallery export error:', e);
    }
  };

  // Download All ZIP
  const handleDownloadZip = async () => {
    const successTasks = tasks.filter((t) => t.status === 'success' && t.resultUrl);
    if (successTasks.length === 0) return;

    const zip = new JSZip();
    for (const task of successTasks) {
      try {
        const resp = await fetch(task.resultUrl!);
        const blob = await resp.blob();
        const photoStem = task.photoName.replace(/\.[^/.]+$/, '');
        const slug = sanitizeFilename(task.promptText);
        const filename = `${photoStem}__p${task.index + 1}_${slug}.png`;
        zip.file(filename, blob);
      } catch (e) {
        console.warn('Zip add fail:', e);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `imagine_batch_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const successTasksCount = tasks.filter((t) => t.status === 'success').length;
  const unfinishedTasksCount = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'requeued' || t.status === 'error'
  ).length;

  return (
    <div className="min-h-screen bg-pure-white text-graphite-ink flex flex-col font-sans">
      {/* ChatGPT-style Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        onNewGeneration={handleNewGeneration}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          setActiveView('gallery');
        }}
        totalTasksCount={tasks.length}
        resultsCount={successTasksCount}
        isRunning={isRunning}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
        }`}
      >
        {/* Top Minimalist App Bar */}
        <header className="h-14 border-b border-hairline bg-pure-white sticky top-0 z-30 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Show toggle button in header ONLY when sidebar is closed on mobile */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-[10px] text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition lg:hidden"
                title="Развернуть боковую панель"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <span className="font-semibold text-sm text-graphite-ink">
              {activeView === 'studio'
                ? 'Студия'
                : activeView === 'queue'
                ? 'Очередь генерации'
                : 'Галерея результатов'}
            </span>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center space-x-2 text-xs">
            {isRunning && (
              <span className="inline-flex items-center gap-1.5 text-xs text-graphite-ink font-medium bg-sidebar-mist border border-hairline px-2.5 py-1 rounded-[10px] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-graphite-ink" />
                Генерация в процессе...
              </span>
            )}
          </div>
        </header>

        {/* Unfinished session resume alert banner */}
        {unfinishedTasksCount > 0 && successTasksCount > 0 && !isRunning && (
          <div className="bg-sidebar-mist border-b border-hairline px-4 py-2.5 flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-graphite-ink min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span className="truncate">
                Сессия сохранена: готово <strong>{successTasksCount}</strong>, осталось <strong>{unfinishedTasksCount}</strong>.
              </span>
            </div>
            <button
              onClick={startQueue}
              className="shrink-0 bg-graphite-ink hover:bg-ink-press text-pure-white px-3 py-1.5 rounded-lg font-medium transition text-xs flex items-center gap-1.5"
            >
              <span>Продолжить генерацию</span>
            </button>
          </div>
        )}

        {/* View Content */}
        <main
          className={`flex-1 flex flex-col ${
            activeView === 'studio'
              ? 'p-0 overflow-hidden'
              : 'p-3 sm:p-6 md:p-8 overflow-y-auto'
          }`}
        >
          {activeView === 'studio' && (
            <CreationStudio
              photos={photos}
              onAddPhotos={handleAddPhotos}
              onRemovePhoto={handleRemovePhoto}
              onClearPhotos={handleClearPhotos}
              prompts={prompts}
              onAddPrompt={handleAddPrompt}
              onAddBulkPrompts={handleAddBulkPrompts}
              onRemovePrompt={handleRemovePrompt}
              onClearPrompts={handleClearPrompts}
              settings={settings}
              onUpdateSettings={setSettings}
              onStartGeneration={startQueue}
              isRunning={isRunning}
            />
          )}

          {activeView === 'queue' && (
            <QueueTable
              tasks={tasks}
              isRunning={isRunning}
              onStart={startQueue}
              onStop={stopQueue}
              onRegenerateTask={handleRegenerateById}
              onDeleteTask={handleDeleteTask}
              onClearCompleted={handleClearCompletedTasks}
              onClearAll={handleClearAllTasks}
              onDownloadZip={handleDownloadZip}
              onDownloadSingle={handleDownloadSingle}
              onOpenLightbox={(t) => setLightboxTask(t)}
            />
          )}

          {activeView === 'gallery' && (
            <ResultsFeed
              tasks={tasks}
              photos={photos}
              isRunning={isRunning}
              onStop={stopQueue}
              onNewGeneration={handleNewGeneration}
              onRegenerateTask={handleRegenerateById}
              onDownloadZip={handleDownloadZip}
              onDownloadSingle={handleDownloadSingle}
              onOpenLightbox={(t) => setLightboxTask(t)}
            />
          )}
        </main>
      </div>

      {/* Lightbox Modal (Fullscreen Multi-photo browsing & Gallery export) */}
      {lightboxTask && (
        <LightboxModal
          tasks={tasks.filter((t) => t.resultUrl || t.status === 'success')}
          initialTaskId={lightboxTask.id}
          photos={photos}
          onClose={() => setLightboxTask(null)}
          onRegenerate={handleRegenerateById}
          onDownload={handleDownloadSingle}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Sidebar } from './components/Sidebar';
import { CreationStudio } from './components/CreationStudio';
import { QueueTable } from './components/QueueTable';
import { ResultsFeed } from './components/ResultsFeed';
import { LightboxModal } from './components/LightboxModal';
import { UpdateModal } from './components/UpdateModal';
import { checkForAppUpdate, UpdateInfo } from './lib/updateChecker';
import { PhotoItem, MatrixTask, GenerationSettings, SessionItem } from './types';
import { generateImage, resetGradioClient } from './lib/booguClient';
import { sanitizeFilename } from './lib/utils';
import {
  cacheImageBlob,
  getCachedImageBlob,
  exportImageToGallery,
  clearGeneratedCache,
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
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [activeView, setActiveView] = useState<'studio' | 'queue' | 'gallery'>('studio');

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
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

  // Auto-Update State
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Check for app updates in background on mount
  useEffect(() => {
    const timer = setTimeout(async () => {
      const info = await checkForAppUpdate();
      if (info) {
        setUpdateInfo(info);
        if (info.hasUpdate) {
          setShowUpdateModal(true);
        }
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenUpdateModal = async () => {
    if (!updateInfo) {
      const info = await checkForAppUpdate();
      if (info) setUpdateInfo(info);
    }
    setShowUpdateModal(true);
  };

  // Mobile edge-swipe gesture to open and close side sheet (Sidebar)
  const edgeTouchRef = useRef<{ startX: number; startY: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      edgeTouchRef.current = {
        startX: t.clientX,
        startY: t.clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!edgeTouchRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const deltaX = t.clientX - edgeTouchRef.current.startX;
      const deltaY = t.clientY - edgeTouchRef.current.startY;

      // Only handle clear horizontal swipe gestures
      if (Math.abs(deltaX) > 25 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe right from anywhere in the left 70% of screen opens sidebar
        if (!sidebarOpen && edgeTouchRef.current.startX < window.innerWidth * 0.70 && deltaX > 25) {
          setSidebarOpen(true);
          edgeTouchRef.current = null;
        }
        // Swipe left when sidebar is open closes it
        else if (sidebarOpen && deltaX < -25) {
          setSidebarOpen(false);
          edgeTouchRef.current = null;
        }
      }
    };

    const handleTouchEnd = () => {
      edgeTouchRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [sidebarOpen]);

  // Persistent cache of source photos across batches
  const sourcePhotosMapRef = useRef<Map<string, PhotoItem>>(new Map());

  // References for async worker loop
  const tasksRef = useRef<MatrixTask[]>([]);
  tasksRef.current = tasks;

  const photosRef = useRef<PhotoItem[]>([]);
  photosRef.current = photos;

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const activeQueueRef = useRef<string[]>([]);
  const stopSignalRef = useRef(false);
  const isWorkerLoopRunningRef = useRef(false);

  // 1. Load persisted data on mount (IndexedDB + LocalStorage)
  useEffect(() => {
    let isCancelled = false;

    async function hydrate() {
      try {
        // Load settings & sessions
        const savedSettings = await getAppState<GenerationSettings>('settings', defaultSettings);
        const savedSessions = await getAppState<SessionItem[]>('sessions', []);

        // Load permanent source photos map
        const sourceMap = await loadAllSourcePhotos();
        sourcePhotosMapRef.current = sourceMap;

        // Load input photos
        const savedPhotos = await loadInputPhotos();
        for (const p of savedPhotos) {
          sourcePhotosMapRef.current.set(p.id, p);
        }

        // Load queue tasks
        const savedTasks = await loadQueueTasks();

        if (!isCancelled) {
          setSettings(savedSettings);
          setSessions(savedSessions);
          setPhotos(savedPhotos);
          setTasks(savedTasks);
          tasksRef.current = savedTasks;
          setIsHydrated(true);

          if (window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }
      } catch (err) {
        console.error('Failed to hydrate state:', err);
        if (!isCancelled) setIsHydrated(true);
      }
    }

    hydrate();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      isCancelled = true;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    if (!isHydrated) return;
    saveInputPhotos(photos);
  }, [photos, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveAppState('settings', settings);
  }, [settings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveAppState('sessions', sessions);
  }, [sessions, isHydrated]);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleAddPhotos = (files: File[]) => {
    const newItems: PhotoItem[] = files.map((file) => ({
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      dataUrl: URL.createObjectURL(file),
      file,
    }));

    setPhotos((prev) => {
      const updated = [...prev, ...newItems];
      for (const item of updated) {
        sourcePhotosMapRef.current.set(item.id, item);
      }
      return updated;
    });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearPhotos = () => {
    setPhotos([]);
  };

  const handleNewGeneration = () => {
    setActiveView('studio');
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const updateTaskStatus = (
    taskId: string,
    updates: Partial<MatrixTask>,
    resultBlob?: Blob
  ) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      tasksRef.current = updated;
      saveQueueTasks(updated);
      return updated;
    });

    if (resultBlob) {
      cacheImageBlob(taskId, resultBlob);
    }
  };

  // Central Generator Engine (Worker Loop with Exponential Backoff Retry)
  const runWorkerEngine = async () => {
    if (isWorkerLoopRunningRef.current) return;
    isWorkerLoopRunningRef.current = true;
    stopSignalRef.current = false;
    setIsRunning(true);

    try {
      await backgroundRunner.start();
    } catch (e) {
      console.warn('Background runner start warn:', e);
    }

    const workerCount = Math.max(1, Math.min(3, settings.workers || 1));

    const worker = async (workerIndex: number) => {
      while (!stopSignalRef.current) {
        const taskId = activeQueueRef.current.shift();
        if (!taskId) break;

        const currentTask = tasksRef.current.find((t) => t.id === taskId);
        if (!currentTask) continue;

        let photo = sourcePhotosMapRef.current.get(currentTask.photoId);
        if (!photo) {
          photo = photosRef.current.find((p) => p.id === currentTask.photoId);
        }

        if (!photo || !photo.file) {
          updateTaskStatus(taskId, {
            status: 'error',
            error: 'Исходный файл фото не найден',
          });
          continue;
        }

        updateTaskStatus(taskId, {
          status: 'processing',
          error: undefined,
        });

        try {
          const seed = settings.randomSeed
            ? Math.floor(Math.random() * 2147483647)
            : settings.seed;

          const { resultUrl, duration } = await generateImage(
            photo.file,
            currentTask.promptText,
            settings.resolution,
            seed,
            settings.thinking
          );

          updateTaskStatus(taskId, {
            status: 'success',
            resultUrl,
            duration,
            failCount: 0,
            error: undefined,
          });

          try {
            const resp = await fetch(resultUrl);
            const blob = await resp.blob();
            await cacheImageBlob(taskId, blob);
          } catch (e) {
            console.warn('Cache error:', e);
          }
        } catch (err: any) {
          const errMsg = err?.message || 'Ошибка генерации';
          console.error(`Task ${taskId} failed:`, errMsg);

          const failCount = (currentTask.failCount || 0) + 1;

          if (failCount < 5 && !stopSignalRef.current) {
            const backoffMs = Math.min(12000, 2000 * Math.pow(1.5, failCount - 1));

            updateTaskStatus(taskId, {
              status: 'requeued',
              failCount,
              error: `${errMsg}. Повтор через ${(backoffMs / 1000).toFixed(0)}с (${failCount}/5)`,
            });

            resetGradioClient();

            setTimeout(() => {
              if (!stopSignalRef.current) {
                activeQueueRef.current.push(taskId);
                if (!isWorkerLoopRunningRef.current) {
                  runWorkerEngine();
                }
              }
            }, backoffMs);
          } else {
            updateTaskStatus(taskId, {
              status: 'error',
              failCount,
              error: errMsg,
            });
          }
        }

        if (settings.delay > 0 && !stopSignalRef.current) {
          await new Promise((res) => setTimeout(res, settings.delay * 1000));
        }
      }
    };

    const workers = Array.from({ length: workerCount }, (_, i) => worker(i + 1));
    await Promise.all(workers);

    if (activeQueueRef.current.length === 0) {
      setIsRunning(false);
      isWorkerLoopRunningRef.current = false;
      backgroundRunner.stop();
    }
  };

  const handleRegenerateById = (taskId: string) => {
    updateTaskStatus(taskId, {
      status: 'pending',
      resultUrl: null,
      error: undefined,
      failCount: 0,
    });

    if (isWorkerLoopRunningRef.current) {
      if (!activeQueueRef.current.includes(taskId)) {
        activeQueueRef.current.push(taskId);
      }
    } else {
      activeQueueRef.current = [taskId];
      runWorkerEngine();
    }
  };

  // Launch a new batch: Single prompt + multiple photos immediately sent to queue!
  const handleStartBatch = async (promptText: string) => {
    if (photos.length === 0 || !promptText.trim()) return;

    // Cache source photos permanently
    await saveSourcePhotos(photos);
    for (const p of photos) {
      sourcePhotosMapRef.current.set(p.id, p);
    }

    const batchId = `batch_${Date.now()}`;
    const newBatchTasks: MatrixTask[] = [];
    let idx = tasksRef.current.length;

    photos.forEach((photo) => {
      newBatchTasks.push({
        id: `${photo.id}_${Date.now()}_${idx}`,
        index: idx,
        batchId,
        photoId: photo.id,
        photoName: photo.name,
        photoDataUrl: photo.dataUrl,
        promptId: `p_${Date.now()}`,
        promptText: promptText.trim(),
        status: 'pending',
        resultUrl: null,
        failCount: 0,
      });
      idx++;
    });

    // Append new batch to tasks list without wiping old tasks
    const updatedTasks = [...tasksRef.current, ...newBatchTasks];
    setTasks(updatedTasks);
    tasksRef.current = updatedTasks;
    saveQueueTasks(updatedTasks);

    // Append to active execution queue
    const newIds = newBatchTasks.map((t) => t.id);
    activeQueueRef.current.push(...newIds);

    // Clear studio inputs on launch (ChatGPT pattern)
    setPhotos([]);
    photosRef.current = [];

    // Save session record
    const sessId = `session-${Date.now()}`;
    const newSession: SessionItem = {
      id: sessId,
      title: `${newBatchTasks.length} фото • ${promptText.trim().slice(0, 24)}...`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photoCount: newBatchTasks.length,
      promptCount: 1,
      totalTasks: newBatchTasks.length,
    };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    saveAppState('sessions', updatedSessions);
    setCurrentSessionId(sessId);

    // Navigate to Queue view
    setActiveView('queue');

    // Run workers
    if (!isWorkerLoopRunningRef.current) {
      runWorkerEngine();
    }
  };

  // Resume remaining pending tasks
  const startQueue = () => {
    const pendingIds = tasksRef.current
      .filter((t) => t.status === 'pending' || t.status === 'requeued' || t.status === 'error')
      .map((t) => t.id)
      .filter((id) => !activeQueueRef.current.includes(id));

    if (pendingIds.length > 0) {
      activeQueueRef.current.push(...pendingIds);
    }

    setActiveView('queue');

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

  // Clear Gallery (removes completed items from gallery vault)
  const handleClearGallery = async () => {
    const remaining = tasksRef.current.filter((t) => t.status !== 'success');
    setTasks(remaining);
    tasksRef.current = remaining;
    saveQueueTasks(remaining);
    await clearGeneratedCache();
  };

  // Clear History Sessions
  const handleClearHistory = () => {
    setSessions([]);
    setCurrentSessionId('');
    saveAppState('sessions', []);
  };

  const handleDeleteSession = (sessId: string) => {
    const updated = sessions.filter((s) => s.id !== sessId);
    setSessions(updated);
    saveAppState('sessions', updated);
    if (currentSessionId === sessId) {
      setCurrentSessionId('');
    }
  };

  // Direct download to device gallery / storage
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
      const filename = `${photoStem}__${slug}.png`;
      await exportImageToGallery(blob, filename, task.promptText);
    } catch (e) {
      console.error('Download error:', e);
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
        const filename = `${photoStem}__${slug}.png`;
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
    <div className="h-full w-full bg-pure-white text-graphite-ink flex flex-col font-sans overflow-hidden">
      {/* Sidebar with history management */}
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
        onClearHistory={handleClearHistory}
        onDeleteSession={handleDeleteSession}
        totalTasksCount={tasks.length}
        resultsCount={successTasksCount}
        isRunning={isRunning}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
        hasUpdate={!!updateInfo?.hasUpdate}
        latestVersion={updateInfo?.latestVersion}
        onOpenUpdateModal={handleOpenUpdateModal}
      />

      {/* Mobile edge swipe detector area for effortless drawer opening */}
      {!sidebarOpen && (
        <div
          className="fixed top-0 bottom-0 left-0 w-8 z-30 lg:hidden pointer-events-auto"
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col h-full min-h-0 overflow-hidden transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
        }`}
      >
        {/* Top App Bar with Safe Area Support for System Bars */}
        <header
          className="border-b border-hairline bg-pure-white shrink-0 sticky top-0 z-30 px-4 pt-safe flex items-center justify-between"
          style={{ minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-mid-ash hover:text-graphite-ink hover:bg-hover-veil transition lg:hidden"
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
                : 'Галерея'}
            </span>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center space-x-2 text-xs">
            {isRunning && (
              <span className="inline-flex items-center gap-1.5 text-xs text-graphite-ink font-medium bg-sidebar-mist border border-hairline px-2.5 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-graphite-ink" />
                Генерация...
              </span>
            )}
          </div>
        </header>

        {/* Resume Session Banner */}
        {unfinishedTasksCount > 0 && successTasksCount > 0 && !isRunning && (
          <div className="bg-sidebar-mist border-b border-hairline px-4 py-2.5 flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-graphite-ink min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span className="truncate">
                Готово <strong>{successTasksCount}</strong>, осталось <strong>{unfinishedTasksCount}</strong>.
              </span>
            </div>
            <button
              onClick={startQueue}
              className="shrink-0 bg-graphite-ink hover:bg-ink-press text-pure-white px-3 py-1.5 rounded-full font-medium transition text-xs flex items-center gap-1.5"
            >
              <span>Продолжить</span>
            </button>
          </div>
        )}

        {/* View Content */}
        <main
          className={`flex-1 min-h-0 overflow-hidden flex flex-col ${
            activeView === 'studio'
              ? 'p-0'
              : 'p-3 sm:p-6 md:p-8 overflow-y-auto overscroll-contain pb-safe'
          }`}
        >
          {activeView === 'studio' && (
            <CreationStudio
              photos={photos}
              onAddPhotos={handleAddPhotos}
              onRemovePhoto={handleRemovePhoto}
              onClearPhotos={handleClearPhotos}
              settings={settings}
              onUpdateSettings={setSettings}
              onStartBatch={handleStartBatch}
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
              onClearGallery={handleClearGallery}
            />
          )}
        </main>
      </div>

      {/* Fullscreen Lightbox Modal */}
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

      {/* Auto-Update Notification Modal */}
      {showUpdateModal && updateInfo && (
        <UpdateModal
          updateInfo={updateInfo}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
};

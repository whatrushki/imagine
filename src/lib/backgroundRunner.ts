// Background runner: Screen Wake Lock, Silent Audio Keep-Alive for iOS/Android, and Worker Heartbeat

class BackgroundRunner {
  private wakeLock: any = null;
  private audioEl: HTMLAudioElement | null = null;
  private worker: Worker | null = null;
  private isRunning: boolean = false;
  private onTickCallback: (() => void) | null = null;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
  }

  /** Initialize and start all background persistence mechanisms */
  public async start(onTick?: () => void) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onTickCallback = onTick || null;

    // 1. Request Screen Wake Lock (prevents device display from sleeping during generation)
    await this.requestWakeLock();

    // 2. Start Silent Audio loop (tells iOS/Android OS to keep JS execution alive in background)
    this.startSilentAudio();

    // 3. Start Web Worker Heartbeat (bypasses desktop background tab timer throttling)
    this.startWorkerHeartbeat();

    // 4. Attach event listeners
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  /** Stop all background persistence mechanisms */
  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    this.releaseWakeLock();
    this.stopSilentAudio();
    this.stopWorkerHeartbeat();

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  private async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (err) {
        console.warn('Screen WakeLock unavailable:', err);
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }

  private startSilentAudio() {
    try {
      if (!this.audioEl && typeof Audio !== 'undefined') {
        // Minimal valid silent WAV audio data URI (mono, 8000Hz, 8-bit)
        const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.audioEl = new Audio(silentWav);
        this.audioEl.loop = true;
        // Inaudible but non-zero volume prevents iOS Safari and Android Chrome from pausing
        this.audioEl.volume = 0.001;
      }
      if (this.audioEl) {
        this.audioEl.play().catch(() => {
          // In case user gesture restrictions apply, it will play on first user interaction
        });
      }
    } catch (err) {
      console.warn('Background audio keep-alive notice:', err);
    }
  }

  private stopSilentAudio() {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch {}
    }
  }

  private startWorkerHeartbeat() {
    try {
      if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
        const workerCode = `
          let timer = null;
          self.onmessage = function(e) {
            if (e.data === 'start') {
              if (!timer) {
                timer = setInterval(function() {
                  self.postMessage('heartbeat');
                }, 1000);
              }
            } else if (e.data === 'stop') {
              if (timer) {
                clearInterval(timer);
                timer = null;
              }
            }
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        this.worker = new Worker(workerUrl);

        this.worker.onmessage = () => {
          if (this.onTickCallback && this.isRunning) {
            this.onTickCallback();
          }
        };

        this.worker.postMessage('start');
      }
    } catch (err) {
      console.warn('Worker heartbeat notice:', err);
    }
  }

  private stopWorkerHeartbeat() {
    if (this.worker) {
      try {
        this.worker.postMessage('stop');
        this.worker.terminate();
      } catch {}
      this.worker = null;
    }
  }

  private handleVisibilityChange() {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible' && this.isRunning) {
      // Re-request wake lock if lost when app was minimized/screen locked
      if (!this.wakeLock) {
        this.requestWakeLock();
      }
      // Re-play audio if paused by OS
      if (this.audioEl && this.audioEl.paused) {
        this.audioEl.play().catch(() => {});
      }
    }
  }

  private handleBeforeUnload(e: BeforeUnloadEvent) {
    if (this.isRunning) {
      const msg = 'Очередь генерации выполняется. Вы уверены, что хотите покинуть страницу?';
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    }
  }
}

export const backgroundRunner = new BackgroundRunner();

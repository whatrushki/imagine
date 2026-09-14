export interface PhotoItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  file: File;
}

export interface PromptItem {
  id: string;
  text: string;
}

export type TaskStatus = 'pending' | 'processing' | 'requeued' | 'success' | 'error';

export interface MatrixTask {
  id: string;
  index: number;
  batchId?: string;
  photoId: string;
  photoName: string;
  photoDataUrl?: string;
  promptId: string;
  promptText: string;
  status: TaskStatus;
  resultUrl: string | null;
  duration?: number;
  error?: string;
  failCount: number;
}

export interface GenerationSettings {
  resolution: string;
  workers: number;
  delay: number;
  randomSeed: boolean;
  seed: number;
  thinking: boolean;
}

export interface SessionItem {
  id: string;
  batchId?: string;
  promptText?: string;
  title: string;
  date: string;
  photoCount: number;
  promptCount: number;
  totalTasks: number;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function sanitizeFilename(str: string, maxLen = 30): string {
  const clean = str.replace(/[^\w\s-]/gu, '').trim().replace(/[\s_-]+/g, '_');
  return clean.slice(0, maxLen) || 'prompt';
}

export function parseResDims(resStr: string): { width: number; height: number } {
  const match = resStr.match(/(\d+)x(\d+)/);
  if (match) {
    return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
  }
  return { width: 1536, height: 1536 };
}

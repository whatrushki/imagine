import React, { useRef } from 'react';
import { ImagePlus, Trash2, X, FolderPlus } from 'lucide-react';
import { PhotoItem } from '../types';
import { formatFileSize } from '../lib/utils';

interface PhotoManagerProps {
  photos: PhotoItem[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (id: string) => void;
  onClearPhotos: () => void;
  onSelectPhoto: (photo: PhotoItem) => void;
  selectedPhotoId?: string;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onClearPhotos,
  onSelectPhoto,
  selectedPhotoId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border/60 mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm text-zinc-100">1. Фотографии</span>
          <span className="text-[11px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {photos.length} фото
          </span>
        </div>

        {photos.length > 0 && (
          <button
            onClick={onClearPhotos}
            className="text-xs text-zinc-500 hover:text-red-400 transition"
            title="Очистить все фото"
          >
            Очистить
          </button>
        )}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950/40 hover:bg-zinc-950/80 rounded-md p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 mb-3"
      >
        <ImagePlus className="w-5 h-5 text-zinc-400" />
        <p className="text-xs font-medium text-zinc-300">
          Нажмите или перетащите фото сюда
        </p>
        <p className="text-[11px] text-zinc-500">
          PNG, JPG, WEBP • любое количество
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Photos List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[140px] max-h-[260px] sm:max-h-[320px]">
        {photos.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500 py-6">
            Нет добавленных фото
          </div>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onSelectPhoto(photo)}
              className={`flex items-center justify-between p-1.5 rounded-md border text-xs cursor-pointer transition ${
                selectedPhotoId === photo.id
                  ? 'border-blue-500/80 bg-blue-950/20'
                  : 'border-border/40 hover:border-zinc-700 bg-zinc-950/40'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  className="w-9 h-9 rounded object-cover border border-border/50 shrink-0"
                />
                <div className="truncate">
                  <p className="font-medium text-zinc-200 truncate">{photo.name}</p>
                  <p className="text-[10px] text-zinc-500">{formatFileSize(photo.size)}</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePhoto(photo.id);
                }}
                className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800/60 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

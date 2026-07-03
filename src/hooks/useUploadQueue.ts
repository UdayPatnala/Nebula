import { useState, useCallback } from 'react';
import { useNotification } from '../providers';

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  dataUrl?: string;
  error?: string;
}

// Client-side image compression utility
function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.7 quality factor to keep Base64 strings under 15-20KB
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(event.target?.result as string || '');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function useUploadQueue(onUploadComplete?: (completedFiles: UploadFile[]) => void) {
  const [queue, setQueue] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { showToast } = useNotification();

  const clearQueue = useCallback(() => {
    setQueue([]);
    setIsUploading(false);
  }, []);

  const addToQueue = useCallback((fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = Array.from(fileList).map((file) => {
      const id = `file_${Math.random().toString(36).substr(2, 9)}`;

      // Compress and store Base64 asynchronously
      if (file.type.startsWith('image/')) {
        compressImage(file).then((base64) => {
          setQueue((prev) =>
            prev.map((f) => (f.id === id ? { ...f, dataUrl: base64 } : f))
          );
        });
      }

      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'pending'
      };
    });

    setQueue((prev) => [...prev, ...newFiles]);
    showToast(`Added ${newFiles.length} file(s) to upload queue`, 'info');
  }, [showToast]);

  const startUpload = useCallback(async (_projectId: string) => {
    if (queue.length === 0 || isUploading) return;
    setIsUploading(true);
    showToast('Starting media upload...', 'info');

    // Simulate progress bar updates
    for (let i = 0; i < queue.length; i++) {
      const file = queue[i];
      if (file.status === 'completed') continue;

      setQueue((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' } : f))
      );

      // Simulate uploading chunks
      for (let percent = 20; percent <= 100; percent += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setQueue((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress: percent } : f
          )
        );
      }

      setQueue((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        )
      );
    }

    setIsUploading(false);
    showToast('Media upload completed successfully!', 'success');

    if (onUploadComplete) {
      // Fetch fresh queue to ensure dataUrls are read correctly
      setQueue((freshQueue) => {
        const completed = freshQueue.filter((f) => f.status === 'completed');
        onUploadComplete(completed);
        return freshQueue;
      });
    }
  }, [queue, isUploading, showToast, onUploadComplete]);

  const cancelUpload = useCallback(() => {
    setIsUploading(false);
    setQueue((prev) =>
      prev.map((f) =>
        f.status === 'uploading' ? { ...f, status: 'failed', error: 'Cancelled by user' } : f
      )
    );
    showToast('Upload operation cancelled', 'warning');
  }, [showToast]);

  const totalProgress = queue.length
    ? Math.round(queue.reduce((acc, f) => acc + f.progress, 0) / queue.length)
    : 0;

  return {
    queue,
    isUploading,
    totalProgress,
    addToQueue,
    startUpload,
    cancelUpload,
    clearQueue
  };
}

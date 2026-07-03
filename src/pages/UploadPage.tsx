import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useNotification } from '../providers';
import { useUploadQueue } from '../hooks/useUploadQueue';
import { api } from '../api/client';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { getMaxUploadSizeForRole } from '../config/roles';

export default function UploadPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define upload completed callback
  const handleUploadSuccess = async (completedFiles: any[]) => {
    if (!projectId) return;
    // Update media assets inside local DB
    await api.projects.uploadMedia(projectId, completedFiles);
    showToast(`Successfully uploaded ${completedFiles.length} files to project!`, 'success');
    
    // Auto route to AI Processing pipeline (Section 6.8 & Section 15)
    setTimeout(() => {
      navigate(`/projects/${projectId}/analysis`);
    }, 1000);
  };

  const {
    queue,
    isUploading,
    totalProgress,
    addToQueue,
    startUpload,
    cancelUpload,
    clearQueue
  } = useUploadQueue(handleUploadSuccess);

  if (!user) return null;
  const maxUploadSize = getMaxUploadSizeForRole(user.role);
  const maxUploadSizeMB = (maxUploadSize / (1024 * 1024)).toFixed(0);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const validateAndAddFiles = (fileList: FileList) => {
    const validFiles: File[] = [];
    let oversizedCount = 0;

    Array.from(fileList).forEach((file) => {
      // Validate maximum size by user role (Section 3 & Section 19.5)
      if (file.size > maxUploadSize) {
        oversizedCount++;
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedCount > 0) {
      showToast(`${oversizedCount} file(s) exceeded the ${maxUploadSizeMB} MB size limit for ${user.role.replace('_', ' ')}s.`, 'error');
    }

    if (validFiles.length > 0) {
      addToQueue(validFiles);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left' }}>
      {/* Header */}
      <header>
        <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
          Upload Media Assets
        </h2>
        <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Ingest images and videos. Upload size limit is <strong style={{ color: 'var(--color-text-primary)' }}>{maxUploadSizeMB} MB</strong> per file.
        </p>
      </header>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        style={{
          border: dragActive ? '2px dashed var(--color-primary)' : '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          background: dragActive ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-surface)',
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-normal)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,video/*"
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>
          📁
        </div>
        <h3 style={{ margin: '0 0 var(--spacing-xxs) 0' }}>
          Drag & Drop files or folders here
        </h3>
        <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
          or click to browse local folders
        </p>
      </div>

      {/* Upload Queue Panel */}
      {queue.length > 0 && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Ingestion Queue ({queue.length} files)</h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Button variant="secondary" onClick={clearQueue} disabled={isUploading}>
                Clear
              </Button>
              {isUploading ? (
                <Button variant="destructive" onClick={cancelUpload}>
                  Cancel Ingestion
                </Button>
              ) : (
                <Button variant="primary" onClick={() => startUpload(projectId || '')}>
                  Start Ingestion
                </Button>
              )}
            </div>
          </div>

          {/* Ingestion overall progress */}
          {isUploading && (
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xxs)', fontSize: 'var(--font-size-caption)' }}>
                <span>Ingestion Progress</span>
                <span style={{ fontWeight: 'bold' }}>{totalProgress}%</span>
              </div>
              <div style={{
                height: '8px',
                background: 'var(--color-border)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${totalProgress}%`,
                  background: 'var(--gradient-primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.1s ease'
                }} />
              </div>
            </div>
          )}

          {/* Queue List Table */}
          <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--font-size-caption)',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface-hover)' }}>
                  <th style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>File Name</th>
                  <th style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>Size</th>
                  <th style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>Type</th>
                  <th style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>Status</th>
                  <th style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', textAlign: 'right' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((file) => (
                  <tr key={file.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontWeight: 'var(--weight-semibold)' }}>{file.name}</td>
                    <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</td>
                    <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>{file.type || 'unknown'}</td>
                    <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
                      <Badge type={file.status === 'completed' ? 'success' : file.status === 'uploading' ? 'info' : file.status === 'failed' ? 'error' : 'neutral'}>
                        {file.status}
                      </Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', textAlign: 'right', fontWeight: 'bold' }}>{file.progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

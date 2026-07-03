import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNotification } from '../providers';
import { api } from '../api/client';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Loader } from '../components/Loader';
import type { Project } from '../types/project';

export default function GalleryBuilderPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { showToast } = useNotification();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Customize configuration state (Section 17.5 & 17.6)
  const [theme, setTheme] = useState('glass');
  const [layout, setLayout] = useState('grid');
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [transition, setTransition] = useState('fade');
  const [visibility, setVisibility] = useState('public');

  // Load project details
  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      setLoading(true);
      const res = await api.projects.getById(projectId);
      if (res.success && res.data) {
        setProject(res.data);
        if (res.data.theme) setTheme(res.data.theme);
        if (res.data.layout) setLayout(res.data.layout);
        if (res.data.musicEnabled !== undefined) setMusicEnabled(res.data.musicEnabled);
      }
      setLoading(false);
    }
    loadProject();
  }, [projectId]);

  const handleSaveConfig = async () => {
    if (!projectId) return;
    try {
      const res = await api.projects.update(projectId, {
        theme,
        layout,
        musicEnabled
      });
      if (res.success) {
        showToast('Gallery layout configuration saved successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to save layout configuration', 'error');
    }
  };

  const handlePublish = async () => {
    if (!projectId || !project) return;
    setPublishing(true);
    try {
      // Simulate publisher steps (Section 14.6 - checking completed uploads, preview, transaction commit)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const mockShareId = `share_${projectId}`;
      const mockUrl = `${window.location.origin}/gallery/${mockShareId}`;

      const res = await api.projects.update(projectId, {
        status: 'published',
        publishedUrl: mockUrl
      });

      if (res.success) {
        setShareLink(mockUrl);
        setShowShareModal(true);
        showToast('Story published successfully! Credit deducted.', 'success');
      }
    } catch (err) {
      showToast('Failed to publish gallery', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <Loader />;
  if (!project) return <div>Project not found</div>;

  // Real-time styled canvas container classes
  const getCanvasStyles = () => {
    switch (theme) {
      case 'glass':
        return {
          fontFamily: 'var(--font-sans)',
          background: 'radial-gradient(circle at top, #1e1b4b, #090a0f)',
          color: '#ffffff'
        };
      case 'editorial':
        return {
          fontFamily: 'Georgia, serif',
          background: '#faf8f5',
          color: '#1a1a1a'
        };
      case 'minimal':
      default:
        return {
          fontFamily: 'var(--font-sans)',
          background: 'var(--color-bg-base)',
          color: 'var(--color-text-primary)'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
            Gallery Generator Canvas
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Configure themes and layouts in real-time before publishing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button variant="secondary" onClick={handleSaveConfig}>
            Save Draft
          </Button>
          <Button variant="primary" onClick={handlePublish} loading={publishing}>
            🚀 Publish Story
          </Button>
        </div>
      </header>

      {/* Editor Panel Grid */}
      <div style={{ display: 'flex', flex: 1, gap: 'var(--spacing-lg)', overflow: 'hidden' }}>
        {/* Left Side Settings Panel */}
        <aside style={{
          width: '320px',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)'
        }}>
          <h3 style={{ margin: 0 }}>Customizer</h3>

          {/* Theme Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-caption)', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
              Story Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="minimal">Minimalist Clear</option>
              <option value="glass">Glassmorphism Cyber</option>
              <option value="editorial">Serif Editorial</option>
            </select>
          </div>

          {/* Layout Mode */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-caption)', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
              Layout Structure
            </label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="grid">Balanced Grid</option>
              <option value="masonry">Asymmetric Masonry</option>
              <option value="carousel">Horizontal Carousel</option>
            </select>
          </div>

          {/* Transitions */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-caption)', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
              Transitions
            </label>
            <select
              value={transition}
              onChange={(e) => setTransition(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="fade">Dissolve Fade</option>
              <option value="slide">Smooth Slide</option>
              <option value="zoom">Cinematic Zoom</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Music overlay toggle */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              <input
                type="checkbox"
                checked={musicEnabled}
                onChange={(e) => setMusicEnabled(e.target.checked)}
              />
              <span>Ambient Background Audio</span>
            </label>
          </div>

          <div style={{ height: '1px', background: 'var(--color-border)' }} />

          {/* Visibility settings */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-caption)', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
              Publishing Permissions
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xs)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="public">Public (Indexed)</option>
              <option value="unlisted">Unlisted (Direct link)</option>
              <option value="private">Private (Owner only)</option>
            </select>
          </div>
        </aside>

        {/* Right Side Real-time Preview Canvas */}
        <main style={{
          flex: 1,
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          ...getCanvasStyles()
        }}>
          {/* Mock Canvas Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            background: 'rgba(0,0,0,0.05)',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            fontSize: 'var(--font-size-caption)'
          }}>
            <span style={{ fontWeight: 'bold' }}>🖥️ Active Live Preview Canvas</span>
            <span>Theme: {theme.toUpperCase()} | Layout: {layout.toUpperCase()}</span>
          </div>

          {/* Preview Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-xl)' }}>
            {/* Header Title Info */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
              <h1 style={{ fontSize: '3rem', margin: '0 0 var(--spacing-xs) 0' }}>{project.name}</h1>
              <p style={{ opacity: 0.8, fontSize: 'var(--font-size-body-lg)', maxWidth: '600px', margin: '0 auto' }}>
                An AI-curated travel chronicle exploring timelines and locations.
              </p>
            </div>

            {/* Simulated Grid or Masonry Render layout */}
            {layout === 'carousel' ? (
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', overflowX: 'auto', paddingBottom: 'var(--spacing-md)' }}>
                {project.media.map((asset) => (
                  <div key={asset.id} style={{
                    width: '320px',
                    height: '240px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#000',
                    boxShadow: 'var(--shadow-md)',
                    border: theme === 'glass' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                  }}>
                    <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: layout === 'masonry' ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 'var(--spacing-lg)'
              }}>
                {project.media.map((asset) => (
                  <div
                    key={asset.id}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      background: theme === 'glass' ? 'rgba(255,255,255,0.05)' : '#fff',
                      border: theme === 'glass' ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--color-border)',
                      backdropFilter: theme === 'glass' ? 'blur(10px)' : 'none',
                      color: theme === 'editorial' ? '#1a1a1a' : 'inherit',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <div style={{ height: '200px', background: '#000' }}>
                      <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: 'var(--spacing-md)' }}>
                      <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', opacity: 0.8 }}>
                        {asset.metadata?.caption || 'Story snapshot'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Share / Success Modal (Section 6.13 & 6.14) */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="🎉 Story Published Successfully!"
        footer={
          <Button variant="primary" onClick={() => setShowShareModal(false)}>
            Done
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', textAlign: 'center' }}>
          <p>Your interactive AI-powered story is now live and shareable with the world!</p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            background: 'var(--color-bg-surface-hover)',
            border: '1px solid var(--color-border)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <input
              type="text"
              readOnly
              value={shareLink}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-caption)'
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                showToast('Link copied to clipboard!', 'success');
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

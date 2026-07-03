import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Loader } from '../components/Loader';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import type { Project, MediaAsset } from '../types/project';

export default function GalleryViewerPage() {
  const { shareId, projectId: paramProjectId } = useParams<{ shareId?: string; projectId?: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState<MediaAsset | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resolvedProjectId = paramProjectId || (shareId?.startsWith('share_') ? shareId.substring(6) : shareId);

  // Load project details
  useEffect(() => {
    async function loadProject() {
      if (!resolvedProjectId) return;
      setLoading(true);
      const res = await api.projects.getById(resolvedProjectId);
      if (res.success && res.data) {
        setProject(res.data);
      }
      setLoading(false);
    }
    loadProject();
  }, [resolvedProjectId]);

  // Set up background music
  useEffect(() => {
    if (project?.musicEnabled) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.25;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [project]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.log('Audio playback blocked by browser security:', e));
    }
    setIsPlayingMusic(!isPlayingMusic);
  };

  if (loading) return <Loader />;
  if (!project) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'var(--color-text-secondary)',
        gap: 'var(--spacing-md)'
      }}>
        <div style={{ fontSize: '3rem' }}>🔍</div>
        <h3>Gallery Not Found</h3>
        <p>The link might be incorrect or the owner has removed this gallery.</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Go to Home
        </Button>
      </div>
    );
  }

  // Get theme values
  const theme = project.theme || 'glass';
  const layout = project.layout || 'grid';
  const mediaItems = project.media || [];

  const getThemeStyles = () => {
    switch (theme) {
      case 'glass':
        return {
          background: 'radial-gradient(circle at top, #1e1b4b 0%, #090a0f 60%, #020205 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          minHeight: '100vh',
          padding: 'var(--spacing-xl) var(--spacing-md)',
          textAlign: 'center' as const
        };
      case 'editorial':
        return {
          background: '#0e0e0e',
          color: '#eaeaea',
          fontFamily: 'Georgia, serif',
          minHeight: '100vh',
          padding: 'var(--spacing-xl) var(--spacing-md)',
          textAlign: 'center' as const
        };
      case 'minimalist':
      default:
        return {
          background: '#050505',
          color: '#ffffff',
          fontFamily: 'monospace',
          minHeight: '100vh',
          padding: 'var(--spacing-xl) var(--spacing-md)',
          textAlign: 'center' as const
        };
    }
  };

  const getMediaCardStyles = () => {
    if (theme === 'glass') {
      return {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
      };
    }
    return {
      background: '#151515',
      border: '1px solid #222222',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform var(--transition-fast)'
    };
  };

  return (
    <div style={getThemeStyles()}>
      {/* Floating Music Controller */}
      {project.musicEnabled && (
        <button
          onClick={toggleMusic}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isPlayingMusic ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            fontSize: '1.25rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background var(--transition-fast), transform var(--transition-fast)'
          }}
          title={isPlayingMusic ? 'Mute Ambient Music' : 'Play Ambient Music'}
        >
          {isPlayingMusic ? '🔊' : '🔇'}
        </button>
      )}

      {/* Gallery Header */}
      <header style={{ maxWidth: '800px', margin: '0 auto var(--spacing-xl) auto', padding: '0 var(--spacing-sm)' }}>
        <h1 style={{
          fontSize: theme === 'editorial' ? '3rem' : '2.5rem',
          fontWeight: 'var(--weight-bold)',
          letterSpacing: '-0.02em',
          margin: '0 0 var(--spacing-xs) 0',
          textShadow: theme === 'glass' ? '0 0 20px rgba(124, 58, 237, 0.4)' : 'none'
        }}>
          {project.name}
        </h1>
        <p style={{
          fontSize: 'var(--font-size-body)',
          color: theme === 'glass' ? 'rgba(255,255,255,0.7)' : '#999999',
          margin: 0,
          lineHeight: '1.6'
        }}>
          Experience this immersive collection, generated with AI-enhanced timeline storyboards.
        </p>
      </header>

      {/* Empty State */}
      {mediaItems.length === 0 ? (
        <div style={{ padding: 'var(--spacing-xl)', color: 'rgba(255,255,255,0.5)' }}>
          <p>No media files have been uploaded to this story yet.</p>
        </div>
      ) : (
        /* Layout Rendering */
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--spacing-md)' }}>
          {layout === 'carousel' ? (
            /* Horizontal Carousel Layout */
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              overflowX: 'auto',
              padding: 'var(--spacing-sm) 0 var(--spacing-lg) 0',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}>
              {mediaItems.map((media) => (
                <div
                  key={media.id}
                  onClick={() => setActiveMedia(media)}
                  style={{
                    flex: '0 0 320px',
                    scrollSnapAlign: 'start',
                    ...getMediaCardStyles()
                  }}
                >
                  <img
                    src={media.url}
                    alt={media.name}
                    style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                  />
                  {media.metadata?.caption && (
                    <div style={{ padding: '12px', textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'var(--weight-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {media.metadata.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Grid & Masonry Grid Layout */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--spacing-md)'
            }}>
              {mediaItems.map((media) => (
                <div
                  key={media.id}
                  onClick={() => setActiveMedia(media)}
                  style={getMediaCardStyles()}
                >
                  <img
                    src={media.url}
                    alt={media.name}
                    style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '12px', textAlign: 'left' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 'var(--weight-medium)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {media.metadata?.caption || media.name}
                    </p>
                    {media.metadata?.tags && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {media.metadata.tags.slice(0, 3).map((t, idx) => (
                          <Badge key={idx} type="neutral">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Media Viewer Modal */}
      {activeMedia && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--spacing-md)'
        }}>
          {/* Close Area */}
          <div
            onClick={() => setActiveMedia(null)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'zoom-out' }}
          />

          <Card style={{
            width: '100%',
            maxWidth: '1000px',
            background: '#090a0f',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            maxHeight: '90vh',
            overflow: 'hidden',
            padding: 0,
            position: 'relative',
            zIndex: 10
          }}>
            {/* Media Canvas Column */}
            <div style={{
              flex: '1 1 500px',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <img
                src={activeMedia.url}
                alt={activeMedia.name}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block' }}
              />
              <button
                onClick={() => setActiveMedia(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* AI Metadata Sidebar Column */}
            <div style={{
              flex: '0 0 350px',
              padding: 'var(--spacing-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 'var(--spacing-md)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              background: '#0a0b10',
              color: '#ffffff',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {/* Title */}
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-body)', color: 'rgba(255,255,255,0.5)' }}>
                    Filename
                  </h4>
                  <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)', wordBreak: 'break-all' }}>
                    {activeMedia.name}
                  </p>
                </div>

                {/* AI Caption */}
                {activeMedia.metadata?.caption && (
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-body)', color: 'rgba(255,255,255,0.5)' }}>
                      AI Context Caption
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', fontStyle: 'italic' }}>
                      "{activeMedia.metadata.caption}"
                    </p>
                  </div>
                )}

                {/* Location */}
                {activeMedia.metadata?.location && (
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-body)', color: 'rgba(255,255,255,0.5)' }}>
                      Captured Location
                    </h4>
                    <Badge type="info">📍 {activeMedia.metadata.location}</Badge>
                  </div>
                )}

                {/* AI Tags */}
                {activeMedia.metadata?.tags && (
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-body)', color: 'rgba(255,255,255,0.5)' }}>
                      Computer Vision Tags
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {activeMedia.metadata.tags.map((tag, idx) => (
                        <Badge key={idx} type="neutral">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button: Download Image */}
              <a
                href={activeMedia.url}
                download={activeMedia.name}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none', width: '100%' }}
              >
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
                  📥 Download Image
                </Button>
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

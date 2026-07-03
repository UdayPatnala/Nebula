import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers';
import { useProjectsState } from '../hooks/useProjectsState';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects } = useProjectsState();

  // Compute stats
  const totalProjects = projects.length;
  const publishedGalleries = projects.filter((p) => p.status === 'published').length;
  const recentProjects = projects.slice(0, 3);

  // Storage calculation
  const storageLimit = user?.storageLimit || 10 * 1024 * 1024 * 1024; // Default 10GB
  const storageUsed = user?.storageUsed || 0;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string): 'neutral' | 'info' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'published': return 'success';
      case 'ready': return 'info';
      case 'processing': return 'warning';
      case 'uploading': return 'info';
      default: return 'neutral';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-xl)',
      textAlign: 'left'
    }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'var(--gradient-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Swirling glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'var(--weight-bold)',
          color: '#ffffff',
          margin: '0 0 var(--spacing-xxs) 0',
          letterSpacing: '-0.01em'
        }}>
          Welcome back, {user?.name || 'Storyteller'}!
        </h2>
        <p style={{
          fontSize: 'var(--font-size-body)',
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0,
          maxWidth: '550px',
          lineHeight: '1.5'
        }}>
          Ready to catalog your memories? Create a project, upload photos and videos, and let our AI pipeline transform them into a custom immersive gallery.
        </p>
      </div>

      {/* Grid: Stats & Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--spacing-md)'
      }}>
        {/* Stat Card 1 — Projects */}
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase' }}>
            Total Projects
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'var(--weight-bold)', margin: 'var(--spacing-xxs) 0' }}>
            {totalProjects}
          </div>
          <button 
            onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontSize: 'var(--font-size-caption)', fontWeight: 'var(--weight-semibold)' }}
          >
            View Projects ➔
          </button>
        </Card>

        {/* Stat Card 2 — Published */}
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase' }}>
            Published Galleries
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'var(--weight-bold)', margin: 'var(--spacing-xxs) 0' }}>
            {publishedGalleries}
          </div>
          <button 
            onClick={() => navigate('/galleries')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontSize: 'var(--font-size-caption)', fontWeight: 'var(--weight-semibold)' }}
          >
            View Galleries ➔
          </button>
        </Card>

        {/* Stat Card 3 — Credits */}
        <Card style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase' }}>
            Credit Balance
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'var(--weight-bold)', margin: 'var(--spacing-xxs) 0', color: 'var(--color-primary)' }}>
            {user?.credits ?? 0} 💎
          </div>
          <button 
            onClick={() => navigate('/credits')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontSize: 'var(--font-size-caption)', fontWeight: 'var(--weight-semibold)' }}
          >
            Manage Balance ➔
          </button>
        </Card>

        {/* Stat Card 4 — Storage */}
        <Card style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase' }}>
              Storage Used ({storagePercent}%)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'var(--weight-bold)' }}>{formatSize(storageUsed)}</span>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>/ {formatSize(storageLimit)}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-base)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', margin: 'var(--spacing-xs) 0' }}>
            <div style={{ width: `${storagePercent}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 'var(--radius-pill)', transition: 'width 0.3s ease' }} />
          </div>
          <button 
            onClick={() => navigate('/settings')}
            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontSize: 'var(--font-size-caption)', fontWeight: 'var(--weight-semibold)' }}
          >
            Upgrade Storage ➔
          </button>
        </Card>
      </div>

      {/* Grid: Actions & Recent */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--spacing-lg)'
      }}>
        {/* Recent Work / Projects */}
        <Card style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--weight-bold)', margin: 0 }}>
              Recent Projects
            </h3>
            {totalProjects > 3 && (
              <button 
                onClick={() => navigate('/projects')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 'var(--font-size-caption)', fontWeight: 'var(--weight-semibold)' }}
              >
                View All
              </button>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body)' }}>
              No projects created yet. Start one to see it here!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              {recentProjects.map((proj) => (
                <div 
                  key={proj.id}
                  onClick={() => {
                    if (proj.mediaCount > 0 || proj.status !== 'draft') {
                      navigate(`/projects/${proj.id}`);
                    } else {
                      navigate(`/projects/${proj.id}/upload`);
                    }
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--font-size-body)' }}>{proj.name}</div>
                    <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {proj.mediaCount} files · updated {new Date(proj.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge type={getStatusBadge(proj.status)}>{proj.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions Panel */}
        <Card style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-h3)', fontWeight: 'var(--weight-bold)', margin: 0 }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-sm)'
          }}>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/projects')}
              style={{ height: '70px', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' }}
            >
              <span style={{ fontSize: '1.25rem' }}>📁</span>
              <span style={{ fontSize: '0.8rem' }}>Manage Projects</span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/galleries')}
              style={{ height: '70px', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' }}
            >
              <span style={{ fontSize: '1.25rem' }}>🎨</span>
              <span style={{ fontSize: '0.8rem' }}>Browse Galleries</span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/credits')}
              style={{ height: '70px', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' }}
            >
              <span style={{ fontSize: '1.25rem' }}>💎</span>
              <span style={{ fontSize: '0.8rem' }}>Buy Credits</span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/settings')}
              style={{ height: '70px', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' }}
            >
              <span style={{ fontSize: '1.25rem' }}>⚙️</span>
              <span style={{ fontSize: '0.8rem' }}>Account Settings</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

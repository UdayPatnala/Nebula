import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../providers';
import { useProjectsState } from '../hooks/useProjectsState';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Loader } from '../components/Loader';
import Modal from '../components/Modal';
import Input from '../components/Input';
import type { Project } from '../types/project';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useNotification();
  const { projects: allProjects, isLoading, createProject, deleteProject } = useProjectsState();

  const isGalleriesView = location.pathname === '/galleries';
  const projects = isGalleriesView 
    ? allProjects.filter(p => p.status === 'published')
    : allProjects;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newProjectName.trim()) {
      showToast('Project name is required.', 'error');
      return;
    }
    setCreating(true);
    const result = await createProject(newProjectName.trim());
    setCreating(false);
    if (result) {
      showToast(`Project "${result.name}" created!`, 'success');
      setShowCreateModal(false);
      setNewProjectName('');
      navigate(`/projects/${result.id}/upload`);
    } else {
      showToast('Failed to create project. Please log in first.', 'error');
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await deleteProject(project.id);
    showToast(`Project "${project.name}" deleted.`, 'success');
  };

  const statusBadge = (status: Project['status']): 'neutral' | 'info' | 'warning' | 'success' | 'error' => {
    const map: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
      draft: 'neutral',
      uploading: 'info',
      processing: 'warning',
      ready: 'info',
      published: 'success',
      archived: 'neutral'
    };
    return map[status] ?? 'neutral';
  };

  if (isLoading) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
            {isGalleriesView ? 'My Galleries' : 'My Projects'}
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
            {isGalleriesView 
              ? 'Browse and manage your published interactive stories.' 
              : 'Manage your media collections and published galleries.'}
          </p>
        </div>
        {!isGalleriesView && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + New Project
          </Button>
        )}
      </header>

      {/* Empty state */}
      {projects.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>
            {isGalleriesView ? '🎨' : '🗂️'}
          </div>
          <h3 style={{ margin: '0 0 var(--spacing-xs) 0' }}>
            {isGalleriesView ? 'No published galleries yet' : 'No projects yet'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
            {isGalleriesView 
              ? 'Publish a project as a gallery to share it with your audience.' 
              : 'Create your first project to start uploading media and generating AI-powered galleries.'}
          </p>
          {!isGalleriesView ? (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create First Project
            </Button>
          ) : (
            <Button variant="primary" onClick={() => navigate('/projects')}>
              Go to Projects
            </Button>
          )}
        </Card>
      )}

      {/* Projects Grid */}
      {projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
          {projects.map((project) => (
            <Card
              key={project.id}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${project.id}/upload`)}
            >
              {/* Cover gradient placeholder */}
              <div style={{
                height: '140px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                marginBottom: 'var(--spacing-xs)'
              }}>
                🌌
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-h4)', fontWeight: 'var(--weight-semibold)' }}>
                  {project.name}
                </h3>
                <Badge type={statusBadge(project.status)}>{project.status}</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 'var(--spacing-xs)' }}>
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                  {project.mediaCount} file{project.mediaCount !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }} onClick={(e) => e.stopPropagation()}>
                  {project.status === 'ready' && (
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${project.id}/builder`)}>
                      Build Gallery
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(project)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setNewProjectName(''); }}
        title="Create New Project"
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={creating}>Create Project</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Input
            label="Project Name"
            type="text"
            placeholder="e.g. Tuscany Summer Trip 2024"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  );
}

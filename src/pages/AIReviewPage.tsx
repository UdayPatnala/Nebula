import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../providers';
import { api } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Loader } from '../components/Loader';
import type { Project, MediaAsset } from '../types/project';

// Mock Face Groups matching Section 16.4 face clustering
interface FaceCluster {
  id: string;
  name: string;
  count: number;
  thumbnailUrl: string;
}

const initialFaceClusters: FaceCluster[] = [
  { id: 'face_1', name: 'John Doe', count: 5, thumbnailUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  { id: 'face_2', name: 'Alice Smith', count: 3, thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { id: 'face_3', name: 'Unidentified Person A', count: 2, thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
];

export default function AIReviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'media' | 'people' | 'timeline'>('media');
  const [faceClusters, setFaceClusters] = useState<FaceCluster[]>(initialFaceClusters);
  
  // Modal states for media inspection
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [newTag, setNewTag] = useState('');
  
  // Person rename state
  const [renamingFaceId, setRenamingFaceId] = useState<string | null>(null);
  const [renamingFaceName, setRenamingFaceName] = useState('');

  // Load project details
  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      setLoading(true);
      const res = await api.projects.getById(projectId);
      if (res.success && res.data) {
        // If project has no media loaded (mocking fallback media assets for demo)
        const projData = res.data;
        if (projData.media.length === 0) {
          projData.media = [
            {
              id: 'asset_1',
              name: 'sunset_california.jpg',
              type: 'image',
              size: 2 * 1024 * 1024,
              url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
              uploadedAt: new Date().toISOString(),
              metadata: { tags: ['beach', 'sunset', 'california'], facesCount: 0, location: 'Los Angeles', caption: 'Sunset over Santa Monica beach' }
            },
            {
              id: 'asset_2',
              name: 'friends_gathering.jpg',
              type: 'image',
              size: 1.5 * 1024 * 1024,
              url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
              uploadedAt: new Date().toISOString(),
              metadata: { tags: ['people', 'party', 'dinner'], facesCount: 2, location: 'San Francisco', caption: 'Friends enjoying dinner' }
            },
            {
              id: 'asset_3',
              name: 'mountain_hike.mov',
              type: 'video',
              size: 15 * 1024 * 1024,
              url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
              uploadedAt: new Date().toISOString(),
              metadata: { tags: ['mountain', 'hike', 'climbing'], facesCount: 1, location: 'Yosemite', caption: 'Scenic valley overlook' }
            }
          ];
          projData.mediaCount = projData.media.length;
          await api.projects.update(projectId, projData);
        }
        setProject(projData);
      }
      setLoading(false);
    }
    loadProject();
  }, [projectId]);

  const handleAddTag = () => {
    if (!selectedAsset || !newTag.trim()) return;
    const currentTags = selectedAsset.metadata?.tags || [];
    if (currentTags.includes(newTag.trim())) return;

    const updatedAsset: MediaAsset = {
      ...selectedAsset,
      metadata: {
        ...selectedAsset.metadata,
        tags: [...currentTags, newTag.trim()]
      }
    };

    setSelectedAsset(updatedAsset);
    updateAssetInProject(updatedAsset);
    setNewTag('');
    showToast(`Added tag "${newTag.trim()}"`, 'success');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedAsset) return;
    const currentTags = selectedAsset.metadata?.tags || [];

    const updatedAsset: MediaAsset = {
      ...selectedAsset,
      metadata: {
        ...selectedAsset.metadata,
        tags: currentTags.filter((t) => t !== tagToRemove)
      }
    };

    setSelectedAsset(updatedAsset);
    updateAssetInProject(updatedAsset);
    showToast(`Removed tag "${tagToRemove}"`, 'info');
  };

  const updateAssetInProject = (updatedAsset: MediaAsset) => {
    if (!project || !projectId) return;
    const updatedMedia = project.media.map((a) => a.id === updatedAsset.id ? updatedAsset : a);
    const updatedProj = { ...project, media: updatedMedia };
    setProject(updatedProj);
    api.projects.update(projectId, updatedProj);
  };

  const handleRenameFace = (id: string, name: string) => {
    setRenamingFaceId(id);
    setRenamingFaceName(name);
  };

  const handleSaveFaceRename = () => {
    if (!renamingFaceId || !renamingFaceName.trim()) return;
    setFaceClusters(prev =>
      prev.map(f => f.id === renamingFaceId ? { ...f, name: renamingFaceName } : f)
    );
    setRenamingFaceId(null);
    showToast('Face cluster renamed globally', 'success');
  };

  if (loading) return <Loader />;
  if (!project) return <div>Project not found</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
            Review AI Inferences
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Inspect facial clustering and vision descriptors for <strong>{project.name}</strong>
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate(`/projects/${projectId}/gallery`)}>
          Customize Gallery Builder →
        </Button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-xs)' }}>
        {[
          { id: 'media', label: '🎥 Media & Tags' },
          { id: 'people', label: '👥 People & Faces' },
          { id: 'timeline', label: '📅 Story Timeline' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              border: 'none',
              background: activeTab === tab.id ? 'var(--color-bg-surface-hover)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-regular)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-label)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Media Grid */}
      {activeTab === 'media' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 'var(--spacing-md)'
        }}>
          {project.media.map((asset) => (
            <Card
              key={asset.id}
              hoverable
              onClick={() => setSelectedAsset(asset)}
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ height: '180px', width: '100%', overflow: 'hidden', background: '#000', position: 'relative' }}>
                <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {asset.type === 'video' && (
                  <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                    ▶ VIDEO
                  </span>
                )}
              </div>
              <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', flex: 1 }}>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--font-size-label)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {asset.name}
                </div>
                <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {asset.metadata?.caption || 'No caption generated.'}
                </p>
                {/* Tag snippets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'auto' }}>
                  {asset.metadata?.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} style={{ background: 'var(--color-bg-surface-hover)', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}>
                      #{tag}
                    </span>
                  ))}
                  {(asset.metadata?.tags?.length || 0) > 3 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                      +{(asset.metadata?.tags?.length || 0) - 3} more
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: People Profiles */}
      {activeTab === 'people' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {faceClusters.map((cluster) => (
            <Card key={cluster.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <img
                src={cluster.thumbnailUrl}
                alt={cluster.name}
                style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                {renamingFaceId === cluster.id ? (
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
                    <Input
                      value={renamingFaceName}
                      onChange={(e) => setRenamingFaceName(e.target.value)}
                      style={{ marginBottom: 0, height: '32px' }}
                    />
                    <Button variant="primary" size="sm" onClick={handleSaveFaceRename}>Save</Button>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ margin: '0 0 var(--spacing-xxs) 0' }}>{cluster.name}</h4>
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                      Appears in {cluster.count} photo(s)
                    </span>
                    <button
                      onClick={() => handleRenameFace(cluster.id, cluster.name)}
                      style={{
                        display: 'block',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontSize: 'var(--font-size-caption)',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: '4px'
                      }}
                    >
                      ✏️ Edit Identity
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: Chronological Timeline Clustered Events */}
      {activeTab === 'timeline' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <h3 style={{ margin: 0 }}>Story Event Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '2px solid var(--color-primary)', paddingLeft: 'var(--spacing-lg)', gap: 'var(--spacing-lg)', marginLeft: 'var(--spacing-xs)' }}>
            {[
              { time: '10:14 AM', title: 'Arrival at Santa Monica', desc: 'Ingested beach scenery and sunset markers.', location: 'Los Angeles, CA' },
              { time: '01:30 PM', title: 'Lunch Gathering', desc: 'Identified dining layout and 4 unique faces.', location: 'Pier View Diner' },
              { time: '05:45 PM', title: 'Sunset Views', desc: 'Analyzed high-quality colors and sunset sky filters.', location: 'Ocean Overlook' }
            ].map((event) => (
              <div key={event.title} style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '-29px',
                  top: '4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-bg-base)',
                  border: '3px solid var(--color-primary)'
                }} />
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                  {event.time} — {event.location}
                </span>
                <h4 style={{ margin: 'var(--spacing-xxs) 0' }}>{event.title}</h4>
                <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                  {event.desc}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Asset Metadata inspection dialog modal (Section 6.9) */}
      <Modal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title="Asset AI Descriptors"
        footer={<Button variant="secondary" onClick={() => setSelectedAsset(null)}>Close</Button>}
      >
        {selectedAsset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <img
              src={selectedAsset.url}
              alt={selectedAsset.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
            />
            
            {/* Descriptive caption */}
            <div>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                AI Semantic Summary
              </span>
              <p style={{ margin: 'var(--spacing-xxs) 0 0 0', fontWeight: 'var(--weight-medium)' }}>
                {selectedAsset.metadata?.caption || 'No caption generated.'}
              </p>
            </div>

            {/* Inferred Tags */}
            <div>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Recognized Tags
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
                {selectedAsset.metadata?.tags?.map((tag) => (
                  <Badge key={tag} type="neutral">
                    #{tag}{' '}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                      style={{ marginLeft: '4px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-error)' }}
                    >
                      ×
                    </span>
                  </Badge>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
                <Input
                  placeholder="Add customized tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  style={{ marginBottom: 0, height: '32px' }}
                />
                <Button variant="secondary" size="sm" onClick={handleAddTag}>Add</Button>
              </div>
            </div>

            {/* GPS coordinates & EXIF info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--spacing-sm)',
              fontSize: 'var(--font-size-caption)',
              background: 'var(--color-bg-surface-hover)',
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}>
              <div>
                <strong>Location:</strong> {selectedAsset.metadata?.location || 'Unknown'}
              </div>
              <div>
                <strong>GPS:</strong> 34.0194° N, 118.4912° W
              </div>
              <div>
                <strong>Camera:</strong> Apple iPhone 15 Pro
              </div>
              <div>
                <strong>Date Ingested:</strong> {new Date(selectedAsset.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

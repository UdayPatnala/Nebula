import { useState } from 'react';
import { useAuth, useNotification } from '../providers';
import { mockDb } from '../services/mockDb';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

interface ConsentItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  granted: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications' | 'danger'>('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Notification preferences (Section 21 — account data)
  const [notifyGalleryPublished, setNotifyGalleryPublished] = useState(true);
  const [notifyAIComplete, setNotifyAIComplete] = useState(true);
  const [notifyLowCredits, setNotifyLowCredits] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);

  // Consent state (Section 21.5)
  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      id: 'analytics',
      label: 'Usage Analytics',
      description: 'Allow Nebula to collect anonymized usage data to improve platform quality and performance.',
      required: false,
      granted: true
    },
    {
      id: 'ai_improvement',
      label: 'AI Model Improvement',
      description: 'Allow anonymized AI inference results to improve Nebula\'s AI detection models.',
      required: false,
      granted: false
    },
    {
      id: 'essential',
      label: 'Essential Operations',
      description: 'Required for authentication, file storage, and core platform functionality. Cannot be disabled.',
      required: true,
      granted: true
    }
  ]);

  const [exportRequested, setExportRequested] = useState(false);

  // Toggle consent (Section 21.5)
  const toggleConsent = (id: string) => {
    setConsents((prev) =>
      prev.map((c) => (c.id === id && !c.required ? { ...c, granted: !c.granted } : c))
    );
    mockDb.logAction(user?.name ?? 'User', 'Consent Change', `Toggled consent: ${id}`);
    showToast('Consent preferences updated.', 'success');
  };

  // Save profile (Section 21 — identity data)
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    await new Promise((r) => setTimeout(r, 600));
    mockDb.logAction(user?.name ?? 'User', 'Profile Update', `Display name changed to: ${displayName}`);
    showToast('Profile saved successfully!', 'success');
    setSavingProfile(false);
  };

  // Data export request (Section 21 — right to data portability)
  const handleRequestExport = () => {
    setExportRequested(true);
    mockDb.logAction(user?.name ?? 'User', 'Data Export Request', 'User requested full data export archive.');
    showToast('Data export request received. Your archive will be emailed within 48 hours.', 'info');
  };

  // Account deletion (Section 21 — right to erasure)
  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm account removal.', 'error');
      return;
    }
    mockDb.logAction(user?.name ?? 'User', 'Account Deletion', 'User permanently deleted their account and all data.');
    showToast('Account deletion initiated. All data will be erased within 30 days.', 'info');
    setShowDeleteModal(false);
    setTimeout(() => logout(), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left' }}>
      {/* Header */}
      <header>
        <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
          Account Settings
        </h2>
        <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Manage your profile, privacy controls, notification preferences, and data governance.
        </p>
      </header>

      {/* Tab Controls */}
      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-xs)' }}>
        {[
          { id: 'profile', label: '👤 Profile' },
          { id: 'privacy', label: '🔒 Privacy & Consent' },
          { id: 'notifications', label: '🔔 Notifications' },
          { id: 'danger', label: '⚠️ Data & Account' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxWidth: '540px' }}>
          <h3 style={{ margin: 0 }}>Identity Information</h3>
          <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Your name and email are used to identify your account. Data minimization principles apply (Section 21.4).
          </p>
          <Input
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            value={user?.email ?? ''}
            disabled
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Badge type="neutral">{user?.role?.replace('_', ' ')}</Badge>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>Current subscription tier</span>
          </div>
          <Button variant="primary" onClick={handleSaveProfile} loading={savingProfile}>
            Save Profile
          </Button>
        </Card>
      )}

      {/* Tab: Privacy & Consent (Section 21.5) */}
      {activeTab === 'privacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxWidth: '640px' }}>
          <Card>
            <h3 style={{ margin: '0 0 var(--spacing-sm) 0' }}>Consent Management</h3>
            <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              You may grant or withdraw consent for optional data processing activities at any time. All changes are recorded in your audit history (Section 21.5).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {consents.map((consent) => (
                <div
                  key={consent.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xxs)' }}>
                      <strong style={{ fontSize: 'var(--font-size-body)' }}>{consent.label}</strong>
                      {consent.required && <Badge type="warning">Required</Badge>}
                    </div>
                    <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {consent.description}
                    </p>
                  </div>
                  <div>
                    {/* Toggle switch */}
                    <button
                      onClick={() => toggleConsent(consent.id)}
                      disabled={consent.required}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: consent.granted ? 'var(--color-success)' : 'var(--color-border)',
                        cursor: consent.required ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        transition: 'background var(--transition-fast)',
                        opacity: consent.required ? 0.6 : 1
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        left: consent.granted ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        background: '#fff',
                        borderRadius: '50%',
                        transition: 'left var(--transition-fast)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                      }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === 'notifications' && (
        <Card style={{ maxWidth: '540px' }}>
          <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>Notification Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {[
              { label: 'Gallery published successfully', value: notifyGalleryPublished, setter: setNotifyGalleryPublished },
              { label: 'AI analysis pipeline completed', value: notifyAIComplete, setter: setNotifyAIComplete },
              { label: 'Low credit balance alerts', value: notifyLowCredits, setter: setNotifyLowCredits },
              { label: 'Marketing & promotional updates', value: notifyMarketing, setter: setNotifyMarketing }
            ].map((pref) => (
              <label
                key={pref.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: 'var(--spacing-sm)',
                  background: 'var(--color-bg-surface-hover)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <span style={{ fontSize: 'var(--font-size-body)' }}>{pref.label}</span>
                <input
                  type="checkbox"
                  checked={pref.value}
                  onChange={(e) => pref.setter(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
              </label>
            ))}
          </div>
          <Button
            variant="primary"
            style={{ marginTop: 'var(--spacing-md)' }}
            onClick={() => showToast('Notification preferences saved.', 'success')}
          >
            Save Preferences
          </Button>
        </Card>
      )}

      {/* Tab: Data & Account Danger Zone (Section 21 — right to portability and erasure) */}
      {activeTab === 'danger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxWidth: '580px' }}>
          {/* Data export */}
          <Card style={{ borderColor: 'var(--color-warning)', border: '1px solid' }}>
            <h3 style={{ margin: '0 0 var(--spacing-xs) 0' }}>📦 Export Your Data</h3>
            <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-md) 0' }}>
              Request a complete archive of all your data including projects, media, AI analysis, credits history, and audit logs. Right to data portability (Section 21).
            </p>
            <Button
              variant="secondary"
              onClick={handleRequestExport}
              disabled={exportRequested}
            >
              {exportRequested ? '✅ Export Requested' : 'Request Data Export'}
            </Button>
          </Card>

          {/* Account deletion */}
          <Card style={{ borderColor: 'var(--color-error)', border: '1px solid' }}>
            <h3 style={{ margin: '0 0 var(--spacing-xs) 0', color: 'var(--color-error)' }}>🗑️ Delete Account Permanently</h3>
            <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--spacing-md) 0' }}>
              Permanently erase your account, all uploaded media, galleries, AI data, and credits. This action cannot be undone. Right to erasure (Section 21).
            </p>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
              Delete My Account
            </Button>
          </Card>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
        title="⚠️ Permanently Delete Account"
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Permanently Delete
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <p style={{ color: 'var(--color-error)', fontWeight: 'var(--weight-semibold)' }}>
            This action is irreversible. All your data will be scheduled for permanent erasure within 30 days.
          </p>
          <ul style={{ margin: 0, paddingLeft: 'var(--spacing-md)', fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)' }}>
            <li>All uploaded media files and galleries</li>
            <li>All AI analysis results and face clusters</li>
            <li>All remaining credit balances</li>
            <li>All project configurations</li>
            <li>Your profile and account access</li>
          </ul>
          <Input
            label='Type "DELETE" to confirm'
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            required
          />
        </div>
      </Modal>
    </div>
  );
}

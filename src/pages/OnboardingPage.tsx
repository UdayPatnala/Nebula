import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotification } from '../providers';
import Card from '../components/Card';
import Button from '../components/Button';
import type { UserRole } from '../types/auth';
import { getStorageLimitForRole } from '../config/roles';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateUserFields } = useAuth();
  const { showToast } = useNotification();
  
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'registered_user');
  const [updating, setUpdating] = useState(false);

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleNext = async () => {
    if (step === 2) {
      // Persist chosen role inside Firestore / LocalStorage
      setUpdating(true);
      try {
        await updateUserFields({
          role: selectedRole,
          storageLimit: getStorageLimitForRole(selectedRole)
        });
        showToast(`Account role updated to ${selectedRole.replace('_', ' ')}!`, 'success');
      } catch (err) {
        showToast('Failed to update account role.', 'error');
      } finally {
        setUpdating(false);
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = () => {
    navigate('/projects');
  };

  return (
    <div style={{
      maxWidth: '650px',
      margin: '40px auto',
      padding: '0 var(--spacing-md)',
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-lg)'
    }}>
      {/* Progress indicators */}
      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'center', marginBottom: 'var(--spacing-sm)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '4px',
              flex: 1,
              borderRadius: 'var(--radius-pill)',
              background: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
              transition: 'background var(--transition-normal)'
            }}
          />
        ))}
      </div>

      {step === 1 && (
        /* Step 1: Welcome */
        <Card style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '3rem', textAlign: 'center' }}>🌌</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--weight-bold)', textAlign: 'center', margin: 0 }}>
            Welcome to Nebula
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
            Nebula is an AI-driven, premium storytelling platform built to help you catalog, enrich, and showcase your photographic and video memories.
          </p>
          <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--font-size-body)' }}>Projects vs Galleries</h4>
            <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              • **Projects** are your private collaborative workspaces where you upload files, organize files, and run AI timeline tags extraction.
              <br />
              • **Galleries** are the finished, beautiful public interactive slideshows shared with your clients, recruiters, or audience.
            </p>
          </div>
          <Button variant="primary" onClick={handleNext} style={{ marginTop: 'var(--spacing-sm)' }}>
            Get Started ➔
          </Button>
        </Card>
      )}

      {step === 2 && (
        /* Step 2: Role configuration */
        <Card style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--weight-bold)', margin: '0 0 4px 0' }}>
              Choose Your Persona
            </h2>
            <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Tailor the storage limits and processing parameters for your account.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {/* Registered User Card */}
            <div
              onClick={() => handleRoleSelect('registered_user')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: selectedRole === 'registered_user' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selectedRole === 'registered_user' ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-surface)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                <span>Standard Creator</span>
                {selectedRole === 'registered_user' && <span style={{ color: 'var(--color-primary)' }}>✓ Selected</span>}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                10 GB storage limits, 50 MB max file uploads. Ideal for personal travellogs and catalogs.
              </p>
            </div>

            {/* Premium User Card */}
            <div
              onClick={() => handleRoleSelect('premium_user')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: selectedRole === 'premium_user' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selectedRole === 'premium_user' ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-surface)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                <span>Premium Producer</span>
                {selectedRole === 'premium_user' && <span style={{ color: 'var(--color-primary)' }}>✓ Selected</span>}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                100 GB storage limits, 500 MB max file uploads. Perfect for high-res photo galleries and video journals.
              </p>
            </div>

            {/* Admin Card */}
            <div
              onClick={() => handleRoleSelect('administrator')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: selectedRole === 'administrator' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selectedRole === 'administrator' ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-surface)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                <span>Platform Administrator</span>
                {selectedRole === 'administrator' && <span style={{ color: 'var(--color-primary)' }}>✓ Selected</span>}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                500 GB storage limits, 2 GB max file uploads. Complete system access, audit logs, and diagnostic monitors.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} loading={updating} style={{ flex: 1 }}>
              Save & Next ➔
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        /* Step 3: Ingestion & AI Analysis */
        <Card style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--weight-bold)', margin: '0 0 4px 0' }}>
              The AI Storyline Pipeline
            </h2>
            <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: 0 }}>
              How Nebula processes and formats your files into digital art.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <div style={{ fontSize: '2rem' }}>📤</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>1. Upload Your Media</h4>
                <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Drag and drop photo/video logs inside your project. Images are optimized client-side to fit memory profiles without loss.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <div style={{ fontSize: '2rem' }}>🧠</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>2. Trigger AI Analysis</h4>
                <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Nebula parses your images to automatically cluster people, suggest captions, extract evolutionary tags, and tag capture locations.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <div style={{ fontSize: '2rem' }}>✍️</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>3. Review & Edit Overrides</h4>
                <p style={{ margin: 0, fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Not happy with AI choices? Enter custom captions, locations, camera metadata, tag arrays, or person tags in the Review dashboard.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} style={{ flex: 1 }}>
              Next ➔
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        /* Step 4: Finish */
        <Card style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem' }}>🚀</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--weight-bold)', margin: 0 }}>
            You're Ready to Roll!
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: '0 auto', maxWidth: '480px' }}>
            Your account is set up, configured, and initialized. You can now create projects, organize media, and share stunning interactive galleries.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-lg)', textAlign: 'left' }}>
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
            <Button variant="primary" onClick={handleFinish} style={{ flex: 1, justifyContent: 'center' }}>
              Launch Workspace ➔
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

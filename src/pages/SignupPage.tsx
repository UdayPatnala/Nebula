import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useNotification } from '../providers';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function SignupPage() {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!email) {
      setError('Email address is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setError('You must accept the terms and conditions');
      return;
    }

    setIsLoading(true);
    try {
      // Auto-authenticate user
      await login(email, password, true, name);
      showToast('Registration successful! Welcome to Nebula!', 'success');
      navigate('/onboarding'); // Redirect to first-time onboarding tutorial (Section 6.5)
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
      showToast('Account creation failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-base)',
      fontFamily: 'var(--font-sans)',
      padding: 'var(--spacing-md)'
    }}>
      <Card style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{
            fontSize: 'var(--font-size-h2)',
            fontWeight: 'var(--weight-bold)',
            background: 'var(--gradient-glow)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 var(--spacing-xxs) 0'
          }}>
            Create Account
          </h1>
          <p style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            Sign up to start building your interactive stories
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--color-error-bg)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-md)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-caption)'
          }}>
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Alex Mercer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. alex@nebula.ai"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '36px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                height: '24px',
                width: '24px',
                zIndex: 10
              }}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '36px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                height: '24px',
                width: '24px',
                zIndex: 10
              }}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>

          {/* Agree Terms Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-xs)',
            marginBottom: 'var(--spacing-lg)',
            fontSize: 'var(--font-size-caption)',
            textAlign: 'left'
          }}>
            <input
              id="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <label htmlFor="agreeTerms" style={{ color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              I agree to the{' '}
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Terms and Conditions agreement details', 'info');
                }}
                style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'var(--weight-medium)' }}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Data Privacy and Cookies Policy details', 'info');
                }}
                style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'var(--weight-medium)' }}
              >
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            style={{ width: '100%', height: '44px' }}
          >
            Register Account
          </Button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: 'var(--spacing-lg)',
          textAlign: 'center',
          fontSize: 'var(--font-size-caption)',
          color: 'var(--color-text-secondary)'
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 'var(--weight-semibold)'
            }}
          >
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}

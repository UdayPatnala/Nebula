import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useNotification } from '../providers';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!email) {
      setError('Email address is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Determine role from domain to allow testing Administrator profiles easily:
      // e.g. admin@nebula.ai log in as Administrator role, else regular user.
      const isDomainAdmin = email.toLowerCase().startsWith('admin');
      const role = isDomainAdmin ? 'administrator' : 'registered_user';
      
      await login(email, password, false, undefined, role);
      showToast('Welcome back to Nebula!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check credentials.');
      showToast('Login failed. Please verify credentials.', 'error');
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
            Nebula
          </h1>
          <p style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            Log in to continue creating AI stories
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. name@nebula.ai"
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
              autoComplete="current-password"
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

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-lg)',
            fontSize: 'var(--font-size-caption)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                showToast('Password reset link sent to registered email', 'success');
              }}
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 'var(--weight-medium)'
              }}
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            style={{ width: '100%', height: '44px' }}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: 'var(--spacing-lg)',
          textAlign: 'center',
          fontSize: 'var(--font-size-caption)',
          color: 'var(--color-text-secondary)'
        }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 'var(--weight-semibold)'
            }}
          >
            Create Account
          </Link>
        </div>
      </Card>
    </div>
  );
}

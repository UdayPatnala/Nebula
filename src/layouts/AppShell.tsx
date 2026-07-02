import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth, useTheme, useNotification } from '../providers';
import { hasPermission } from '../config/roles';

export default function AppShell() {
  const { user, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const { showToast } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) return <Outlet />; // Render public landing pages or guest views directly without shell

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    showToast(`Switched to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`, 'success');
  };

  // Generate dynamic breadcrumbs based on the URL path
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbs = [
    { label: 'Home', path: '/dashboard' },
    ...pathnames.map((value, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const cleanLabel = value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
      return { label: cleanLabel, path };
    }),
  ];

  // Navigation Items by Permission check
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '⚡', permission: 'view_landing_page' },
    { label: 'Projects', path: '/projects', icon: '📁', permission: 'create_projects' },
    { label: 'Galleries', path: '/galleries', icon: '🎨', permission: 'publish_galleries' },
    { label: 'Credits', path: '/credits', icon: '💎', permission: 'view_credit_balance' },
    { label: 'Settings', path: '/settings', icon: '⚙️', permission: 'update_profile' },
    { label: 'Help Center', path: '/help', icon: '❓', permission: 'view_landing_page' }
  ] as const;

  // Admin Items (only displayed if user has permission)
  const adminItems = [
    { label: 'User Admin', path: '/admin/users', icon: '👥', permission: 'view_all_users' },
    { label: 'System Health', path: '/admin/system', icon: '❤️', permission: 'view_system_health' }
  ] as const;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--color-bg-base)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-text-primary)'
    }}>
      {/* Top Navigation */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        padding: '0 var(--spacing-md)',
        background: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 'var(--z-index-header)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--color-text-primary)'
            }}
          >
            ☰
          </button>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span style={{ 
              fontWeight: 'var(--weight-bold)', 
              fontSize: '1.5rem', 
              background: 'var(--gradient-glow)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              Nebula
            </span>
          </Link>
        </div>

        {/* Global Nav Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {/* Credit Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            background: 'var(--color-bg-surface-hover)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-label)'
          }}>
            <span>💎</span>
            <span style={{ fontWeight: 'var(--weight-semibold)' }}>{user.credits} Credits</span>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              padding: 'var(--spacing-xs)'
            }}
            title="Switch theme"
          >
            {resolvedTheme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* User Profile Dropdown Placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 'var(--font-size-label)',
              fontWeight: 'var(--weight-bold)'
            }}>
              {user.name.charAt(0)}
            </div>
            <button 
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-error)',
                fontSize: 'var(--font-size-label)',
                fontWeight: 'var(--weight-medium)'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Responsive Collapsible Sidebar */}
        <aside style={{
          width: sidebarOpen ? '240px' : '0px',
          background: 'var(--color-bg-surface)',
          borderRight: sidebarOpen ? '1px solid var(--color-border)' : 'none',
          transition: 'width var(--transition-normal)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 'var(--z-index-sidebar)'
        }}>
          <nav style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xxs)', flex: 1 }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: isActive ? 'var(--color-bg-surface-hover)' : 'transparent',
                  fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                  transition: 'background var(--transition-fast)'
                })}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* Admin Section (authorized check) */}
            {(hasPermission(user.role, 'view_all_users') || hasPermission(user.role, 'view_system_health')) && (
              <>
                <div style={{
                  height: '1px',
                  background: 'var(--color-border)',
                  margin: 'var(--spacing-md) 0'
                }} />
                <div style={{ 
                  paddingLeft: 'var(--spacing-sm)', 
                  fontSize: 'var(--font-size-caption)', 
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Admin Control
                </div>
                {adminItems.map((item) => {
                  if (hasPermission(user.role, item.permission)) {
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)',
                          padding: 'var(--spacing-sm)',
                          borderRadius: 'var(--radius-sm)',
                          textDecoration: 'none',
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          background: isActive ? 'var(--color-bg-surface-hover)' : 'transparent',
                          fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-regular)'
                        })}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  }
                  return null;
                })}
              </>
            )}
          </nav>
        </aside>

        {/* Page Content Panel */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          backgroundColor: 'var(--color-bg-base)',
          padding: 'var(--spacing-lg)'
        }}>
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)'
          }}>
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                {idx > 0 && <span>&gt;</span>}
                <Link 
                  to={crumb.path} 
                  style={{ 
                    color: idx === breadcrumbs.length - 1 ? 'var(--color-text-secondary)' : 'inherit',
                    textDecoration: 'none'
                  }}
                >
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>

          {/* Nested Route Output */}
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

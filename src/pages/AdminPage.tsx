import { useState, useEffect } from 'react';
import { useNotification, useAuth } from '../providers';
import { api } from '../api/client';
import { mockDb, type AuditLog } from '../services/mockDb';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { Loader } from '../components/Loader';
import type { UserRole } from '../types/auth';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  credits: number;
  storageUsed: number;
}

const mockUsers: AdminUser[] = [
  { id: 'usr_1', name: 'Alex Mercer', email: 'alex@nebula.ai', role: 'registered_user', credits: 150, storageUsed: 1.2 * 1024 * 1024 * 1024 },
  { id: 'usr_2', name: 'Sarah Connor', email: 'sarah@sky.net', role: 'premium_user', credits: 450, storageUsed: 12.8 * 1024 * 1024 * 1024 },
  { id: 'usr_3', name: 'John Doe', email: 'john@doe.com', role: 'registered_user', credits: 10, storageUsed: 0.1 * 1024 * 1024 * 1024 }
];

export default function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'logs' | 'server'>('users');
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Credit adjustment modal/form state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [creditAdjustment, setCreditAdjustment] = useState('');

  // Fetch security audit logs on mount
  useEffect(() => {
    async function loadLogs() {
      setLoadingLogs(true);
      try {
        const res = await api.admin.getLogs();
        if (res.success) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLogs(false);
      }
    }
    loadLogs();
  }, [activeTab]);

  const handleAdjustCredits = () => {
    if (!selectedUser || !creditAdjustment) return;
    const amount = parseInt(creditAdjustment, 10);
    if (isNaN(amount)) {
      showToast('Please enter a valid credit number', 'error');
      return;
    }

    // Apply adjustments
    const updatedUsers = users.map((u) => {
      if (u.id === selectedUser.id) {
        const nextCredits = Math.max(0, u.credits + amount);
        return { ...u, credits: nextCredits };
      }
      return u;
    });

    setUsers(updatedUsers);
    
    // Audit Log creation (Section 14.2 & Section 20)
    mockDb.logAction(
      user?.name || 'Administrator',
      'Credit Adjustment',
      `Manually adjusted credits for ${selectedUser.email} by ${amount > 0 ? `+${amount}` : amount}`
    );

    showToast(`Credits adjusted successfully for ${selectedUser.name}!`, 'success');
    setSelectedUser(null);
    setCreditAdjustment('');
  };

  if (!user || (user.role !== 'administrator' && user.role !== 'super_administrator')) {
    return (
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h3>Access Denied</h3>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left' }}>
      {/* Header */}
      <header>
        <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
          Administrator Workspace
        </h2>
        <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Manage user entitlements, moderate public gallery content, and audit system events.
        </p>
      </header>

      {/* Admin Tab Controls */}
      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-xs)' }}>
        {[
          { id: 'users', label: '👥 User Management' },
          { id: 'moderation', label: '🛡️ Moderation Queue' },
          { id: 'logs', label: '📜 Security Audit Logs' },
          { id: 'server', label: '📊 Server Status' }
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

      {/* Tab: User list & adjustments */}
      {activeTab === 'users' && (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-body)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface-hover)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--spacing-md)' }}>Name</th>
                <th style={{ padding: 'var(--spacing-md)' }}>Email</th>
                <th style={{ padding: 'var(--spacing-md)' }}>Role</th>
                <th style={{ padding: 'var(--spacing-md)' }}>Credits Balance</th>
                <th style={{ padding: 'var(--spacing-md)' }}>Storage Used</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--spacing-md)', fontWeight: 'bold' }}>{u.name}</td>
                  <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    <Badge type={u.role === 'premium_user' ? 'success' : 'neutral'}>
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', fontWeight: 'bold' }}>💎 {u.credits}</td>
                  <td style={{ padding: 'var(--spacing-md)' }}>{(u.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB</td>
                  <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedUser(u)}>
                      Adjust Credits
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab: Moderation */}
      {activeTab === 'moderation' && (
        <Card style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <h3>Moderation Queue (0 items)</h3>
          <p>No published galleries have been flagged for content violations.</p>
        </Card>
      )}

      {/* Tab: Security Audit Logs (Section 20) */}
      {activeTab === 'logs' && (
        <Card style={{ padding: 0 }}>
          {loadingLogs ? (
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
              <Loader size="sm" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-caption)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface-hover)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--spacing-md)' }}>Timestamp</th>
                    <th style={{ padding: 'var(--spacing-md)' }}>Actor</th>
                    <th style={{ padding: 'var(--spacing-md)' }}>Action Category</th>
                    <th style={{ padding: 'var(--spacing-md)' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)' }}>
                      <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-primary)' }}>{log.actor}</td>
                      <td style={{ padding: 'var(--spacing-md)' }}>
                        <Badge type="info">{log.action}</Badge>
                      </td>
                      <td style={{ padding: 'var(--spacing-md)' }}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Server Stats */}
      {activeTab === 'server' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {[
            { label: 'AI Inference CPU', value: '42%', desc: '6x Nvidia Tesla T4 online' },
            { label: 'Ingestion Queue Latency', value: '180ms', desc: 'Active edge nodes: 12' },
            { label: 'API Gateway Bandwidth', value: '4.8 Gbps', desc: 'Cloudflare cache hit rate: 94%' }
          ].map((stat) => (
            <Card key={stat.label}>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                {stat.label}
              </span>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 'var(--spacing-xs) 0', color: 'var(--color-primary)' }}>
                {stat.value}
              </div>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                {stat.desc}
              </span>
            </Card>
          ))}
        </div>
      )}

      {/* Credits Adjustment Dialog */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedUser(null)}>
          <Card style={{
            width: '100%',
            maxWidth: '400px',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 var(--spacing-sm) 0' }}>Adjust Entitlements</h3>
            <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
              Manually add or deduct credits for <strong>{selectedUser.name}</strong>. Use negative values for deductions.
            </p>
            <Input
              label="Credits adjustment amount"
              type="number"
              placeholder="e.g. 50 or -20"
              value={creditAdjustment}
              onChange={(e) => setCreditAdjustment(e.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleAdjustCredits}>Apply Adjustment</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

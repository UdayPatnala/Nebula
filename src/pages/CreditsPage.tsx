import { useState, useEffect } from 'react';
import { useAuth, useNotification } from '../providers';
import { api } from '../api/client';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { Loader } from '../components/Loader';
import type { CreditTransaction } from '../services/mockDb';

export default function CreditsPage() {
  const { user, dailyCheckIn } = useAuth();
  const { showToast } = useNotification();
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Fetch transaction history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await api.credits.getHistory();
        if (response.success) {
          setHistory(response.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [user?.credits]);

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 600));
      const res = dailyCheckIn();
      if (res) {
        showToast('Daily login checked in! +10 Credits added.', 'success');
      } else {
        showToast('Already checked in today. Please return tomorrow!', 'warning');
      }
    } catch (err) {
      showToast('Check-in failed.', 'error');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handlePurchaseMock = async (pkgName: string, _amount: number) => {
    showToast(`Initiating checkout checkout for ${pkgName}...`, 'info');
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Simulate transaction commit
    await api.credits.checkIn(); // Grant credits mock
    showToast(`Mock Purchase complete! Credits added.`, 'success');
  };

  if (!user) return <Loader />;

  // Calculate storage usage details
  const storageUsedGB = (user.storageUsed / (1024 * 1024 * 1024)).toFixed(2);
  const storageLimitGB = (user.storageLimit / (1024 * 1024 * 1024)).toFixed(0);
  const storagePercent = Math.min(100, Math.round((user.storageUsed / user.storageLimit) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left' }}>
      {/* Page Header */}
      <header>
        <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
          Credits & Quotas
        </h2>
        <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Manage your balance, claim daily rewards, and track account limits.
        </p>
      </header>

      {/* Overview Dashboard Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--spacing-md)'
      }}>
        {/* Credits Status */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Available Balance
            </span>
            <div style={{ fontSize: '2.5rem', fontWeight: 'var(--weight-bold)', margin: 'var(--spacing-xs) 0', color: 'var(--color-primary)' }}>
              💎 {user.credits} <span style={{ fontSize: 'var(--font-size-body)', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>Credits</span>
            </div>
          </div>
          <Button
            onClick={handleCheckIn}
            loading={checkInLoading}
            variant="primary"
            style={{ width: 'fit-content' }}
          >
            Claim Daily Check-In (+10)
          </Button>
        </Card>

        {/* Storage Limits */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
          <div>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Storage Allocated ({user.role.replace('_', ' ')})
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 'var(--weight-bold)', margin: 'var(--spacing-xs) 0' }}>
              📁 {storageUsedGB} GB / {storageLimitGB} GB
            </div>
            {/* Progress bar */}
            <div style={{
              height: '8px',
              background: 'var(--color-border)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              margin: 'var(--spacing-xs) 0'
            }}>
              <div style={{
                height: '100%',
                width: `${storagePercent}%`,
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-full)'
              }} />
            </div>
          </div>
          <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
            Using {storagePercent}% of your allowed workspace quota.
          </span>
        </Card>
      </div>

      {/* Purchase Tier Options */}
      <section>
        <h3 style={{ fontSize: 'var(--font-size-h3)', marginBottom: 'var(--spacing-md)' }}>Purchase Packages</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--spacing-md)'
        }}>
          {[
            { name: 'Vanguard Starter', credits: 100, price: '$9', desc: 'Ideal for getting started with AI stories.' },
            { name: 'Orion Pro', credits: 500, price: '$29', desc: 'Popular. Fast rendering pipeline allocation.', popular: true },
            { name: 'Nebula Unlimited', credits: 2000, price: '$79', desc: 'Maximum storage allocation and premium filters.' }
          ].map((pkg) => (
            <Card
              key={pkg.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: pkg.popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                position: 'relative'
              }}
            >
              {pkg.popular && (
                <span style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '16px',
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  fontSize: '0.65rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  Popular
                </span>
              )}
              <div>
                <h4 style={{ margin: '0 0 var(--spacing-xxs) 0' }}>{pkg.name}</h4>
                <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {pkg.desc}
                </p>
                <div style={{ margin: 'var(--spacing-md) 0' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{pkg.price}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}> / {pkg.credits} Credits</span>
                </div>
              </div>
              <Button
                variant={pkg.popular ? 'primary' : 'secondary'}
                onClick={() => handlePurchaseMock(pkg.name, pkg.credits)}
                style={{ width: '100%' }}
              >
                Buy Now
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Transaction History */}
      <section>
        <h3 style={{ fontSize: 'var(--font-size-h3)', marginBottom: 'var(--spacing-md)' }}>Transaction History</h3>
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          {loadingHistory ? (
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
              <Loader size="sm" />
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: 'var(--spacing-lg)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              No transactions recorded.
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--font-size-body)',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface-hover)' }}>
                  <th style={{ padding: 'var(--spacing-md)' }}>Date</th>
                  <th style={{ padding: 'var(--spacing-md)' }}>Description</th>
                  <th style={{ padding: 'var(--spacing-md)' }}>Type</th>
                  <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: 'var(--spacing-md)' }}>{tx.description}</td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      <Badge type={tx.type === 'purchase' || tx.type === 'checkin' ? 'success' : 'neutral'}>
                        {tx.type}
                      </Badge>
                    </td>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: tx.amount > 0 ? 'var(--color-success)' : 'var(--color-error)'
                    }}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </div>
  );
}

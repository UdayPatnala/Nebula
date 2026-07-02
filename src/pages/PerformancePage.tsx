import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';

interface Metric {
  label: string;
  value: string;
  unit: string;
  status: 'good' | 'warning' | 'poor';
  target: string;
  description: string;
}

interface HistogramBar {
  range: string;
  count: number;
  pct: number;
}

function generateHistogram(): HistogramBar[] {
  return [
    { range: '0–50ms',   count: 312, pct: 85 },
    { range: '51–100ms', count: 48,  pct: 13 },
    { range: '101–200ms',count: 7,   pct: 2  },
    { range: '201–500ms',count: 2,   pct: 1  },
    { range: '500ms+',   count: 0,   pct: 0  }
  ];
}

function randomJitter(base: number, range: number) {
  return +(base + (Math.random() - 0.5) * range).toFixed(1);
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'Largest Contentful Paint', value: '1.2', unit: 's',  status: 'good',    target: '< 2.5s',   description: 'Time until largest visible element is rendered (LCP).' },
    { label: 'First Input Delay',        value: '18',  unit: 'ms', status: 'good',    target: '< 100ms',  description: 'Time from first interaction to browser response (FID).' },
    { label: 'Cumulative Layout Shift',  value: '0.03',unit: '',   status: 'good',    target: '< 0.1',    description: 'Visual stability of the page during load (CLS).' },
    { label: 'Time to First Byte',       value: '210', unit: 'ms', status: 'good',    target: '< 600ms',  description: 'Server response latency to the first byte (TTFB).' },
    { label: 'API P99 Latency',          value: '420', unit: 'ms', status: 'warning', target: '< 300ms',  description: '99th-percentile API response time across all endpoints.' },
    { label: 'Gallery Render Time',      value: '1.8', unit: 's',  status: 'good',    target: '< 2.0s',   description: 'Time to fully interactive gallery on first load.' }
  ]);

  const [histogram] = useState<HistogramBar[]>(generateHistogram());
  const [uptime] = useState('99.97%');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Simulate live metric refresh every 4s (Section 22 — continuous monitoring)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => prev.map((m) => {
        let newVal = m.value;
        if (m.unit === 's')  newVal = String(randomJitter(parseFloat(m.value), 0.2));
        if (m.unit === 'ms') newVal = String(Math.round(randomJitter(parseFloat(m.value), 30)));
        return { ...m, value: newVal };
      }));
      setLastRefreshed(new Date());
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (s: Metric['status']) =>
    s === 'good' ? 'var(--color-success)' : s === 'warning' ? 'var(--color-warning)' : 'var(--color-error)';

  const badgeType = (s: Metric['status']): 'success' | 'warning' | 'error' =>
    s === 'good' ? 'success' : s === 'warning' ? 'warning' : 'error';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', textAlign: 'left' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--spacing-xxs) 0' }}>
            Performance Monitor
          </h2>
          <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Live Core Web Vitals, API latency histograms and infrastructure health — Section 22.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
            🟢 Live · refreshes every 4s
          </div>
          <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
            Last: {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Uptime banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <span style={{ fontSize: '2rem' }}>✅</span>
        <div>
          <strong style={{ fontSize: 'var(--font-size-h3)', color: 'var(--color-success)' }}>
            Platform Uptime: {uptime}
          </strong>
          <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
            All systems operational · Rolling 30-day window
          </div>
        </div>
      </div>

      {/* Core Web Vitals grid */}
      <div>
        <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>Core Web Vitals &amp; SLA Targets</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-md)' }}>
          {metrics.map((m) => (
            <Card key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {m.label}
                </span>
                <Badge type={badgeType(m.status)}>{m.status.toUpperCase()}</Badge>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 'var(--weight-bold)', color: statusColor(m.status) }}>
                {m.value}<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>{m.unit}</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                Target: <strong>{m.target}</strong>
              </div>
              <p style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', margin: 0 }}>
                {m.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* API Latency Histogram */}
      <div>
        <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>API Response Time Distribution (Last 1000 Requests)</h3>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {histogram.map((bar) => (
            <div key={bar.range} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span style={{ width: '90px', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                {bar.range}
              </span>
              <div style={{ flex: 1, height: '20px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${bar.pct}%`,
                  background: bar.pct > 70 ? 'var(--color-success)' : bar.pct > 10 ? 'var(--color-warning)' : 'var(--color-error)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <span style={{ width: '70px', fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0 }}>
                {bar.count} req ({bar.pct}%)
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* Infrastructure health */}
      <div>
        <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>Infrastructure Health</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-md)' }}>
          {[
            { service: 'API Gateway',       status: 'Operational', latency: '24ms'  },
            { service: 'AI Inference Nodes',status: 'Operational', latency: '380ms' },
            { service: 'Object Storage',    status: 'Operational', latency: '18ms'  },
            { service: 'CDN Edge Network',  status: 'Operational', latency: '9ms'   },
            { service: 'Auth Service',      status: 'Operational', latency: '31ms'  },
            { service: 'Notification Bus',  status: 'Operational', latency: '12ms'  }
          ].map((svc) => (
            <Card key={svc.service} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <span style={{ fontSize: '1.4rem' }}>🟢</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-body)' }}>{svc.service}</div>
                <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)' }}>
                  {svc.status} · {svc.latency}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

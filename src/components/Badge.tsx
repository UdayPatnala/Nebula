import type { ReactNode } from 'react';
import './Badge.css';

export type BadgeType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  type?: BadgeType;
}

export default function Badge({ children, type = 'neutral' }: BadgeProps) {
  return (
    <span className={`badge badge-${type}`}>
      {children}
    </span>
  );
}

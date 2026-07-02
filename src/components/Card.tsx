import type { ReactNode, HTMLAttributes } from 'react';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  glow?: boolean;
}

export default function Card({
  children,
  hoverable = false,
  glow = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`card ${hoverable ? 'card-hoverable' : ''} ${glow ? 'card-glow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

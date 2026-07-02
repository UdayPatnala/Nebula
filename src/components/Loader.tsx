import './Loader.css';

export function Loader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`spinner spinner-${size}`} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  radius = 'var(--radius-xs)' 
}: { 
  width?: string; 
  height?: string; 
  radius?: string;
}) {
  return (
    <div 
      className="skeleton" 
      style={{ width, height, borderRadius: radius }} 
      aria-hidden="true" 
    />
  );
}

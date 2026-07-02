import { useState, useEffect } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

export interface BreakpointState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

function getBreakpoint(width: number): Breakpoint {
  if (width < 480) return 'sm';
  if (width < 768) return 'sm'; // Group mobile under sm
  if (width < 1024) return 'md';
  if (width < 1200) return 'lg';
  return 'xl';
}

export function useBreakpoint(): BreakpointState {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const breakpoint = getBreakpoint(windowWidth);

  return {
    breakpoint,
    isMobile: windowWidth < 768,
    isTablet: windowWidth >= 768 && windowWidth < 1024,
    isDesktop: windowWidth >= 1024,
    width: windowWidth,
  };
}

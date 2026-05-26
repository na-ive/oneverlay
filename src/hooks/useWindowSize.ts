import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    // Call once to ensure state is accurate
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowSize.width >= 1024;

  return { ...windowSize, isDesktop };
}

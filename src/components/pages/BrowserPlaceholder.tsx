import { useEffect, useState } from 'react';
import { LuGlobe } from 'react-icons/lu';

export function BrowserPlaceholder() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full min-h-screen bg-bg-dark flex flex-col items-center justify-center text-text-primary p-4 border-2 border-dashed border-primary-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500/10 via-bg-dark to-bg-dark pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-2 shadow-2xl backdrop-blur-md">
          <LuGlobe className="w-8 h-8 text-primary-400" />
        </div>
        <div className="flex flex-col gap-4 max-w-2xl px-6">
          <h1 className="text-3xl font-semibold text-white mb-2">
            You've just added a browser source!
          </h1>
          <p className="text-lg leading-relaxed text-white/90">
            Browser sources let you display a webpage from the internet or a local file and are commonly used for widgets and alerts
          </p>
          <p className="text-lg text-white/90 mt-2">
            Set the URL to the page you'd like to display
          </p>
        </div>
        
        <div className="mt-8 px-8 py-4 rounded-3xl bg-black/50 border-2 border-white/10 text-4xl font-mono font-bold text-primary-400 shadow-2xl backdrop-blur-md">
          {size.w} × {size.h}
        </div>
      </div>
    </div>
  );
}

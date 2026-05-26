import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LuFileQuestion, LuHouse } from 'react-icons/lu';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Oneverlay — Page Not Found';
  }, []);

  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background glow atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] bg-gradient-to-r from-indigo-600/10 to-purple-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Modal style container without header */}
      <div
        className="rounded-3xl border border-white/[0.08] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl animate-slide-up text-left"
        style={{
          width: 'min(480px, 92vw)',
          backgroundColor: 'rgba(24, 24, 27, 0.92)',
        }}
      >
        {/* Body */}
        <div className="p-10 md:p-12 flex flex-col items-center text-center gap-6">
          {/* Animated icon container */}
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <LuFileQuestion size={32} />
          </div>

          <div className="space-y-2 flex flex-col items-center">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-accent bg-accent-muted px-2.5 py-1 rounded-md border border-accent/20">
              Error 404
            </span>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-text-primary pt-2">
              Page Not Found
            </h1>
          </div>

          <p className="text-text-secondary leading-relaxed text-sm md:text-base max-w-sm">
            The page you are looking for doesn't exist, has been removed, or has been moved to a new address.
          </p>

          <div className="w-full h-[1px] bg-white/[0.04] my-1" />

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-accent hover:bg-accent-hover text-white text-sm md:text-base font-bold transition-all cursor-pointer shadow-lg shadow-accent/15 border-none"
          >
            <LuHouse size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

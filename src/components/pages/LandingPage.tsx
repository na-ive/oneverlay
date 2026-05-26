import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuGithub, LuStar, LuHeart } from 'react-icons/lu';
import { SUPPORT_URL } from '../../lib/constants';

export function LandingPage() {
  const [stars, setStars] = useState<number | string>('...');

  useEffect(() => {
    fetch('https://api.github.com/repos/na-ive/oneverlay')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.stargazers_count === 'number') {
          setStars(data.stargazers_count);
        } else {
          setStars(1);
        }
      })
      .catch((err) => {
        console.error('Error fetching GitHub stars:', err);
        setStars(1);
      });
  }, []);

  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary flex flex-col selection:bg-accent/30 selection:text-white overflow-hidden text-base">
      {/* Background glow atmosphere */}
      <div className="absolute top-[250px] left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] md:w-[900px] h-[300px] bg-gradient-to-r from-indigo-600/12 to-purple-600/8 rounded-full blur-[120px] sm:blur-[140px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="w-full max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between border-b border-white/[0.04] z-10 animate-fade-in">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black uppercase tracking-widest text-text-primary">
            ONEVERLAY
          </span>
          <span className="text-sm font-bold tracking-widest text-text-muted">
            BY NA-IVE
          </span>
        </div>
        <a
          href="https://github.com/na-ive/oneverlay"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-text-primary hover:text-white transition-colors"
        >
          <LuGithub size={16} className="text-text-primary group-hover:text-white transition-colors" />
          <span className="text-sm font-medium uppercase tracking-wide">GitHub</span>
          <div className="flex items-center gap-1 bg-white/[0.02] group-hover:bg-white/[0.04] border border-white/[0.04] group-hover:border-white/[0.08] px-2 py-0.5 rounded-md text-xs transition-colors">
            <LuStar size={11} className="fill-current text-amber-500/80 group-hover:text-amber-500 transition-colors" />
            <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">{stars}</span>
          </div>
        </a>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center max-w-[1400px] mx-auto px-6 pb-20 w-full">
        {/* Screenshot Showcase Section (At the top, cropped from the top edge, bottom fully shown) */}
        <section className="w-full flex justify-center mb-3 md:mb-4 animate-slide-down">
          <div className="w-full max-w-[1200px] h-[220px] sm:h-[300px] md:h-[380px] rounded-b-3xl border-x border-b border-white/[0.08] bg-bg-surface overflow-hidden relative shadow-[0_24px_80px_rgba(0,0,0,0.85)] shadow-accent/5 hover:border-accent/15 transition-all duration-300 -mt-px">
            <img
              src="/landing.png"
              alt="Oneverlay Editor Workspace Screenshot"
              className="w-full h-full object-cover object-bottom select-none pointer-events-none"
            />
          </div>
        </section>

        {/* Hero Section (Below the screenshot) */}
        <section className="text-center max-w-5xl flex flex-col items-center mb-24 md:mb-32">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] text-text-primary uppercase mb-6 max-w-4xl animate-slide-up" style={{ animationDelay: '150ms' }}>
            One browser source <br className="hidden md:inline" />
            for your entire stream overlay.
          </h1>
          <p className="text-base md:text-xl text-text-secondary leading-relaxed max-w-3xl mb-10 animate-slide-up" style={{ animationDelay: '250ms' }}>
            Compose, organize, and manage multiple streaming widgets and scene overlays in a single lightweight workspace.
            Boost your OBS stream performance with a single highly optimized browser source.
          </p>
          <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: '350ms' }}>
            <Link
              to="/editor"
              className="flex items-center gap-2 px-9 py-4.5 rounded-2xl bg-accent hover:bg-accent-hover text-white text-base font-bold shadow-lg shadow-accent/15 transition-all cursor-pointer border-none"
            >
              Open Editor
              <LuArrowRight size={18} />
            </Link>
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider mt-2">
              No account required. 100% free and open source.
            </span>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="w-full max-w-[1200px] mb-12 md:mb-16 animate-slide-up" style={{ animationDelay: '450ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-bg-secondary/40 hover:border-accent/25 hover:bg-bg-secondary/60 hover:shadow-2xl hover:shadow-accent/[0.02] transition-all duration-300">
              <h3 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-wide mb-3">
                Scene-Based Workflow
              </h3>
              <p className="text-base text-text-secondary leading-relaxed">
                Organize and toggle streaming components into reusable scene collections. Swap layouts, text sources, and browser captures instantly without disrupting your stream setup.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-bg-secondary/40 hover:border-accent/25 hover:bg-bg-secondary/60 hover:shadow-2xl hover:shadow-accent/[0.02] transition-all duration-300">
              <h3 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-wide mb-3">
                OBS-Inspired Editing
              </h3>
              <p className="text-base text-text-secondary leading-relaxed">
                Position, scale, crop, and transform overlay elements with a pixel-perfect WYSIWYG editor. Familiar canvas grids, alignment snaps, and overlays render exactly as they do in OBS Studio.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-bg-secondary/40 hover:border-accent/25 hover:bg-bg-secondary/60 hover:shadow-2xl hover:shadow-accent/[0.02] transition-all duration-300">
              <h3 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-wide mb-3">
                Lightweight Composition
              </h3>
              <p className="text-base text-text-secondary leading-relaxed">
                Consolidate multiple overlay assets under a single optimized browser source. Reduce your OBS Studio CPU overhead and memory footprint by letting Oneverlay handle the rendering.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.04] py-8 bg-bg-secondary/10">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black uppercase tracking-wider text-text-primary">
              ONEVERLAY
            </span>
            <span className="text-xs font-bold tracking-widest text-text-muted">
              BY NA-IVE
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-text-muted hover:text-danger/80 transition-colors"
            >
              <LuHeart size={15} className="text-text-muted group-hover:text-danger/80 transition-colors fill-transparent group-hover:fill-danger/10" />
              <span className="text-sm font-medium uppercase tracking-wide">Support</span>
            </a>
            <div className="w-[1px] h-4 bg-white/[0.06]" />
            <a
              href="https://github.com/na-ive/oneverlay"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors"
            >
              <LuGithub size={16} className="text-text-muted group-hover:text-text-secondary transition-colors" />
              <span className="text-sm font-medium uppercase tracking-wide">GitHub</span>
              <div className="flex items-center gap-1 bg-white/[0.02] group-hover:bg-white/[0.04] border border-white/[0.04] group-hover:border-white/[0.08] px-2 py-0.5 rounded-md text-xs text-text-muted transition-colors">
                <LuStar size={11} className="fill-current text-amber-500/40 group-hover:text-amber-500/60 transition-colors" />
                <span className="text-xs text-text-muted group-hover:text-text-secondary transition-colors">{stars}</span>
              </div>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

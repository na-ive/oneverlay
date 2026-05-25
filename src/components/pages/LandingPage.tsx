import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuGithub, LuStar } from 'react-icons/lu';

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
    <div className="relative min-h-screen bg-bg-primary text-text-primary flex flex-col selection:bg-accent/30 selection:text-white overflow-hidden">
      {/* Background glow atmosphere */}
      <div className="absolute top-[250px] left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] md:w-[900px] h-[300px] bg-gradient-to-r from-indigo-600/12 to-purple-600/8 rounded-full blur-[120px] sm:blur-[140px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="w-full max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between border-b border-white/[0.04] z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black uppercase tracking-widest text-text-primary">
            ONEVERLAY
          </span>
          <span className="text-xs font-bold tracking-widest text-text-muted">
            BY NA-IVE
          </span>
        </div>
        <a
          href="https://github.com/na-ive/oneverlay"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-text-secondary hover:text-text-primary text-xs font-semibold border border-white/[0.08] hover:border-accent/30 transition-all cursor-pointer"
        >
          <LuGithub size={14} className="text-text-secondary group-hover:text-text-primary transition-colors" />
          <span>GitHub</span>
          <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md text-[10px] text-text-muted group-hover:text-text-secondary transition-colors">
            <LuStar size={10} className="fill-current text-amber-500/80" />
            <span>{stars}</span>
          </div>
        </a>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center max-w-[1400px] mx-auto px-6 pb-20 w-full">
        {/* Screenshot Showcase Section (At the top, cropped from the top edge, bottom fully shown) */}
        <section className="w-full flex justify-center mb-6 md:mb-8">
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
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] text-text-primary uppercase mb-6 max-w-4xl">
            One browser source <br className="hidden md:inline" />
            for your entire stream overlay.
          </h1>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl mb-10">
            Compose, organize, and manage multiple streaming widgets and scene overlays in a single lightweight workspace.
            Boost your OBS stream performance with a single highly optimized browser source.
          </p>
          <div className="flex flex-col items-center gap-2">
            <Link
              to="/editor"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/15 transition-all cursor-pointer border-none"
            >
              Open Editor
              <LuArrowRight size={16} />
            </Link>
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mt-2">
              No account required.
            </span>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="w-full max-w-[1200px] mb-24 md:mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-bg-secondary/40 hover:border-white/[0.1] transition-all duration-200">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide mb-2">
                Scene-Based Workflow
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Organize overlays into reusable streaming scenes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-bg-secondary/40 hover:border-white/[0.1] transition-all duration-200">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide mb-2">
                OBS-Inspired Editing
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Familiar scaling, transforms, and crop behavior.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-bg-secondary/40 hover:border-white/[0.1] transition-all duration-200">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide mb-2">
                Lightweight Composition
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Combine multiple overlays into one clean setup.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full max-w-3xl text-center py-12 border-t border-white/[0.04] flex flex-col items-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-text-primary mb-6">
            Start building your overlay setup.
          </h2>
          <Link
            to="/editor"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-bg-surface hover:bg-bg-hover text-text-primary text-sm font-semibold border border-white/[0.08] hover:border-accent/30 transition-all cursor-pointer"
          >
            Launch Editor
            <LuArrowRight size={16} />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.04] py-8 bg-bg-secondary/10">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black uppercase tracking-wider text-text-primary">
              ONEVERLAY
            </span>
            <span className="text-[9px] font-bold tracking-widest text-text-muted">
              BY NA-IVE
            </span>
          </div>
          <a
            href="https://github.com/na-ive/oneverlay"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-text-muted hover:text-text-secondary font-medium tracking-wide uppercase transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

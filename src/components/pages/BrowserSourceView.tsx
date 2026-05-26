import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOverlayScene, type CloudScene } from '../../lib/api';
import type { SceneData, TextElement, ImageElement, BrowserElement } from '../../types/elements';

// Helper to convert CloudScene to SceneData
function cloudSceneToLocal(cloudScene: CloudScene): SceneData {
  return {
    id: cloudScene.id,
    name: cloudScene.name,
    canvas: cloudScene.canvas,
    elements: cloudScene.elements,
    updatedAt: cloudScene.updatedAt,
  };
}

export function BrowserSourceView() {
  const { overlayCode } = useParams<{ overlayCode: string }>();
  const [scene, setScene] = useState<SceneData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSceneData = async () => {
    if (!overlayCode) return;
    
    try {
      const cloudScene = await fetchOverlayScene(overlayCode);
      setScene(cloudSceneToLocal(cloudScene));
    } catch (err) {
      console.warn('[Oneverlay] Failed to fetch overlay scene:', err);
      setScene(null);
    } finally {
      setLoading(false);
    }
  };

  // Set transparent background for OBS browser source
  useEffect(() => {
    const rootEl = document.getElementById('root');
    const origBodyBg = document.body.style.backgroundColor;
    const origHtmlBg = document.documentElement.style.backgroundColor;
    const origRootBg = rootEl ? rootEl.style.backgroundColor : '';

    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
    if (rootEl) {
      rootEl.style.backgroundColor = 'transparent';
    }

    return () => {
      document.body.style.backgroundColor = origBodyBg;
      document.documentElement.style.backgroundColor = origHtmlBg;
      if (rootEl) {
        rootEl.style.backgroundColor = origRootBg;
      }
    };
  }, []);

  // Initial load and polling fallback for OBS (OBS LocalStorage is isolated from main browser)
  useEffect(() => {
    fetchSceneData();

    const intervalId = setInterval(fetchSceneData, 2000); // poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [overlayCode]);

  // Update document title dynamically based on the current scene name
  useEffect(() => {
    if (scene) {
      document.title = `Oneverlay - ${scene.name}`;
    } else {
      document.title = 'Oneverlay - Overlay';
    }
  }, [scene]);

  if (loading) {
    return null; // transparent loading state
  }

  if (!scene) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary font-sans p-6 text-center select-none bg-[#09090b]/85">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-text-primary mb-2">Scene Not Found</h2>
          <p className="text-sm max-w-md leading-relaxed">
            No active project or scene matches the path <code className="bg-bg-surface px-1.5 py-0.5 rounded border border-white/[0.08] text-white">/o/{overlayCode}</code>. 
            Open the editor and regenerate the overlay link.
          </p>
        </div>
      </div>
    );
  }

  // Sort elements by zIndex to preserve stacking order
  const sortedElements = [...scene.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      style={{
        position: 'relative',
        width: `${scene.canvas.width}px`,
        height: `${scene.canvas.height}px`,
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      {sortedElements.map((el) => {
        if (el.hidden) return null;

        const commonStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${el.x}px`,
          top: `${el.y}px`,
          width: `${el.width}px`,
          height: `${el.height}px`,
          transform: `rotate(${el.rotation}deg) scale(${el.scaleX}, ${el.scaleY})`,
          transformOrigin: 'top left',
          opacity: el.opacity,
          clipPath: `inset(${el.cropTop || 0}px ${el.cropRight || 0}px ${el.cropBottom || 0}px ${el.cropLeft || 0}px)`,
          zIndex: 10 + el.zIndex,
        };

        if (el.type === 'text') {
          const textEl = el as TextElement;
          return (
            <div key={el.id} style={{ ...commonStyle, width: 'auto', height: 'auto' }}>
              <span
                style={{
                  fontSize: `${textEl.fontSize}px`,
                  fontFamily: textEl.fontFamily,
                  color: textEl.color,
                  fontWeight: textEl.fontWeight,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  display: 'inline-block',
                }}
              >
                {textEl.text}
              </span>
            </div>
          );
        }

        if (el.type === 'image') {
          const imageEl = el as ImageElement;
          if (!imageEl.imageUrl) return null;
          return (
            <div key={el.id} style={{ ...commonStyle, borderRadius: '4px' }}>
              <img
                src={imageEl.imageUrl}
                alt={imageEl.name}
                className="w-full h-full object-cover"
              />
            </div>
          );
        }

        if (el.type === 'browser') {
          const browserEl = el as BrowserElement;
          const hasUrl = !!browserEl.url && browserEl.url !== 'about:blank';
          if (!hasUrl) return null;
          return (
            <div
              key={el.id}
              style={{
                ...commonStyle,
                width: `${browserEl.browserWidth}px`,
                height: `${browserEl.browserHeight}px`,
                clipPath: `inset(${browserEl.cropTop}px ${browserEl.cropRight}px ${browserEl.cropBottom}px ${browserEl.cropLeft}px)`,
                borderRadius: '4px',
              }}
            >
              <iframe
                src={browserEl.url}
                title={`browser-source-${browserEl.id}`}
                className="w-full h-full border-0"
                style={{
                  backgroundColor: 'transparent',
                }}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

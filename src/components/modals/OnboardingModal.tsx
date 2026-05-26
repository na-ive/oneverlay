import { useState, useCallback } from 'react';
import { LuKey, LuPlus, LuCopy, LuEye, LuEyeOff, LuLoader } from 'react-icons/lu';
import { Modal } from '../ui/Modal';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore } from '../../store/sceneStore';
import {
  initProject,
  validateSecretKey,
  SECRET_KEY_STORAGE_KEY,
  PROJECT_ID_KEY,
  type CloudScene,
} from '../../lib/api';
import type { ProjectData, SceneData } from '../../types/elements';

// Convert cloud scene format back to local SceneData format
function cloudSceneToLocal(cloudScene: CloudScene): SceneData {
  return {
    id: cloudScene.id,
    name: cloudScene.name,
    canvas: cloudScene.canvas,
    elements: cloudScene.elements,
    updatedAt: cloudScene.updatedAt,
  };
}

export function OnboardingModal() {
  const isOpen = useEditorStore((s) => s.isOnboardingOpen);
  const setOpen = useEditorStore((s) => s.setOnboardingOpen);
  const loadProjectData = useSceneStore((s) => s.loadProjectData);

  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [existingKey, setExistingKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  // Shown after creation so user can copy it before closing
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreateNew = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { projectId, secretKey } = await initProject();
      localStorage.setItem(SECRET_KEY_STORAGE_KEY, secretKey);
      localStorage.setItem(PROJECT_ID_KEY, projectId);
      setCreatedKey(secretKey);
    } catch (err) {
      setError('Failed to create workspace. Check your connection and try again.');
      console.error('[Oneverlay] initProject error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCopyKey = useCallback(async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }, []);

  const handleContinueAfterCreation = useCallback(() => {
    setOpen(false);
    setCreatedKey(null);
  }, [setOpen]);

  const handleLoadExisting = useCallback(async () => {
    const trimmed = existingKey.trim();
    if (!trimmed) {
      setError('Please enter your secret key.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const cloudProject = await validateSecretKey(trimmed);

      // Store credentials
      localStorage.setItem(SECRET_KEY_STORAGE_KEY, trimmed);
      localStorage.setItem(PROJECT_ID_KEY, cloudProject.projectId);

      // Load scenes into the store
      const scenes = cloudProject.scenes.map(cloudSceneToLocal);
      const projectData: ProjectData = {
        scenes: scenes.length > 0 ? scenes : useSceneStore.getState().scenes,
        activeSceneId: cloudProject.scenes[0]?.id ?? useSceneStore.getState().activeSceneId,
        updatedAt: cloudProject.updatedAt,
      };
      loadProjectData(projectData);

      setOpen(false);
      setExistingKey('');
    } catch (err) {
      setError('Invalid secret key or connection error. Please check and try again.');
      console.error('[Oneverlay] validateSecretKey error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [existingKey, loadProjectData, setOpen]);

  // ── Post-creation screen: show the key so user can save it ──
  if (createdKey) {
    return (
      <Modal open={isOpen} onClose={handleContinueAfterCreation} title="Save Your Secret Key" width="480px">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-xs text-text-secondary leading-relaxed">
              This is your <span className="text-text-primary font-semibold">Secret Key</span>.
              Save it somewhere safe — it's the only way to access your workspace from another device.
              You can always find it again in <span className="text-text-primary font-semibold">Settings → Account</span>.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
              Your Secret Key
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center px-3 py-2.5 rounded-xl border border-white/[0.08] bg-bg-primary/30 font-mono text-xs text-text-primary select-all overflow-hidden">
                <span className="truncate">
                  {showKey ? createdKey : '•'.repeat(createdKey.length)}
                </span>
              </div>
              <button
                onClick={() => setShowKey((v) => !v)}
                className="p-2.5 rounded-xl border border-white/[0.08] bg-bg-primary/30 hover:bg-white/[0.04] text-text-secondary hover:text-text-primary transition-all cursor-pointer flex-shrink-0"
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? <LuEyeOff size={14} /> : <LuEye size={14} />}
              </button>
              <button
                onClick={() => handleCopyKey(createdKey)}
                className="p-2.5 rounded-xl border border-white/[0.08] bg-bg-primary/30 hover:bg-white/[0.04] text-text-secondary hover:text-text-primary transition-all cursor-pointer flex-shrink-0"
                title="Copy"
              >
                <LuCopy size={14} />
              </button>
            </div>
            {copiedKey && (
              <p className="text-[11px] text-accent pl-1">Copied to clipboard!</p>
            )}
          </div>

          <button
            onClick={handleContinueAfterCreation}
            className="w-full px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-all cursor-pointer"
          >
            I've saved it — Open Editor
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onClose={() => {}} title="Welcome to Oneverlay" width="480px">
      <div className="space-y-4">
        <p className="text-xs text-text-secondary leading-relaxed">
          Your overlays are stored securely in the cloud, so OBS can access them from anywhere.
          Create a new workspace or load an existing one with your secret key.
        </p>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-bg-primary/40 border border-white/[0.06]">
          <button
            onClick={() => { setTab('new'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === 'new'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LuPlus size={13} />
            Create new Oneverlay
          </button>
          <button
            onClick={() => { setTab('existing'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === 'existing'
                ? 'bg-white/[0.08] text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LuKey size={13} />
            I have a secret key
          </button>
        </div>

        {/* Tab content */}
        {tab === 'new' ? (
          <div className="space-y-3">
            <p className="text-xs text-text-muted leading-relaxed pl-1">
              A new workspace will be created and a secret key will be generated.
              Keep this key — it's how you restore your workspace on another machine.
            </p>
            <button
              onClick={handleCreateNew}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all cursor-pointer"
            >
              {isLoading ? <LuLoader size={13} className="animate-spin" /> : <LuPlus size={13} />}
              {isLoading ? 'Creating...' : 'Create new Oneverlay'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
                Secret Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={existingKey}
                  onChange={(e) => { setExistingKey(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadExisting()}
                  placeholder="Paste your secret key here"
                  className="flex-1 px-3 py-2 rounded-xl border border-white/[0.08] bg-bg-primary/30 text-text-primary text-xs font-mono outline-none focus:border-accent focus:bg-bg-primary/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)] transition-all"
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="p-2.5 rounded-xl border border-white/[0.08] bg-bg-primary/30 hover:bg-white/[0.04] text-text-secondary hover:text-text-primary transition-all cursor-pointer flex-shrink-0"
                >
                  {showKey ? <LuEyeOff size={14} /> : <LuEye size={14} />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLoadExisting}
              disabled={isLoading || !existingKey.trim()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all cursor-pointer"
            >
              {isLoading ? <LuLoader size={13} className="animate-spin" /> : <LuKey size={13} />}
              {isLoading ? 'Loading...' : 'Load Workspace'}
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-danger pl-1">{error}</p>
        )}
      </div>
    </Modal>
  );
}

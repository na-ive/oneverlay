import { useCallback, useState, useEffect, useRef } from 'react';
import { LuEye, LuEyeOff, LuCopy, LuRefreshCw, LuLogOut, LuTrash2, LuLoader, LuDownload, LuUpload } from 'react-icons/lu';
import { Modal } from '../ui/Modal';
import { useConfirmStore } from '../../store/confirmStore';
import { useEditorStore } from '../../store/editorStore';
import { useSceneStore } from '../../store/sceneStore';
import { useHistoryStore } from '../../store/historyStore';
import { regenerateSecretKey, deleteAccount, SECRET_KEY_STORAGE_KEY, PROJECT_ID_KEY } from '../../lib/api';

export function SettingsModal() {
  const isOpen = useEditorStore((s) => s.isSettingsOpen);
  const setOpen = useEditorStore((s) => s.setSettingsOpen);
  const setOnboardingOpen = useEditorStore((s) => s.setOnboardingOpen);
  const resetProject = useSceneStore((s) => s.resetProject);
  const getSnapshot = useSceneStore((s) => s.getSnapshot);
  const loadProjectData = useSceneStore((s) => s.loadProjectData);
  const clearHistory = useHistoryStore((s) => s.clear);

  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [secretKey, setSecretKey] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showConfirm = useConfirmStore((s) => s.showConfirm);
  const showAlert = useConfirmStore((s) => s.showAlert);

  useEffect(() => {
    if (isOpen) {
      setSecretKey(localStorage.getItem(SECRET_KEY_STORAGE_KEY) || '');
    }
  }, [isOpen]);

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleCopyKey = useCallback(async () => {
    if (!secretKey) return;
    await navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }, [secretKey]);

  const handleRegenerateKey = useCallback(async () => {
    const confirmed = await showConfirm({
      title: 'Regenerate Key',
      message: 'Regenerate secret key? Your old key will no longer work on other devices.',
      isDanger: true,
      confirmText: 'Regenerate'
    });
    if (!confirmed) return;

    setIsRegenerating(true);
    try {
      const newKey = await regenerateSecretKey();
      localStorage.setItem(SECRET_KEY_STORAGE_KEY, newKey);
      setSecretKey(newKey);
    } catch (err) {
      console.warn('[Oneverlay] Failed to regenerate secret key:', err);
      await showAlert({ title: 'Error', message: 'Failed to regenerate secret key.', isDanger: true });
    } finally {
      setIsRegenerating(false);
    }
  }, [showConfirm, showAlert]);

  const handleLogout = useCallback(async () => {
    const confirmed = await showConfirm({
      title: 'Log Out',
      message: 'Log out? This will clear your credentials from this browser. Your scenes will remain safe in the cloud.',
      confirmText: 'Log Out'
    });
    if (!confirmed) return;

    localStorage.removeItem(SECRET_KEY_STORAGE_KEY);
    localStorage.removeItem(PROJECT_ID_KEY);
    resetProject();
    clearHistory();
    handleClose();
    setOnboardingOpen(true);
  }, [resetProject, clearHistory, handleClose, setOnboardingOpen, showConfirm]);

  const handleDeleteAccount = useCallback(async () => {
    const confirmed = await showConfirm({
      title: 'Delete Account',
      message: 'WARNING: This will permanently delete your workspace, all scenes, and overlay codes from the cloud. This cannot be undone. Are you sure?',
      isDanger: true,
      confirmText: 'Delete Everything'
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      localStorage.removeItem(SECRET_KEY_STORAGE_KEY);
      localStorage.removeItem(PROJECT_ID_KEY);
      resetProject();
      clearHistory();
      handleClose();
      setOnboardingOpen(true);
    } catch (err) {
      console.warn('[Oneverlay] Failed to delete account:', err);
      await showAlert({ title: 'Error', message: 'Failed to delete account.', isDanger: true });
    } finally {
      setIsDeleting(false);
    }
  }, [resetProject, clearHistory, handleClose, setOnboardingOpen, showConfirm, showAlert]);

  const handleReset = useCallback(async () => {
    const confirmed = await showConfirm({
      title: 'Clear Local Canvas',
      message: 'Reset all local elements and settings? This does not delete the cloud project, just clears the local editor.',
      isDanger: true,
      confirmText: 'Clear Local Editor'
    });
    if (confirmed) {
      resetProject();
      clearHistory();
      handleClose();
    }
  }, [resetProject, clearHistory, handleClose, showConfirm]);

  const handleExport = useCallback(() => {
    const data = getSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    a.download = `oneverlay-backup-${dateStr}_${timeStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getSnapshot]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await showConfirm({
      title: 'Import Backup',
      message: 'WARNING: Importing a backup will overwrite your current workspace entirely. Are you sure you want to proceed?',
      isDanger: true,
      confirmText: 'Import and Overwrite'
    });

    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation
        if (data && Array.isArray(data.scenes) && data.activeSceneId) {
          loadProjectData(data);
          await showAlert({ title: 'Success', message: 'Backup imported successfully!' });
        } else {
          await showAlert({ title: 'Error', message: 'Invalid backup file format.', isDanger: true });
        }
      } catch (err) {
        console.error('[Oneverlay] Failed to parse backup file:', err);
        await showAlert({ title: 'Error', message: 'Failed to read the backup file.', isDanger: true });
      }
      
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }, [loadProjectData, showConfirm, showAlert]);

  return (
    <>
      <Modal open={isOpen} onClose={handleClose} title="Settings" width="480px">
      <div className="space-y-5">
        {/* Account Section */}
        <div className="flex flex-col gap-3">
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
            Account & Security
          </label>
          
          {/* Secret Key Display */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-text-muted pl-1">Secret Key</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center px-3 py-2.5 rounded-xl border border-white/[0.08] bg-bg-primary/30 font-mono text-xs text-text-primary select-all overflow-hidden">
                <span className="truncate">
                  {showKey ? secretKey : '•'.repeat(secretKey.length || 20)}
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
                onClick={handleCopyKey}
                className="p-2.5 rounded-xl border border-white/[0.08] bg-bg-primary/30 hover:bg-white/[0.04] text-text-secondary hover:text-text-primary transition-all cursor-pointer flex-shrink-0 relative"
                title="Copy Key"
              >
                <LuCopy size={14} />
                {copiedKey && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-accent font-medium bg-bg-surface px-1.5 py-0.5 rounded shadow-sm border border-white/[0.08]">
                    Copied
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleRegenerateKey}
              disabled={isRegenerating}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                {isRegenerating ? <LuLoader size={14} className="animate-spin" /> : <LuRefreshCw size={14} />}
                Regenerate Secret Key
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LuLogOut size={14} />
                Log Out (Clear Local Key)
              </span>
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
          <label className="text-[11px] text-text-secondary font-semibold uppercase tracking-wide pl-1">
            Data Management
          </label>
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LuDownload size={14} />
                Export Backup (JSON)
              </span>
            </button>
            <button
              onClick={handleImportClick}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LuUpload size={14} />
                Import Backup (JSON)
              </span>
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef}
              onChange={handleImportFile}
              className="hidden" 
            />
          </div>
        </div>

        {/* Danger zone */}
        <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.06]">
          <button
            onClick={handleReset}
            className="w-full px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
          >
            Clear Local Editor Canvas
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-danger/30 bg-danger/10 hover:bg-danger/20 text-danger text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? <LuLoader size={14} className="animate-spin" /> : <LuTrash2 size={14} />}
            {isDeleting ? 'Deleting...' : 'Delete Cloud Account & Scenes'}
          </button>
        </div>

        {/* App info */}
        <div className="pt-3 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-text-muted">
            Oneverlay 0.1.0
          </p>
        </div>
      </div>
      </Modal>
    </>
  );
}

import { useState, useEffect } from 'react';
import { HotkeyInput } from './hotkey-input';
import { GetConfig, SaveConfig, SelectFolder } from '../../wailsjs/go/main/App';
import { config } from '../../wailsjs/go/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'hotkeys' | 'startup' | 'quicksave' | 'export';

// Local interface for easier state management
interface LocalConfig {
  hotkeys: {
    fullscreen: string;
    region: string;
    window: string;
  };
  startup: {
    launchOnStartup: boolean;
    minimizeToTray: boolean;
    showNotification: boolean;
  };
  quickSave: {
    folder: string;
    pattern: string;
  };
  export: {
    defaultFormat: string;
    jpegQuality: number;
    includeBackground: boolean;
  };
}

const defaultConfig: LocalConfig = {
  hotkeys: {
    fullscreen: 'PrintScreen',
    region: 'Ctrl+PrintScreen',
    window: 'Ctrl+Shift+PrintScreen',
  },
  startup: {
    launchOnStartup: false,
    minimizeToTray: false,
    showNotification: true,
  },
  quickSave: {
    folder: '',
    pattern: 'timestamp',
  },
  export: {
    defaultFormat: 'png',
    jpegQuality: 95,
    includeBackground: true,
  },
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('hotkeys');
  const [localConfig, setLocalConfig] = useState<LocalConfig>(defaultConfig);
  const [originalConfig, setOriginalConfig] = useState<LocalConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load config when modal opens
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const cfg = await GetConfig();
      const local: LocalConfig = {
        hotkeys: {
          fullscreen: cfg.hotkeys?.fullscreen || defaultConfig.hotkeys.fullscreen,
          region: cfg.hotkeys?.region || defaultConfig.hotkeys.region,
          window: cfg.hotkeys?.window || defaultConfig.hotkeys.window,
        },
        startup: {
          launchOnStartup: cfg.startup?.launchOnStartup || false,
          minimizeToTray: cfg.startup?.minimizeToTray || false,
          showNotification: cfg.startup?.showNotification ?? true,
        },
        quickSave: {
          folder: cfg.quickSave?.folder || '',
          pattern: cfg.quickSave?.pattern || 'timestamp',
        },
        export: {
          defaultFormat: cfg.export?.defaultFormat || 'png',
          jpegQuality: cfg.export?.jpegQuality || 95,
          includeBackground: cfg.export?.includeBackground ?? true,
        },
      };
      setLocalConfig(local);
      setOriginalConfig(local);
      setError(null);
    } catch (err) {
      console.error('Failed to load config:', err);
      setError('Failed to load settings');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Convert LocalConfig to config.Config for the backend
      const cfg = new config.Config({
        hotkeys: new config.HotkeyConfig(localConfig.hotkeys),
        startup: new config.StartupConfig(localConfig.startup),
        quickSave: new config.QuickSaveConfig(localConfig.quickSave),
        export: new config.ExportConfig(localConfig.export),
      });
      await SaveConfig(cfg);
      setOriginalConfig(localConfig);
      onClose();
    } catch (err) {
      console.error('Failed to save config:', err);
      setError('Failed to save settings');
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setLocalConfig(originalConfig);
    setError(null);
    onClose();
  };

  const handleSelectFolder = async () => {
    try {
      const folder = await SelectFolder();
      if (folder) {
        setLocalConfig((prev) => ({
          ...prev,
          quickSave: { ...prev.quickSave, folder },
        }));
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
    }
  };

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'hotkeys', label: 'Hotkeys' },
    { id: 'startup', label: 'Startup' },
    { id: 'quicksave', label: 'Quick Save' },
    { id: 'export', label: 'Export' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={handleCancel}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'hotkeys' && (
            <div>
              <p className="text-sm text-slate-400 mb-4">
                Click on a field and press your desired key combination.
              </p>
              <HotkeyInput
                label="Fullscreen Capture"
                value={localConfig.hotkeys.fullscreen}
                onChange={(value) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    hotkeys: { ...prev.hotkeys, fullscreen: value },
                  }))
                }
              />
              <HotkeyInput
                label="Region Capture"
                value={localConfig.hotkeys.region}
                onChange={(value) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    hotkeys: { ...prev.hotkeys, region: value },
                  }))
                }
              />
              <HotkeyInput
                label="Window Capture"
                value={localConfig.hotkeys.window}
                onChange={(value) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    hotkeys: { ...prev.hotkeys, window: value },
                  }))
                }
              />
            </div>
          )}

          {activeTab === 'startup' && (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.startup.launchOnStartup}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startup: { ...prev.startup, launchOnStartup: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-200">Launch on Windows startup</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.startup.minimizeToTray}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startup: { ...prev.startup, minimizeToTray: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-200">Start minimized to tray</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.startup.showNotification}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      startup: { ...prev.startup, showNotification: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-200">Show notification on capture</span>
              </label>
            </div>
          )}

          {activeTab === 'quicksave' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Save Folder</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localConfig.quickSave.folder}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                    placeholder="Default: Pictures/WinShot"
                  />
                  <button
                    onClick={handleSelectFolder}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Filename Pattern</label>
                <select
                  value={localConfig.quickSave.pattern}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      quickSave: {
                        ...prev.quickSave,
                        pattern: e.target.value as 'timestamp' | 'date' | 'increment',
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200"
                >
                  <option value="timestamp">winshot_2024-12-01_15-30-45</option>
                  <option value="date">winshot_2024-12-01</option>
                  <option value="increment">winshot_001, winshot_002...</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Default Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={localConfig.export.defaultFormat === 'png'}
                      onChange={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          export: { ...prev.export, defaultFormat: 'png' },
                        }))
                      }
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-slate-200">PNG</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={localConfig.export.defaultFormat === 'jpeg'}
                      onChange={() =>
                        setLocalConfig((prev) => ({
                          ...prev,
                          export: { ...prev.export, defaultFormat: 'jpeg' },
                        }))
                      }
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-slate-200">JPEG</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  JPEG Quality: {localConfig.export.jpegQuality}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={localConfig.export.jpegQuality}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      export: { ...prev.export, jpegQuality: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-blue-500"
                  disabled={localConfig.export.defaultFormat !== 'jpeg'}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.export.includeBackground}
                  onChange={(e) =>
                    setLocalConfig((prev) => ({
                      ...prev,
                      export: { ...prev.export, includeBackground: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-200">Include styled background</span>
              </label>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { WindowInfo } from '../types';
import { GetWindowList } from '../../wailsjs/go/main/App';
import { X, Search, AppWindow, ChevronRight, RefreshCw } from 'lucide-react';

interface WindowPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (window: WindowInfo) => void;
}

export function WindowPicker({ isOpen, onClose, onSelect }: WindowPickerProps) {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadWindows();
    }
  }, [isOpen]);

  const loadWindows = async () => {
    setIsLoading(true);
    try {
      const list = await GetWindowList();
      // Filter out our own window and sort by title
      const filtered = (list as WindowInfo[])
        .filter(w => !w.title.includes('WinShot'))
        .sort((a, b) => a.title.localeCompare(b.title));
      setWindows(filtered);
    } catch (error) {
      console.error('Failed to get window list:', error);
    }
    setIsLoading(false);
  };

  const filteredWindows = windows.filter(w =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card rounded-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gradient">Select Window</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search windows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white/5 text-white rounded-xl border border-white/10
                         placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Window List */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span>Loading windows...</span>
              </div>
            </div>
          ) : filteredWindows.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              No windows found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredWindows.map((window) => (
                <button
                  key={window.handle}
                  onClick={() => onSelect(window)}
                  className="w-full p-3 text-left rounded-xl transition-all duration-200
                             bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
                      <AppWindow className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate font-medium">{window.title}</div>
                      <div className="text-xs text-slate-400">
                        <span className="text-violet-400">{window.width}</span>
                        <span className="text-slate-500"> × </span>
                        <span className="text-violet-400">{window.height}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center">
          <button
            onClick={loadWindows}
            className="text-slate-400 hover:text-violet-400 transition-all duration-200 text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <span className="text-sm text-slate-400">
            <span className="text-violet-400 font-medium">{filteredWindows.length}</span> windows
          </span>
        </div>
      </div>
    </div>
  );
}

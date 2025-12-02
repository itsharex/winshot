import { AspectRatio } from '../types';

interface CropToolbarProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  isCropActive: boolean;
}

const ASPECT_RATIOS: { id: AspectRatio; label: string }[] = [
  { id: 'free', label: 'Free' },
  { id: '16:9', label: '16:9' },
  { id: '4:3', label: '4:3' },
  { id: '1:1', label: '1:1' },
  { id: '9:16', label: '9:16' },
  { id: '3:4', label: '3:4' },
];

export function CropToolbar({
  aspectRatio,
  onAspectRatioChange,
  onApplyCrop,
  onCancelCrop,
  isCropActive,
}: CropToolbarProps) {
  if (!isCropActive) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 glass-light border-t border-white/5">
      <span className="text-sm text-slate-300 font-medium">Aspect Ratio</span>

      <div className="flex gap-1">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.id}
            onClick={() => onAspectRatioChange(ratio.id)}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-all duration-200 ${
              aspectRatio === ratio.id
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            {ratio.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={onCancelCrop}
        className="px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-200
                   bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                   text-slate-300 hover:text-white"
      >
        Cancel
      </button>

      <button
        onClick={onApplyCrop}
        className="px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-200
                   bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400
                   text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                   hover:-translate-y-0.5 active:translate-y-0"
      >
        Apply Crop
      </button>
    </div>
  );
}

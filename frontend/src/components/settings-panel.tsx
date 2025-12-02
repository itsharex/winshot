import { useRef, useState, useEffect } from 'react';

const MAX_BACKGROUND_IMAGES = 8;
const STORAGE_KEY = 'winshot-background-images';

interface SettingsPanelProps {
  padding: number;
  cornerRadius: number;
  shadowSize: number;
  backgroundColor: string;
  imageWidth: number;
  imageHeight: number;
  onPaddingChange: (value: number) => void;
  onCornerRadiusChange: (value: number) => void;
  onShadowSizeChange: (value: number) => void;
  onBackgroundChange: (value: string) => void;
}

const GRADIENT_PRESETS = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { name: 'Peach', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Sky', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Lavender', value: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Cool Blue', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Warm', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: 'Carbon', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  { name: 'Clean', value: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
];

const SOLID_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#e94560',
  '#ffffff', '#f5f5f5', '#1e293b', '#334155',
  '#0ea5e9', '#22c55e', '#eab308', '#ef4444',
];

export function SettingsPanel({
  padding,
  cornerRadius,
  shadowSize,
  backgroundColor,
  imageWidth,
  imageHeight,
  onPaddingChange,
  onCornerRadiusChange,
  onShadowSizeChange,
  onBackgroundChange,
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Load images from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const images = JSON.parse(stored);
        if (Array.isArray(images)) {
          setUploadedImages(images.slice(0, MAX_BACKGROUND_IMAGES));
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, []);

  // Save images to localStorage when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  // Max padding is 1/3 of the smaller dimension
  const maxPadding = Math.floor(Math.min(imageWidth, imageHeight) / 3);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadedImages.length < MAX_BACKGROUND_IMAGES) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedImages(prev => [...prev, dataUrl]);
        onBackgroundChange(`url(${dataUrl})`);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const imageToRemove = uploadedImages[index];
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    // If the removed image was the active background, reset to first gradient
    if (backgroundColor === `url(${imageToRemove})`) {
      onBackgroundChange(GRADIENT_PRESETS[0].value);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    onBackgroundChange(`url(${imageUrl})`);
  };

  return (
    <div className="w-64 bg-slate-800 border-l border-slate-700 p-4 overflow-y-auto">
      <h2 className="text-sm font-semibold text-white mb-4">Settings</h2>

      {/* Padding */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Padding: {padding}px
        </label>
        <input
          type="range"
          min="0"
          max={maxPadding}
          value={Math.min(padding, maxPadding)}
          onChange={(e) => onPaddingChange(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Corner Radius */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Corner Radius: {cornerRadius}px
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={cornerRadius}
          onChange={(e) => onCornerRadiusChange(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Shadow/Blur */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Shadow Blur: {shadowSize}px
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={shadowSize}
          onChange={(e) => onShadowSizeChange(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Background Gradients */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Background
        </label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {GRADIENT_PRESETS.map((gradient) => (
            <button
              key={gradient.name}
              onClick={() => onBackgroundChange(gradient.value)}
              className={`w-full aspect-square rounded-lg border-2 transition-all
                ${backgroundColor === gradient.value
                  ? 'border-blue-500 scale-110'
                  : 'border-transparent hover:border-slate-500'
                }`}
              style={{ background: gradient.value }}
              title={gradient.name}
            />
          ))}
        </div>

        {/* Solid Colors */}
        <div className="grid grid-cols-4 gap-2">
          {SOLID_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onBackgroundChange(color)}
              className={`w-full aspect-square rounded-lg border-2 transition-all
                ${backgroundColor === color
                  ? 'border-blue-500 scale-110'
                  : 'border-transparent hover:border-slate-500'
                }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Custom Color
        </label>
        <input
          type="color"
          value={backgroundColor.startsWith('#') ? backgroundColor : '#1a1a2e'}
          onChange={(e) => onBackgroundChange(e.target.value)}
          className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
        />
      </div>

      {/* Image Background */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Image Background ({uploadedImages.length}/{MAX_BACKGROUND_IMAGES})
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Image Gallery Grid */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {uploadedImages.map((imageUrl, index) => {
              const isSelected = backgroundColor === `url(${imageUrl})`;
              return (
                <div key={index} className="relative group">
                  <button
                    onClick={() => handleSelectImage(imageUrl)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all bg-cover bg-center
                      ${isSelected
                        ? 'border-blue-500 scale-110 z-10'
                        : 'border-transparent hover:border-slate-500'
                      }`}
                    style={{ backgroundImage: `url(${imageUrl})` }}
                    title={`Image ${index + 1}`}
                  />
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload button - only show if under limit */}
        {uploadedImages.length < MAX_BACKGROUND_IMAGES && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Image
          </button>
        )}
      </div>
    </div>
  );
}

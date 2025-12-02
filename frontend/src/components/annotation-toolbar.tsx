import { EditorTool } from '../types';
import {
  MousePointer2,
  Square,
  Circle,
  MoveRight,
  Minus,
  Type,
  Crop,
  Trash2,
} from 'lucide-react';

interface AnnotationToolbarProps {
  activeTool: EditorTool;
  strokeColor: string;
  strokeWidth: number;
  onToolChange: (tool: EditorTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#0ea5e9', '#6366f1', '#a855f7', '#ec4899',
  '#ffffff', '#000000', '#64748b', '#1e293b',
];

const STROKE_WIDTHS = [2, 4, 6, 8, 10];

export function AnnotationToolbar({
  activeTool,
  strokeColor,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onDeleteSelected,
  hasSelection,
}: AnnotationToolbarProps) {
  const tools: { id: EditorTool; icon: JSX.Element; label: string; shortcut: string }[] = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: <MousePointer2 className="w-5 h-5" />,
    },
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      icon: <Square className="w-5 h-5" />,
    },
    {
      id: 'ellipse',
      label: 'Ellipse',
      shortcut: 'E',
      icon: <Circle className="w-5 h-5" />,
    },
    {
      id: 'arrow',
      label: 'Arrow',
      shortcut: 'A',
      icon: <MoveRight className="w-5 h-5" />,
    },
    {
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      icon: <Minus className="w-5 h-5 -rotate-45" />,
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'T',
      icon: <Type className="w-5 h-5" />,
    },
    {
      id: 'crop',
      label: 'Crop',
      shortcut: 'C',
      icon: <Crop className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex items-center gap-3 px-3 py-2 glass-light">
      {/* Tools */}
      <div className="flex items-center gap-1 pr-3 border-r border-white/10">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeTool === tool.id
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-2 px-3 border-r border-white/10">
        <span className="text-xs text-slate-400 font-medium">Color</span>
        <div className="flex gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-6 h-6 rounded-md transition-all duration-200 ${
                strokeColor === color
                  ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900 scale-110'
                  : 'hover:scale-110 hover:ring-1 hover:ring-white/30'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="flex items-center gap-2 px-3 border-r border-white/10">
        <span className="text-xs text-slate-400 font-medium">Width</span>
        <div className="flex gap-1">
          {STROKE_WIDTHS.map((width) => (
            <button
              key={width}
              onClick={() => onStrokeWidthChange(width)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                strokeWidth === width
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={`${width}px`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: width + 2, height: width + 2 }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className={`p-2 rounded-lg transition-all duration-200 ${
          hasSelection
            ? 'text-rose-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 hover:shadow-lg hover:shadow-rose-500/30'
            : 'text-slate-600 cursor-not-allowed opacity-50'
        }`}
        title="Delete Selected (Del)"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

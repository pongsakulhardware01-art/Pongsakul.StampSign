import React from 'react';
import {
  Layers as LayersIcon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Layer } from '../types';

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayer,
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col h-full overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-4 h-4 text-red-600" />
          <h3 className="text-xs font-bold text-zinc-900">เลเยอร์บนภาพ</h3>
        </div>
        <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          {layers.length}
        </span>
      </div>

      {/* Layer items list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-zinc-100">
        {layers.length === 0 ? (
          <div className="py-8 text-center px-4">
            <p className="text-xs text-zinc-400 font-medium">
              ยังไม่มีเลเยอร์บนภาพ
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              เลือกจากคลัง หรือกดสร้างตราปั๊ม/วาดลายเซ็นด้านบน
            </p>
          </div>
        ) : (
          [...layers].reverse().map((layer, reversedIndex) => {
            const actualIndex = layers.length - 1 - reversedIndex;
            const isSelected = layer.id === selectedLayerId;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`group flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-red-50/70 border-red-300 ring-1 ring-red-400/40'
                    : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/80 hover:border-zinc-300'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-lg bg-checkerboard border border-zinc-200 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={layer.imageUrl}
                    alt={layer.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                  />
                </div>

                {/* Name & Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-800 truncate group-hover:text-red-700">
                    {layer.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {Math.round(layer.width)}×{Math.round(layer.height)}px • {Math.round(layer.rotation)}°
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 'up');
                    }}
                    disabled={actualIndex === layers.length - 1}
                    className="p-1 rounded-md hover:bg-zinc-200 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 transition cursor-pointer"
                    title="เลื่อนขึ้นบนสุด"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 'down');
                    }}
                    disabled={actualIndex === 0}
                    className="p-1 rounded-md hover:bg-zinc-200 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 transition cursor-pointer"
                    title="เลื่อนลงล่างสุด"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                    className={`p-1 rounded-md hover:bg-zinc-200 transition cursor-pointer ${
                      layer.visible ? 'text-zinc-500 hover:text-zinc-800' : 'text-amber-500'
                    }`}
                    title={layer.visible ? 'ซ่อนเลเยอร์' : 'แสดงเลเยอร์'}
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(layer.id);
                    }}
                    className={`p-1 rounded-md hover:bg-zinc-200 transition cursor-pointer ${
                      layer.locked ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-800'
                    }`}
                    title={layer.locked ? 'ปลดล็อก' : 'ล็อกตำแหน่ง'}
                  >
                    {layer.locked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateLayer(layer.id);
                    }}
                    className="p-1 rounded-md hover:bg-zinc-200 text-zinc-400 hover:text-zinc-800 transition cursor-pointer"
                    title="ทำซ้ำ"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="p-1 rounded-md hover:bg-red-100 text-zinc-400 hover:text-red-600 transition cursor-pointer"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

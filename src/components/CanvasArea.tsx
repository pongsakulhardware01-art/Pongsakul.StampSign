import React, { useRef, useState, useEffect } from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  Lock,
  Unlock,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookmarkCheck,
  Check,
  Upload,
} from 'lucide-react';
import { Layer } from '../types';

interface CanvasAreaProps {
  baseImageUrl: string | null;
  baseImageDimensions: { width: number; height: number };
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onSaveLayerPlacement: (layer: Layer) => void;
  onUploadDocument: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  pdfCurrentPage?: number;
  pdfTotalPages?: number;
  onSwitchPdfPage?: (page: number) => void;
}

type DragMode =
  | 'none'
  | 'pan'
  | 'move'
  | 'rotate'
  | 'resize-nw'
  | 'resize-ne'
  | 'resize-se'
  | 'resize-sw'
  | 'resize-n'
  | 'resize-s'
  | 'resize-e'
  | 'resize-w';

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  baseImageUrl,
  baseImageDimensions,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onSaveLayerPlacement,
  onUploadDocument,
  zoom,
  setZoom,
  pan,
  setPan,
  pdfCurrentPage = 1,
  pdfTotalPages = 1,
  onSwitchPdfPage,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Drag interaction state
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    layerX: number;
    layerY: number;
    layerW: number;
    layerH: number;
    layerRot: number;
    aspectRatio: number;
    panX: number;
    panY: number;
    centerX: number;
    centerY: number;
  }>({
    clientX: 0,
    clientY: 0,
    layerX: 0,
    layerY: 0,
    layerW: 0,
    layerH: 0,
    layerRot: 0,
    aspectRatio: 1,
    panX: 0,
    panY: 0,
    centerX: 0,
    centerY: 0,
  });

  const selectedLayer = layers.find((l) => l.id === selectedLayerId && l.visible);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed && (e.target as HTMLElement).tagName !== 'INPUT') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setDragMode('none');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Handle Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prevZoom) => Math.min(3, Math.max(0.15, prevZoom * zoomFactor)));
  };

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (e.button === 1 || isSpacePressed || (e.target === containerRef.current)) {
      setDragMode('pan');
      dragStartRef.current.clientX = e.clientX;
      dragStartRef.current.clientY = e.clientY;
      dragStartRef.current.panX = pan.x;
      dragStartRef.current.panY = pan.y;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      if (e.target === containerRef.current && !isSpacePressed && e.button !== 1) {
        onSelectLayer(null);
      }
    }
  };

  const handlePointerDownLayer = (e: React.PointerEvent, layer: Layer, mode: DragMode) => {
    e.stopPropagation();
    onSelectLayer(layer.id);

    if (layer.locked && mode !== 'none') return;

    setDragMode(mode);
    const container = containerRef.current;
    if (!container) return;

    const layerCenterDocX = layer.x + layer.width / 2;
    const layerCenterDocY = layer.y + layer.height / 2;

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
      layerW: layer.width,
      layerH: layer.height,
      layerRot: layer.rotation || 0,
      aspectRatio: layer.aspectRatio || layer.width / layer.height || 1,
      panX: pan.x,
      panY: pan.y,
      centerX: layerCenterDocX,
      centerY: layerCenterDocY,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === 'none') return;

    if (dragMode === 'pan') {
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
      return;
    }

    if (!selectedLayer || selectedLayer.locked) return;

    const dx = (e.clientX - dragStartRef.current.clientX) / zoom;
    const dy = (e.clientY - dragStartRef.current.clientY) / zoom;

    if (dragMode === 'move') {
      let newX = dragStartRef.current.layerX + dx;
      let newY = dragStartRef.current.layerY + dy;

      const centerX = baseImageDimensions.width / 2;
      const centerY = baseImageDimensions.height / 2;
      const layerCenterX = newX + selectedLayer.width / 2;
      const layerCenterY = newY + selectedLayer.height / 2;

      if (Math.abs(layerCenterX - centerX) < 10) {
        newX = centerX - selectedLayer.width / 2;
      }
      if (Math.abs(layerCenterY - centerY) < 10) {
        newY = centerY - selectedLayer.height / 2;
      }

      onUpdateLayer(selectedLayer.id, {
        x: Math.round(newX),
        y: Math.round(newY),
      });
    } else if (dragMode.startsWith('resize-')) {
      const startW = dragStartRef.current.layerW;
      const startH = dragStartRef.current.layerH;
      const startX = dragStartRef.current.layerX;
      const startY = dragStartRef.current.layerY;
      const aspect = dragStartRef.current.aspectRatio;

      let newW = startW;
      let newH = startH;
      let newX = startX;
      let newY = startY;

      if (dragMode === 'resize-se') {
        newW = Math.max(40, startW + dx);
        newH = newW / aspect;
      } else if (dragMode === 'resize-sw') {
        newW = Math.max(40, startW - dx);
        newH = newW / aspect;
        newX = startX + (startW - newW);
      } else if (dragMode === 'resize-ne') {
        newW = Math.max(40, startW + dx);
        newH = newW / aspect;
        newY = startY + (startH - newH);
      } else if (dragMode === 'resize-nw') {
        newW = Math.max(40, startW - dx);
        newH = newW / aspect;
        newX = startX + (startW - newW);
        newY = startY + (startH - newH);
      } else if (dragMode === 'resize-e') {
        newW = Math.max(40, startW + dx);
      } else if (dragMode === 'resize-w') {
        newW = Math.max(40, startW - dx);
        newX = startX + (startW - newW);
      } else if (dragMode === 'resize-s') {
        newH = Math.max(40, startH + dy);
      } else if (dragMode === 'resize-n') {
        newH = Math.max(40, startH - dy);
        newY = startY + (startH - newH);
      }

      onUpdateLayer(selectedLayer.id, {
        width: Math.round(newW),
        height: Math.round(newH),
        x: Math.round(newX),
        y: Math.round(newY),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragMode !== 'none') {
      setDragMode('none');
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if already released
      }
    }
  };

  const rotateBy = (angleDelta: number) => {
    if (!selectedLayer) return;
    const currentRot = selectedLayer.rotation || 0;
    const nextRot = (currentRot + angleDelta + 360) % 360;
    onUpdateLayer(selectedLayer.id, { rotation: nextRot });
  };

  const handleTriggerSavePlacement = () => {
    if (!selectedLayer) return;
    onSaveLayerPlacement(selectedLayer);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDownCanvas}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center select-none bg-zinc-100 ${
        isSpacePressed || dragMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Zoom Toolbar overlay */}
      <div className="absolute bottom-5 right-5 z-30 bg-white/90 backdrop-blur-md border border-zinc-200 p-1.5 rounded-2xl shadow-xl flex items-center gap-1 text-zinc-800">
        <button
          onClick={() => setZoom((z) => Math.max(0.15, z / 1.15))}
          className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
          title="ย่อขนาด"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(0.75);
            setPan({ x: 0, y: 0 });
          }}
          className="px-2 py-1 text-xs font-mono font-bold text-zinc-700 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
          title="รีเซ็ตเป็น 75%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.15))}
          className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
          title="ขยายขนาด"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        <button
          onClick={() => {
            if (!containerRef.current || baseImageDimensions.width === 0) return;
            const containerW = containerRef.current.clientWidth - 80;
            const containerH = containerRef.current.clientHeight - 80;
            const fitZoom = Math.min(
              containerW / baseImageDimensions.width,
              containerH / baseImageDimensions.height,
              1
            );
            setZoom(fitZoom);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
          title="พอดีหน้าจอ"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* PDF Page Pagination Toolbar */}
      {pdfTotalPages > 1 && (
        <div className="absolute bottom-5 left-5 z-30 bg-white/95 backdrop-blur-md border border-zinc-200 px-3 py-2 rounded-2xl shadow-xl flex items-center gap-3 text-zinc-800">
          <span className="text-xs font-bold text-zinc-700">หน้า PDF:</span>
          <button
            onClick={() => onSwitchPdfPage && onSwitchPdfPage(pdfCurrentPage - 1)}
            disabled={pdfCurrentPage <= 1}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer transition"
          >
            ก่อนหน้า
          </button>
          <span className="text-xs font-mono font-bold text-red-600">
            {pdfCurrentPage} / {pdfTotalPages}
          </span>
          <button
            onClick={() => onSwitchPdfPage && onSwitchPdfPage(pdfCurrentPage + 1)}
            disabled={pdfCurrentPage >= pdfTotalPages}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer transition"
          >
            ถัดไป
          </button>
        </div>
      )}

      {/* Transform Container or Empty State */}
      {baseImageUrl ? (
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            width: baseImageDimensions.width,
            height: baseImageDimensions.height,
          }}
          className="relative shrink-0 transition-transform duration-75 shadow-2xl rounded-sm"
        >
          <img
            src={baseImageUrl}
            alt="Uploaded Base Document"
            draggable={false}
            className="w-full h-full block object-contain select-none shadow-2xl border border-zinc-300 bg-white"
          />

          {layers.map((layer) => {
            if (!layer.visible) return null;
            const isSelected = layer.id === selectedLayerId;

            return (
              <div
                key={layer.id}
                style={{
                  position: 'absolute',
                  left: `${layer.x}px`,
                  top: `${layer.y}px`,
                  width: `${layer.width}px`,
                  height: `${layer.height}px`,
                  transform: `rotate(${layer.rotation}deg)`,
                  transformOrigin: 'center center',
                  zIndex: isSelected ? 20 : 10,
                }}
                onPointerDown={(e) => handlePointerDownLayer(e, layer, 'move')}
                className={`group select-none ${
                  layer.locked ? 'cursor-not-allowed' : 'cursor-move'
                }`}
              >
                <div
                  style={{
                    opacity: layer.opacity,
                    mixBlendMode: layer.blendMode,
                    transform: `scale(${layer.flipX ? -1 : 1}, ${layer.flipY ? -1 : 1})`,
                  }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <img
                    src={layer.imageUrl}
                    alt={layer.name}
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                  />
                </div>

                {/* Selection Border & Resize Handles */}
                {isSelected && !layer.locked && (
                  <>
                    <div className="absolute inset-0 border-2 border-red-600 bg-red-600/5 pointer-events-none rounded-xs" />
                    
                    {/* Corner Resize Handles */}
                    <div
                      onPointerDown={(e) => handlePointerDownLayer(e, layer, 'resize-nw')}
                      className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-full cursor-nwse-resize shadow"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDownLayer(e, layer, 'resize-ne')}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-full cursor-nesw-resize shadow"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDownLayer(e, layer, 'resize-se')}
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-full cursor-nwse-resize shadow"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDownLayer(e, layer, 'resize-sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-red-600 rounded-full cursor-nesw-resize shadow"
                    />

                    {/* Edge Resize Handles */}
                    <div
                      onPointerDown={(e) => handlePointerDownLayer(e, layer, 'resize-n')}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-red-600 rounded-sm cursor-ns-resize shadow"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDownLayer(e, layer, 'resize-s')}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-red-600 rounded-sm cursor-ns-resize shadow"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDownLayer(e, layer, 'resize-w')}
                      className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-red-600 rounded-sm cursor-ew-resize shadow"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDownLayer(e, layer, 'resize-e')}
                      className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-red-600 rounded-sm cursor-ew-resize shadow"
                    />
                  </>
                )}

                {isSelected && layer.locked && (
                  <div className="absolute inset-0 border-2 border-amber-500/80 pointer-events-none flex items-center justify-center">
                    <div className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow">
                      <Lock className="w-3 h-3" /> ล็อกอยู่
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          onClick={onUploadDocument}
          className="border-2 border-dashed border-red-200 hover:border-red-500 bg-white hover:bg-red-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition text-center max-w-md shadow-lg group"
        >
          <div className="w-20 h-20 rounded-3xl bg-red-50 group-hover:bg-red-100 text-red-600 flex items-center justify-center mb-5 border border-red-200 transition group-hover:scale-105 shadow-sm">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            อัปโหลดเอกสาร PDF หรือรูปภาพที่ต้องการประทับตรา / เซ็นชื่อ
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed mb-4 max-w-xs">
            คลิกที่นี่ หรือลากไฟล์ PDF หรือภาพ (JPG, PNG) มาวางบนหน้าจอเพื่อเริ่มแก้ไข
          </p>
          <span className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 group-hover:bg-red-700 shadow-md shadow-red-600/25 transition">
            เลือกไฟล์จากเครื่อง
          </span>
        </div>
      )}

      {/* Floating Property Toolbar when a layer is selected */}
      {selectedLayer && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-5 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-zinc-200 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-150 flex-wrap justify-center text-zinc-800"
        >
          <span className="text-xs font-bold text-zinc-900 max-w-[120px] truncate border-r border-zinc-200 pr-3">
            {selectedLayer.name}
          </span>

          {/* Remember Position & Size Button */}
          <button
            onClick={handleTriggerSavePlacement}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              savedFeedback
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
            }`}
            title="บันทึกขนาดและพิกัดตำแหน่งนี้ เพื่อให้ระบบจดจำไว้ใช้งานครั้งหน้า"
          >
            {savedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>จดจำเรียบร้อย!</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>จดจำขนาด & ตำแหน่งนี้</span>
              </>
            )}
          </button>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2 pr-2 border-r border-zinc-200">
            <span className="text-[11px] font-medium text-zinc-500">โปร่งใส:</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={selectedLayer.opacity}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })
              }
              className="w-14 accent-red-600 cursor-pointer"
            />
          </div>

          {/* Blend Mode Toggle */}
          <button
            onClick={() =>
              onUpdateLayer(selectedLayer.id, {
                blendMode: selectedLayer.blendMode === 'multiply' ? 'normal' : 'multiply',
              })
            }
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
              selectedLayer.blendMode === 'multiply'
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
            }`}
            title="โหมดหมึกกลืนกระดาษ (Multiply)"
          >
            หมึกกลืนกระดาษ
          </button>

          {/* Quick Rotate Buttons */}
          <div className="flex items-center gap-1 pr-2 border-r border-zinc-200">
            <button
              onClick={() => rotateBy(-90)}
              className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              title="หมุนซ้าย 90°"
            >
              <RotateCw className="w-3.5 h-3.5 -scale-x-100" />
            </button>
            <span className="text-[11px] font-mono font-bold text-zinc-800 min-w-8 text-center">
              {selectedLayer.rotation || 0}°
            </span>
            <button
              onClick={() => rotateBy(90)}
              className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              title="หมุนขวา 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Flip H / V */}
          <div className="flex items-center gap-1 pr-2 border-r border-zinc-200">
            <button
              onClick={() =>
                onUpdateLayer(selectedLayer.id, { flipX: !selectedLayer.flipX })
              }
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                selectedLayer.flipX
                  ? 'bg-red-100 text-red-700'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="พลิกแนวนอน"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onUpdateLayer(selectedLayer.id, { flipY: !selectedLayer.flipY })
              }
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                selectedLayer.flipY
                  ? 'bg-red-100 text-red-700'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="พลิกแนวตั้ง"
            >
              <FlipVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lock / Duplicate / Delete */}
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                onUpdateLayer(selectedLayer.id, { locked: !selectedLayer.locked })
              }
              className="p-1.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              title={selectedLayer.locked ? 'ปลดล็อก' : 'ล็อกตำแหน่ง'}
            >
              {selectedLayer.locked ? (
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => onDuplicateLayer(selectedLayer.id)}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              title="ทำซ้ำ"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteLayer(selectedLayer.id)}
              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
              title="ลบ"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

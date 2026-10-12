import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Trash2, Check, X, BookmarkCheck } from 'lucide-react';
import { cropTransparentCanvas } from '../utils/imageProcessing';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSignature: (
    dataUrl: string,
    width: number,
    height: number,
    name: string,
    saveToLibrary: boolean
  ) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onAddSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#dc2626'); // Red / Blue / Black
  const [lineWidth, setLineWidth] = useState(3.5);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [name, setName] = useState('ลายเซ็นของฉัน');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [history, setHistory] = useState<ImageData[]>([]);

  const colors = [
    { label: 'แดงชาดทางการ', value: '#dc2626' },
    { label: 'น้ำเงินปากกาหมึกซึม', value: '#1e3a8a' },
    { label: 'ดำมาตรฐาน', value: '#0f172a' },
    { label: 'น้ำเงินฟ้าคราม', value: '#0284c7' },
  ];

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setHasDrawn(false);
    setHistory([]);
  }, [isOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
  }, [color, lineWidth]);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), imgData]);
  };

  const undoLastStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    const previous = newHistory.pop();
    setHistory(newHistory);

    if (previous) {
      ctx.putImageData(previous, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setHistory([]);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    saveHistoryState();
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getCoordinates(e);
    lastPos.current = pos;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos.current) return;

    const midX = (lastPos.current.x + pos.x) / 2;
    const midY = (lastPos.current.y + pos.y) / 2;

    ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, midX, midY);
    ctx.stroke();

    lastPos.current = pos;
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const cropped = cropTransparentCanvas(canvas);
    const dataUrl = cropped.toDataURL('image/png');
    onAddSignature(dataUrl, cropped.width, cropped.height, name.trim() || 'ลายเซ็น', saveToLibrary);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-2xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">วาดลายเซ็นสด (Draw Signature)</h2>
              <p className="text-xs text-zinc-500">วาดลายมือชื่อด้วยเมาส์หรือทัชสกรีน ตัดขอบว่างให้อัตโนมัติ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Pad */}
        <div className="p-6 flex flex-col gap-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-zinc-300 bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-60 touch-none cursor-crosshair block"
              style={{ background: '#ffffff' }}
            />

            <div className="absolute bottom-14 left-12 right-12 border-b border-zinc-200 pointer-events-none flex justify-between items-end pb-1">
              <span className="text-[11px] font-sans text-zinc-400 select-none">
                ✕ เซ็นชื่อบนเส้นนี้ (Sign on this line)
              </span>
            </div>

            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-zinc-400 text-sm font-sans flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border border-zinc-200 shadow-xs">
                  <PenTool className="w-4 h-4 text-red-500" />
                  ลากเมาส์หรือใช้นิ้วจรดที่นี่เพื่อเริ่มเซ็น
                </p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600 font-semibold">สีหมึก:</span>
              <div className="flex items-center gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    title={c.label}
                    className={`w-6 h-6 rounded-full transition-all border-2 cursor-pointer ${
                      color === c.value
                        ? 'border-white scale-110 shadow-md ring-2 ring-red-500'
                        : 'border-transparent hover:scale-105 opacity-80'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 font-semibold">ขนาดเส้น:</span>
              <input
                type="range"
                min="1.5"
                max="8"
                step="0.5"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseFloat(e.target.value))}
                className="w-24 accent-red-600 cursor-pointer"
              />
              <span className="text-xs text-zinc-700 w-7 font-mono font-bold">{lineWidth}px</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={undoLastStroke}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ย้อนกลับ
              </button>
              <button
                onClick={clearCanvas}
                disabled={!hasDrawn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้าง
              </button>
            </div>
          </div>

          {/* Name & Cloud save toggle */}
          <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-zinc-600 whitespace-nowrap">ชื่อลายเซ็น:</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ลายเซ็นทางการ"
                className="bg-white border border-zinc-300 rounded-xl px-3 py-1 text-xs text-zinc-900 flex-1 focus:outline-none focus:border-red-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                className="rounded accent-red-600 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-red-700 font-bold">
                <BookmarkCheck className="w-3.5 h-3.5 text-red-600" />
                บันทึกลงคลังคลาวด์ไว้ใช้ซ้ำ
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/70 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleApply}
            disabled={!hasDrawn}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            นำไปประทับลงภาพ
          </button>
        </div>
      </div>
    </div>
  );
};

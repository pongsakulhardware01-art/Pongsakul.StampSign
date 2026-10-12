import React, { useState, useEffect } from 'react';
import { Type, Check, X, BookmarkCheck } from 'lucide-react';
import { cropTransparentCanvas } from '../utils/imageProcessing';

interface TextSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTextSignature: (
    dataUrl: string,
    name: string,
    width: number,
    height: number,
    saveToLibrary: boolean
  ) => void;
}

export const TextSignatureModal: React.FC<TextSignatureModalProps> = ({
  isOpen,
  onClose,
  onAddTextSignature,
}) => {
  const [text, setText] = useState<string>('สมศักดิ์ มุ่งมั่นเจริญ');
  const [subText, setSubText] = useState<string>('(กรรมการผู้จัดการ)');
  const [fontFamily, setFontFamily] = useState<string>('Charm');
  const [color, setColor] = useState<string>('#dc2626'); // Red default
  const [includeLine, setIncludeLine] = useState<boolean>(true);
  const [includeDate, setIncludeDate] = useState<boolean>(false);
  const [saveToLibrary, setSaveToLibrary] = useState<boolean>(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const fonts = [
    { label: 'Charm (ชาม - ลายมือไทยพริ้วไหว)', value: 'Charm', className: 'font-charm' },
    { label: 'Mali (มะลิ - ลายมือเป็นกันเอง)', value: 'Mali', className: 'font-mali' },
    { label: 'Alex Brush (ลายเซ็นสากลหรูหรา)', value: 'Alex Brush', className: 'font-brush' },
    { label: 'Caveat (ปากกาหมึกซึม)', value: 'Caveat', className: 'font-caveat' },
  ];

  const colors = [
    { label: 'แดงชาด', value: '#dc2626' },
    { label: 'น้ำเงินปากกาหมึกซึม', value: '#1e3a8a' },
    { label: 'ดำมาตรฐาน', value: '#18181b' },
  ];

  useEffect(() => {
    if (!isOpen || !text) return;
    renderTextToDataUrl();
  }, [isOpen, text, subText, fontFamily, color, includeLine, includeDate]);

  const renderTextToDataUrl = (): { dataUrl: string; width: number; height: number } | null => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = canvas.width / 2;
    let mainY = canvas.height * 0.38;

    ctx.font = `64px '${fontFamily}', sans-serif`;
    ctx.fillText(text, cx, mainY);

    if (includeLine) {
      const metrics = ctx.measureText(text);
      const lineWidth = Math.max(220, metrics.width * 1.05);
      const lineY = mainY + 38;

      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - lineWidth / 2, lineY);
      ctx.quadraticCurveTo(cx, lineY + 6, cx + lineWidth / 2, lineY - 2);
      ctx.stroke();
    }

    let currentY = mainY + 64;
    if (subText.trim()) {
      ctx.font = '24px Sarabun, sans-serif';
      ctx.fillText(subText, cx, currentY);
      currentY += 32;
    }

    if (includeDate) {
      const today = new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      ctx.font = '20px Sarabun, sans-serif';
      ctx.fillText(`วันที่ ${today}`, cx, currentY);
    }

    const cropped = cropTransparentCanvas(canvas);
    const url = cropped.toDataURL('image/png');
    setPreviewUrl(url);
    return { dataUrl: url, width: cropped.width, height: cropped.height };
  };

  const handleApply = () => {
    const rendered = renderTextToDataUrl();
    if (!rendered) return;
    onAddTextSignature(rendered.dataUrl, text, rendered.width, rendered.height, saveToLibrary);
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
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">สร้างลายเซ็นข้อความ (Text Signature)</h2>
              <p className="text-xs text-zinc-500">พิมพ์ชื่อพร้อมเลือกฟอนต์ลายมือภาษาไทย/อังกฤษ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          <div>
            <span className="block text-xs font-bold text-zinc-700 mb-1.5">ตัวอย่างลายเซ็น:</span>
            <div className="h-36 rounded-2xl bg-white border-2 border-dashed border-zinc-300 flex items-center justify-center p-4 relative overflow-hidden shadow-inner">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Signature Preview"
                  className="max-h-full max-w-full object-contain filter drop-shadow-xs select-none"
                />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ชื่อลายเซ็น:
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="พิมพ์ชื่อ..."
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ตำแหน่ง / ข้อความกำกับ:
              </label>
              <input
                type="text"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                placeholder="เช่น (กรรมการผู้จัดการ)"
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">รูปแบบฟอนต์:</label>
              <div className="grid grid-cols-2 gap-2">
                {fonts.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFontFamily(f.value)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs cursor-pointer ${
                      fontFamily === f.value
                        ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <span className={`text-sm ${f.className}`}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-600">สีหมึก:</span>
                <div className="flex items-center gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                        color === c.value ? 'border-white scale-110 shadow-sm ring-2 ring-red-500' : 'border-transparent opacity-80'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-red-700 font-bold">
                <input
                  type="checkbox"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                />
                <BookmarkCheck className="w-3.5 h-3.5 text-red-600" />
                บันทึกลงคลังคลาวด์
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/70 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleApply}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            นำไปประทับลงภาพ
          </button>
        </div>
      </div>
    </div>
  );
};

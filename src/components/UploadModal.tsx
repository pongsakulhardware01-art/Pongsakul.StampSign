import React, { useState, useRef } from 'react';
import { Upload, Wand2, X, Check, BookmarkCheck } from 'lucide-react';
import { processUploadedSignature } from '../utils/imageProcessing';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLayer: (
    dataUrl: string,
    name: string,
    width: number,
    height: number,
    saveToLibrary: boolean
  ) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddLayer,
}) => {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('ตราปั๊ม/ลายเซ็นของฉัน');
  const [removeBg, setRemoveBg] = useState<boolean>(true);
  const [whiteThreshold, setWhiteThreshold] = useState<number>(205);
  const [tintColor, setTintColor] = useState<string>('none');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saveToLibrary, setSaveToLibrary] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const colors = [
    { label: 'สีเดิมของภาพ', value: 'none' },
    { label: 'แดงชาด', value: '#dc2626' },
    { label: 'น้ำเงินหมึกซึม', value: '#1e40af' },
    { label: 'ดำเข้ม', value: '#18181b' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOriginalUrl(result);
      applyProcessing(result, removeBg, whiteThreshold, tintColor);
    };
    reader.readAsDataURL(file);
  };

  const applyProcessing = async (
    sourceUrl: string,
    bgRemoval: boolean,
    thresh: number,
    color: string
  ) => {
    setIsProcessing(true);
    try {
      const output = await processUploadedSignature(sourceUrl, {
        removeBackground: bgRemoval,
        whiteThreshold: thresh,
        smoothness: 25,
        tintColor: color === 'none' ? null : color,
      });
      setProcessedUrl(output);
    } catch (err) {
      console.error('Failed to process image', err);
      setProcessedUrl(sourceUrl);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThresholdChange = (val: number) => {
    setWhiteThreshold(val);
    if (originalUrl) {
      applyProcessing(originalUrl, removeBg, val, tintColor);
    }
  };

  const handleBgToggle = (enabled: boolean) => {
    setRemoveBg(enabled);
    if (originalUrl) {
      applyProcessing(originalUrl, enabled, whiteThreshold, tintColor);
    }
  };

  const handleColorChange = (col: string) => {
    setTintColor(col);
    if (originalUrl) {
      applyProcessing(originalUrl, removeBg, whiteThreshold, col);
    }
  };

  const handleConfirm = () => {
    const finalUrl = processedUrl || originalUrl;
    if (!finalUrl) return;

    const img = new Image();
    img.onload = () => {
      onAddLayer(
        finalUrl,
        fileName.trim() || 'ไฟล์ที่อัปโหลด',
        img.naturalWidth || 400,
        img.naturalHeight || 300,
        saveToLibrary
      );
      handleClose();
    };
    img.src = finalUrl;
  };

  const handleClose = () => {
    setOriginalUrl(null);
    setProcessedUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">อัปโหลดตราปั๊มหรือลายเซ็น (Upload File)</h2>
              <p className="text-xs text-zinc-500">ตัดพื้นหลังกระดาษขาวอัตโนมัติ และบันทึกลงคลังคลาวด์</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!originalUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-red-200 hover:border-red-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer bg-red-50/20 hover:bg-red-50/40 transition group text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 group-hover:bg-red-100 text-red-600 flex items-center justify-center mb-4 border border-red-200 transition group-hover:scale-105 shadow-2xs">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-zinc-900 mb-1">
                คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ภาพมาวางที่นี่
              </p>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                ถ่ายรูปภาพลายเซ็นหรือตราประทับบนกระดาษ แล้วนำมาอัปโหลดได้เลย ระบบจะตัดพื้นหลังขาวออกให้คมชัด
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-zinc-600">รูปต้นฉบับ:</span>
                  <div className="h-40 bg-zinc-100 rounded-2xl border border-zinc-200 p-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-zinc-600">ผลลัพธ์ (โปร่งใส):</span>
                  <div className="h-40 bg-checkerboard rounded-2xl border border-zinc-200 p-2 flex items-center justify-center overflow-hidden">
                    {processedUrl && (
                      <img
                        src={processedUrl}
                        alt="Processed"
                        className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Editing Controls */}
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold text-zinc-800">ตัดพื้นหลังกระดาษขาวอัตโนมัติ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={removeBg}
                    onChange={(e) => handleBgToggle(e.target.checked)}
                    className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                  />
                </div>

                {removeBg && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
                      <span>ความเข้มข้นของการลบสีขาว:</span>
                      <span className="font-mono font-bold text-zinc-800">{whiteThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="120"
                      max="250"
                      value={whiteThreshold}
                      onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Tint Color */}
                <div>
                  <span className="block text-xs font-bold text-zinc-700 mb-1.5">
                    เปลี่ยนสีหมึก:
                  </span>
                  <div className="flex items-center gap-2">
                    {colors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleColorChange(c.value)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                          tintColor === c.value
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {c.value !== 'none' && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: c.value }}
                          />
                        )}
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Asset Name & Cloud Save Toggle */}
              <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-zinc-600 whitespace-nowrap">ชื่อรายการ:</span>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="เช่น ตราประทับฝ่ายบัญชี"
                    className="bg-white border border-zinc-300 rounded-xl px-3 py-1 text-xs text-zinc-900 flex-1 focus:outline-none focus:border-red-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-red-700 font-bold select-none">
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/70 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!originalUrl}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            นำไปแปะลงบนภาพ
          </button>
        </div>
      </div>
    </div>
  );
};

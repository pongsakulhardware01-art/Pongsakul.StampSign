import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, X, FileImage, ShieldCheck, Loader2 } from 'lucide-react';
import { Layer } from '../types';
import { compositeFullResolution } from '../utils/imageProcessing';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImageUrl: string;
  layers: Layer[];
  baseImageName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  baseImageUrl,
  layers,
  baseImageName,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState<number>(0.95);
  const [exportDataUrl, setExportDataUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !baseImageUrl) return;

    let isMounted = true;
    setIsGenerating(true);

    compositeFullResolution(baseImageUrl, layers, format, quality)
      .then((res) => {
        if (!isMounted) return;
        setExportDataUrl(res.dataUrl);
        setDimensions({ width: res.width, height: res.height });
        setFileSizeBytes(res.blob.size);
      })
      .catch((err) => {
        console.error('Export error', err);
      })
      .finally(() => {
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, baseImageUrl, layers, format, quality]);

  const handleDownload = () => {
    if (!exportDataUrl) return;
    const a = document.createElement('a');
    a.href = exportDataUrl;
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const cleanName = baseImageName.replace(/\.[^/.]+$/, '');
    a.download = `${cleanName}-stamped.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyToClipboard = async () => {
    if (!exportDataUrl) return;
    try {
      const res = await fetch(exportDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write error or not supported in iframe', err);
      alert('เบราว์เซอร์ไม่รองรับการคัดลอกลงคลิปบอร์ดโดยตรง กรุณาคลิกขวาที่ภาพตัวอย่างแล้วเลือก "คัดลอกรูปภาพ" หรือกดปุ่มดาวน์โหลด');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-2xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">บันทึกและดาวน์โหลดภาพ (Export High-Res)</h2>
              <p className="text-xs text-zinc-500">
                รวมตราปั๊มและลายเซ็นด้วยความละเอียดต้นฉบับสูงสุด 100%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Preview */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-zinc-100 rounded-2xl border border-zinc-200 p-4 min-h-[300px] relative overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <span className="text-xs font-semibold">กำลังเรนเดอร์ภาพความละเอียดสูง...</span>
              </div>
            ) : exportDataUrl ? (
              <div className="relative max-h-80 w-full flex items-center justify-center">
                <img
                  src={exportDataUrl}
                  alt="Final Export Preview"
                  className="max-h-80 max-w-full object-contain rounded-xl shadow-lg border border-zinc-300"
                />
              </div>
            ) : null}

            {/* Resolution Badge */}
            {!isGenerating && dimensions.width > 0 && (
              <div className="mt-3 flex items-center gap-2.5 text-[11px] text-zinc-600 font-mono">
                <span className="bg-white px-2.5 py-1 rounded-lg border border-zinc-200 font-bold">
                  ขนาด: {dimensions.width} × {dimensions.height} px
                </span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-zinc-200 font-bold">
                  ไฟล์: {formatFileSize(fileSizeBytes)}
                </span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="md:col-span-5 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-2">นามสกุลไฟล์ภาพ:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat('png')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      format === 'png'
                        ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-400'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="font-bold text-sm">PNG</div>
                    <div className="text-[11px] text-zinc-500">คมชัดสูงสุด ไม่เสียคุณภาพ</div>
                  </button>
                  <button
                    onClick={() => setFormat('jpeg')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      format === 'jpeg'
                        ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-400'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="font-bold text-sm">JPG / JPEG</div>
                    <div className="text-[11px] text-zinc-500">ไฟล์เล็ก เหมาะส่งไลน์/อีเมล</div>
                  </button>
                </div>
              </div>

              {format === 'jpeg' && (
                <div>
                  <div className="flex justify-between text-xs text-zinc-600 mb-1.5 font-semibold">
                    <span>คุณภาพรูปภาพ:</span>
                    <span className="font-mono text-zinc-900 font-bold">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>
              )}

              <div className="bg-red-50/60 p-3 rounded-2xl border border-red-100 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-zinc-600 leading-relaxed">
                  <span className="font-bold text-zinc-900">ความปลอดภัยสูงสุด:</span> การประมวลผลทำบนเบราว์เซอร์ของคุณโดยตรง เอกสารสำคัญจะไม่ถูกส่งไปยังเซิร์ฟเวอร์ภายนอก
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleDownload}
                disabled={isGenerating || !exportDataUrl}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลดรูปภาพ ({format.toUpperCase()})
              </button>

              <button
                onClick={handleCopyToClipboard}
                disabled={isGenerating || !exportDataUrl}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">คัดลอกลงคลิปบอร์ดแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    คัดลอกภาพไปยังคลิปบอร์ด
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

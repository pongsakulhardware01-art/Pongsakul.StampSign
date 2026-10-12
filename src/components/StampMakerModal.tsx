import React, { useState, useEffect } from 'react';
import { Stamp, Sparkles, Sliders, Check, X, RefreshCw, BookmarkCheck } from 'lucide-react';
import { StampConfig } from '../types';
import { generateStampDataUrl } from '../utils/stampGenerator';

interface StampMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStamp: (
    dataUrl: string,
    name: string,
    saveToLibrary: boolean
  ) => void;
}

interface PresetOption {
  id: string;
  name: string;
  config: StampConfig;
}

export const StampMakerModal: React.FC<StampMakerModalProps> = ({
  isOpen,
  onClose,
  onAddStamp,
}) => {
  const todayFormatted = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const presets: PresetOption[] = [
    {
      id: 'approved-circle',
      name: 'อนุมัติแล้ว (APPROVED)',
      config: {
        shape: 'circle',
        title: 'บริษัท นานาเจริญ จำกัด',
        subtitle: 'BANGKOK THAILAND',
        centerText: 'APPROVED',
        dateText: todayFormatted,
        color: '#dc2626',
        hasGrunge: true,
        grungeIntensity: 0.4,
        borderWidth: 8,
        doubleBorder: true,
        starOrnaments: true,
        fontFamily: 'Prompt, sans-serif',
      },
    },
    {
      id: 'certified-copy',
      name: 'สำเนาถูกต้อง',
      config: {
        shape: 'rounded-rect',
        title: 'สำเนาถูกต้อง',
        subtitle: 'ใช้สำหรับติดต่องานเท่านั้น',
        centerText: '',
        dateText: todayFormatted,
        color: '#dc2626',
        hasGrunge: true,
        grungeIntensity: 0.35,
        borderWidth: 6,
        doubleBorder: true,
        starOrnaments: false,
        fontFamily: 'Prompt, sans-serif',
      },
    },
    {
      id: 'paid-stamp',
      name: 'จ่ายเงินแล้ว / PAID',
      config: {
        shape: 'rounded-rect',
        title: 'PAID / จ่ายแล้ว',
        subtitle: 'RECEIVED PAYMENT',
        centerText: '',
        dateText: todayFormatted,
        color: '#dc2626',
        hasGrunge: true,
        grungeIntensity: 0.4,
        borderWidth: 7,
        doubleBorder: true,
        starOrnaments: false,
        fontFamily: 'Prompt, sans-serif',
      },
    },
    {
      id: 'inspection-passed',
      name: 'ตรวจรับเรียบร้อย (PASSED)',
      config: {
        shape: 'circle',
        title: 'ฝ่ายควบคุมคุณภาพและพัสดุ',
        subtitle: 'QUALITY ASSURANCE',
        centerText: 'PASSED',
        dateText: todayFormatted,
        color: '#b91c1c',
        hasGrunge: true,
        grungeIntensity: 0.3,
        borderWidth: 7,
        doubleBorder: true,
        starOrnaments: true,
        fontFamily: 'Prompt, sans-serif',
      },
    },
    {
      id: 'confidential',
      name: 'ลับเฉพาะ (CONFIDENTIAL)',
      config: {
        shape: 'rect',
        title: 'ลับเฉพาะ / CONFIDENTIAL',
        subtitle: 'DO NOT DISCLOSE',
        centerText: '',
        dateText: '',
        color: '#dc2626',
        hasGrunge: true,
        grungeIntensity: 0.45,
        borderWidth: 8,
        doubleBorder: true,
        starOrnaments: false,
        fontFamily: 'Prompt, sans-serif',
      },
    },
    {
      id: 'date-badge-today',
      name: 'ตราวันที่ตรวจรับ',
      config: {
        shape: 'date-badge',
        title: 'ตรวจรับเอกสารแล้ว',
        subtitle: '',
        centerText: '',
        dateText: todayFormatted,
        color: '#dc2626',
        hasGrunge: false,
        grungeIntensity: 0,
        borderWidth: 6,
        doubleBorder: false,
        starOrnaments: false,
        fontFamily: 'Prompt, sans-serif',
      },
    },
  ];

  const [activeTab, setActiveTab] = useState<'custom' | 'presets'>('custom');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('approved-circle');
  const [saveToLibrary, setSaveToLibrary] = useState<boolean>(true);

  const [customConfig, setCustomConfig] = useState<StampConfig>({
    shape: 'circle',
    title: 'บริษัท ของฉัน จำกัด',
    subtitle: 'BANGKOK THAILAND',
    centerText: 'APPROVED',
    dateText: todayFormatted,
    color: '#dc2626',
    hasGrunge: true,
    grungeIntensity: 0.35,
    borderWidth: 7,
    doubleBorder: true,
    starOrnaments: true,
    fontFamily: 'Prompt, sans-serif',
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');

  const colors = [
    { label: 'แดงชาด (ยอดนิยม)', value: '#dc2626' },
    { label: 'แดงเลือดหมู', value: '#991b1b' },
    { label: 'น้ำเงินทางการ', value: '#1e40af' },
    { label: 'ดำมาตรฐาน', value: '#18181b' },
  ];

  const activeConfig =
    activeTab === 'presets'
      ? presets.find((p) => p.id === selectedPresetId)?.config || presets[0].config
      : customConfig;

  useEffect(() => {
    if (!isOpen) return;
    try {
      const url = generateStampDataUrl(activeConfig, 500);
      setPreviewUrl(url);
    } catch (e) {
      console.error('Error generating stamp preview', e);
    }
  }, [isOpen, activeTab, selectedPresetId, customConfig]);

  const handleApply = () => {
    if (!previewUrl) return;
    const name =
      activeTab === 'presets'
        ? presets.find((p) => p.id === selectedPresetId)?.name || 'ตราประทับ'
        : customConfig.title || 'ตราประทับกำหนดเอง';
    onAddStamp(previewUrl, name, saveToLibrary);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-2xs">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">ตราประทับยาง / ตราปั๊ม (Rubber Stamp Maker)</h2>
              <p className="text-xs text-zinc-500">สร้างตราวงกลมบริษัท หรือสี่เหลี่ยมทางการ พร้อมเอฟเฟกต์หมึกยางจริง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 flex gap-2 border-b border-zinc-200 bg-white">
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'custom'
                ? 'border-red-600 text-red-600 bg-red-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <Sliders className="w-4 h-4 text-red-500" />
            ออกแบบตราประทับเอง (Custom Design)
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-red-600 text-red-600 bg-red-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-red-500" />
            ตราประทับตัวอย่างยอดนิยม
          </button>
        </div>

        {/* Body Grid */}
        <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Form */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {activeTab === 'presets' ? (
              <div className="grid grid-cols-2 gap-2.5">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      selectedPresetId === preset.id
                        ? 'border-red-500 bg-red-50/70 ring-1 ring-red-400'
                        : 'border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">{preset.name}</span>
                      <span
                        className="w-3 h-3 rounded-full border border-zinc-300"
                        style={{ backgroundColor: preset.config.color }}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {preset.config.shape === 'circle' ? 'ทรงกลม' : 'สี่เหลี่ยม'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">รูปทรงตราปั๊ม:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'circle', label: 'วงกลม' },
                      { id: 'rounded-rect', label: 'สี่เหลี่ยมมน' },
                      { id: 'rect', label: 'สี่เหลี่ยมมุมฉาก' },
                      { id: 'date-badge', label: 'กล่องวันที่' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCustomConfig({ ...customConfig, shape: s.id as any })}
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition cursor-pointer ${
                          customConfig.shape === s.id
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      {customConfig.shape === 'circle' ? 'ข้อความขอบบน (ชื่อบริษัท/องค์กร):' : 'ข้อความหลัก:'}
                    </label>
                    <input
                      type="text"
                      value={customConfig.title}
                      onChange={(e) => setCustomConfig({ ...customConfig, title: e.target.value })}
                      placeholder="เช่น บริษัท นานาเจริญ จำกัด"
                      className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {customConfig.shape === 'circle' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          ข้อความขอบล่าง (สถานที่/จังหวัด):
                        </label>
                        <input
                          type="text"
                          value={customConfig.subtitle || ''}
                          onChange={(e) => setCustomConfig({ ...customConfig, subtitle: e.target.value })}
                          placeholder="เช่น BANGKOK THAILAND"
                          className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          ข้อความตรงกลาง (Center Text):
                        </label>
                        <input
                          type="text"
                          value={customConfig.centerText || ''}
                          onChange={(e) => setCustomConfig({ ...customConfig, centerText: e.target.value })}
                          placeholder="เช่น APPROVED หรือ อนุมัติแล้ว"
                          className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </>
                  )}

                  {customConfig.shape !== 'circle' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        ข้อความแถวรอง (Subtitle):
                      </label>
                      <input
                        type="text"
                        value={customConfig.subtitle || ''}
                        onChange={(e) => setCustomConfig({ ...customConfig, subtitle: e.target.value })}
                        placeholder="เช่น ใช้สำหรับติดต่องานเท่านั้น"
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">วันที่ (Date):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customConfig.dateText || ''}
                        onChange={(e) => setCustomConfig({ ...customConfig, dateText: e.target.value })}
                        placeholder="เช่น 12 ต.ค. 2569"
                        className="flex-1 bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomConfig({ ...customConfig, dateText: todayFormatted })}
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 cursor-pointer"
                      >
                        วันนี้
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">สีน้ำหมึก:</label>
                  <div className="flex items-center gap-2">
                    {colors.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCustomConfig({ ...customConfig, color: c.value })}
                        title={c.label}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                          customConfig.color === c.value
                            ? 'border-white scale-110 shadow-md ring-2 ring-red-500'
                            : 'border-transparent hover:scale-105 opacity-80'
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700">เอฟเฟกต์หมึกปั๊มยางจริง:</span>
                    <input
                      type="checkbox"
                      checked={customConfig.hasGrunge}
                      onChange={(e) => setCustomConfig({ ...customConfig, hasGrunge: e.target.checked })}
                      className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-zinc-50/70 rounded-3xl border border-zinc-200 p-6">
            <span className="text-xs font-bold text-zinc-600 mb-3 self-start">ตัวอย่างผลลัพธ์:</span>
            <div className="w-60 h-60 rounded-2xl border-2 border-dashed border-zinc-300 bg-white shadow-sm flex items-center justify-center p-4 relative overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Stamp Preview"
                  className="max-w-full max-h-full object-contain filter drop-shadow-xs select-none"
                />
              ) : (
                <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
              )}
            </div>

            <div className="mt-4 w-full bg-white p-2.5 rounded-2xl border border-zinc-200 flex items-center justify-between shadow-2xs">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-red-700 font-bold">
                <input
                  type="checkbox"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                />
                <BookmarkCheck className="w-4 h-4 text-red-600" />
                บันทึกลงคลังคลาวด์ไว้ใช้ซ้ำ
              </label>
            </div>
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
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            เพิ่มตราปั๊มนี้ลงบนภาพ
          </button>
        </div>
      </div>
    </div>
  );
};

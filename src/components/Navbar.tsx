import React, { useRef } from 'react';
import {
  Stamp,
  PenTool,
  Upload,
  Type,
  Download,
  RotateCcw,
  RotateCw,
  FolderOpen,
  Layers,
  Cloud,
} from 'lucide-react';

interface NavbarProps {
  onOpenStampMaker: () => void;
  onOpenSignaturePad: () => void;
  onOpenUploadSignature: () => void;
  onOpenTextSignature: () => void;
  onUploadBaseImage: (file: File) => void;
  onOpenExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  toggleLayerPanel: () => void;
  isLayerPanelOpen: boolean;
  layerCount: number;
  toggleLibraryPanel: () => void;
  isLibraryPanelOpen: boolean;
  savedAssetsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStampMaker,
  onOpenSignaturePad,
  onOpenUploadSignature,
  onOpenTextSignature,
  onUploadBaseImage,
  onOpenExport,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  toggleLayerPanel,
  isLayerPanelOpen,
  layerCount,
  toggleLibraryPanel,
  isLibraryPanelOpen,
  savedAssetsCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleBaseImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBaseImage(file);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between shrink-0 z-40 select-none shadow-xs">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBaseImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Brand & Base Image Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-md shadow-red-600/25">
            <Stamp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
              StampSign <span className="text-red-600 font-extrabold text-xs">Cloud</span>
            </h1>
            <p className="text-[10px] text-zinc-500 hidden sm:block">แปะตราปั๊ม & เซ็นลายเซ็นพร้อมจดจำตำแหน่ง</p>
          </div>
        </div>

        <div className="h-6 w-px bg-zinc-200 mx-1 hidden sm:block" />

        {/* Change / Upload Base Document Image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20 transition active:scale-95 cursor-pointer"
          title="อัปโหลดรูปภาพที่ต้องการประทับตรา"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>อัปโหลดภาพเอกสาร</span>
        </button>

        {/* Cloud Library Toggle */}
        <button
          onClick={toggleLibraryPanel}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            isLibraryPanelOpen
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:text-red-600 hover:bg-zinc-100 hover:border-zinc-300'
          }`}
          title="เปิด/ปิด คลังลายเซ็นและตราปั๊ม"
        >
          <Cloud className="w-3.5 h-3.5 text-red-500" />
          <span>คลังที่บันทึก</span>
          <span className="bg-white px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold text-red-600 border border-red-200">
            {savedAssetsCount}
          </span>
        </button>
      </div>

      {/* Center Tool Buttons */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl border border-zinc-200/80">
        <button
          onClick={onOpenStampMaker}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-red-600 hover:bg-white hover:shadow-xs transition cursor-pointer"
          title="สร้างตราประทับยางใหม่"
        >
          <Stamp className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden sm:inline">ตราปั๊ม</span>
        </button>

        <button
          onClick={onOpenSignaturePad}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-red-600 hover:bg-white hover:shadow-xs transition cursor-pointer"
          title="วาดลายเซ็นสด"
        >
          <PenTool className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden sm:inline">วาดลายเซ็น</span>
        </button>

        <button
          onClick={onOpenUploadSignature}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-red-600 hover:bg-white hover:shadow-xs transition cursor-pointer"
          title="อัปโหลดภาพลายเซ็นหรือตราปั๊ม"
        >
          <Upload className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden md:inline">อัปโหลดไฟล์</span>
        </button>

        <button
          onClick={onOpenTextSignature}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-red-600 hover:bg-white hover:shadow-xs transition cursor-pointer"
          title="พิมพ์ลายเซ็นข้อความ"
        >
          <Type className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden lg:inline">พิมพ์ชื่อ</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1 border-r border-zinc-200 pr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="ย้อนกลับ (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="ทำซ้ำ (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Layers Sidebar */}
        <button
          onClick={toggleLayerPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            isLayerPanelOpen
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          title="เปิด/ปิด แผงเลเยอร์"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-600" />
          <span className="hidden sm:inline">เลเยอร์</span>
          <span className="bg-white px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold text-zinc-800 border border-zinc-200">
            {layerCount}
          </span>
        </button>

        {/* Export / Download button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 transition active:scale-95 cursor-pointer"
          title="บันทึกและดาวน์โหลดภาพความละเอียดสูง"
        >
          <Download className="w-4 h-4" />
          <span>บันทึกภาพ</span>
        </button>
      </div>
    </header>
  );
};

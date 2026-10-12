import React from 'react';
import { FilePlus2, X, AlertCircle } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  layerCount: number;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  layerCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs shadow-red-600/30">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                เคลียร์หน้างาน / เริ่มทำไฟล์ใหม่
              </h2>
              <p className="text-xs text-zinc-500">
                ล้างเอกสารปัจจุบันเพื่อเปิดไฟล์ภาพใหม่
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

        {/* Content */}
        <div className="p-6 space-y-3">
          <p className="text-sm text-zinc-700 leading-relaxed font-medium">
            คุณต้องการล้างภาพเอกสารปัจจุบัน {layerCount > 0 && `และตราประทับ/ลายเซ็นจำนวน ${layerCount} รายการบนจอ`} เพื่อเริ่มทำไฟล์ใหม่ใช่หรือไม่?
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>สบายใจได้:</strong> ตราประทับและลายเซ็นทั้งหมดที่บันทึกไว้ในคลังคลาวด์องค์กรทางซ้ายมือจะไม่หาย สามารถกดนำมาใช้กับไฟล์ใหม่ได้ทันที
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/70 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-100 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 transition active:scale-95 cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>ยืนยัน เคลียร์หน้างาน</span>
          </button>
        </div>
      </div>
    </div>
  );
};

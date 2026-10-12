import React from 'react';
import {
  Cloud,
  Trash2,
  BookmarkCheck,
  LogIn,
  LogOut,
  MousePointerClick,
  User as UserIcon,
} from 'lucide-react';
import { SavedAsset } from '../types';
import { User } from 'firebase/auth';

interface SavedAssetsSidebarProps {
  assets: SavedAsset[];
  user: User | null;
  onOpenAuthModal: () => void;
  onApplyAsset: (asset: SavedAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  onOpenCreateStamp: () => void;
  onOpenDrawSignature: () => void;
  onOpenUpload: () => void;
}

export const SavedAssetsSidebar: React.FC<SavedAssetsSidebarProps> = ({
  assets,
  user,
  onOpenAuthModal,
  onApplyAsset,
  onDeleteAsset,
  onOpenCreateStamp,
  onOpenDrawSignature,
  onOpenUpload,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-zinc-200 text-zinc-800 select-none shadow-xs">
      {/* Cloud & User Authentication Header */}
      <div className="p-3.5 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs shadow-red-600/30">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              คลังลายเซ็น & ตราปั๊ม
              <span className="text-[10px] font-mono font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.2 rounded-md">
                Cloud
              </span>
            </h2>
            <p className="text-[10px] text-zinc-500">จดจำขนาด & ตำแหน่งอัตโนมัติ</p>
          </div>
        </div>

        {/* Auth / Cloud Sync Button */}
        {user ? (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-red-100/60 transition cursor-pointer"
            title="ดูสถานะบัญชีคลาวด์"
          >
            <div
              className="w-7 h-7 rounded-full overflow-hidden border-2 border-emerald-500 ring-2 ring-emerald-500/20"
              title={user.email || 'เชื่อมต่อคลาวด์แล้ว'}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600 text-[10px] flex items-center justify-center font-bold text-white">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs shadow-red-600/20 transition active:scale-95 cursor-pointer"
            title="คลิกเพื่อเชื่อมต่อและเข้าสู่ระบบคลาวด์"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="text-[11px]">ซิงค์คลาวด์</span>
          </button>
        )}
      </div>

      {/* Quick Add Actions */}
      <div className="p-3 border-b border-zinc-200 bg-zinc-50/70 grid grid-cols-3 gap-1.5 text-center">
        <button
          onClick={onOpenDrawSignature}
          className="p-2 rounded-xl bg-white hover:bg-red-50/50 border border-zinc-200 hover:border-red-300 flex flex-col items-center gap-1 transition shadow-2xs group cursor-pointer"
        >
          <span className="text-sm group-hover:scale-110 transition">✍️</span>
          <span className="text-[10px] text-zinc-700 group-hover:text-red-600 font-semibold">วาดลายเซ็น</span>
        </button>

        <button
          onClick={onOpenCreateStamp}
          className="p-2 rounded-xl bg-white hover:bg-red-50/50 border border-zinc-200 hover:border-red-300 flex flex-col items-center gap-1 transition shadow-2xs group cursor-pointer"
        >
          <span className="text-sm group-hover:scale-110 transition">💮</span>
          <span className="text-[10px] text-zinc-700 group-hover:text-red-600 font-semibold">สร้างตราปั๊ม</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="p-2 rounded-xl bg-white hover:bg-red-50/50 border border-zinc-200 hover:border-red-300 flex flex-col items-center gap-1 transition shadow-2xs group cursor-pointer"
        >
          <span className="text-sm group-hover:scale-110 transition">📁</span>
          <span className="text-[10px] text-zinc-700 group-hover:text-red-600 font-semibold">อัปโหลดไฟล์</span>
        </button>
      </div>

      {/* Asset List with Remembered Coordinates & Dimensions */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            รายการที่บันทึก ({assets.length})
          </span>
          <span className="text-[10px] text-red-600 font-medium">คลิกเพื่อวางตำแหน่งเดิม</span>
        </div>

        {assets.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-red-200/80 bg-red-50/30 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <p className="text-xs text-zinc-800 font-bold">ยังไม่มีรายการที่บันทึก</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
              วาดลายเซ็น สร้างตราปั๊ม หรืออัปโหลดไฟล์ แล้วบันทึกเก็บไว้ใช้งานซ้ำได้ทันที
            </p>
          </div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="group bg-white hover:bg-red-50/30 border border-zinc-200 hover:border-red-300 rounded-xl p-2.5 transition flex flex-col gap-2 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-checkerboard border border-zinc-200 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-zinc-900 truncate">{asset.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono font-semibold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                      {asset.type === 'signature' ? 'ลายเซ็น' : asset.type === 'stamp' ? 'ตราปั๊ม' : 'รูปภาพ'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {Math.round(asset.width)}×{Math.round(asset.height)}px
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onDeleteAsset(asset.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-zinc-400 hover:text-red-600 transition cursor-pointer"
                  title="ลบรายการนี้ออกจากคลัง"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Memory Indicator */}
              <div className="bg-zinc-50 rounded-lg px-2 py-1 text-[10px] font-mono text-zinc-600 flex items-center justify-between border border-zinc-200/80">
                <span className="flex items-center gap-1 text-red-700 font-semibold">
                  <BookmarkCheck className="w-3 h-3 text-red-600" />
                  จำจุดเดิม: {Math.round(asset.relativeX * 100)}%, {Math.round(asset.relativeY * 100)}%
                </span>
                <span>{Math.round(asset.rotation)}°</span>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => onApplyAsset(asset)}
                className="w-full py-1.5 px-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-2xs shadow-red-600/20 transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                title="แปะลงบนเอกสารตามตำแหน่งและขนาดที่เคยใช้"
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>ประทับลงตำแหน่งเดิม</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

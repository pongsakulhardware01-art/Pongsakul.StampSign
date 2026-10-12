import React, { useState } from 'react';
import {
  Cloud,
  Check,
  X,
  LogIn,
  LogOut,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logout } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  savedAssetsCount: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  savedAssetsCount,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentHostname = window.location.hostname;

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(null);

    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err?.code || '';
      setErrorCode(code);

      if (code === 'auth/popup-blocked') {
        setErrorMessage(
          'เบราว์เซอร์ของคุณบล็อกหน้าต่างป๊อปอัป (Popup Blocked) กรุณากดอนุญาตป๊อปอัปบนแถบ URL ของเบราว์เซอร์ แล้วกดลองใหม่อีกครั้ง'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          `โดเมน "${currentHostname}" ยังไม่ได้รับอนุญาตใน Firebase Authentication`
        );
      } else if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        setErrorMessage('หน้าต่างเข้าสู่ระบบถูกปิดก่อนทำรายการเสร็จสิ้น');
      } else {
        setErrorMessage(
          err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs shadow-red-600/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                ระบบคลาวด์และการสำรองข้อมูล (Cloud Sync)
              </h2>
              <p className="text-xs text-zinc-500">
                ซิงค์ลายเซ็นและตราปั๊มข้ามเครื่อง หรือใช้งานในเครื่องทันที
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
        <div className="p-6 space-y-4">
          {/* Status Box */}
          {user ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 ring-2 ring-emerald-500/20">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    {user.displayName || 'ผู้ใช้งาน Google'}
                  </h4>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
                    <Check className="w-3.5 h-3.5" /> ซิงค์กับ Firebase Cloud เรียบร้อย
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Local Storage is active banner */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                  <HardDrive className="w-4 h-4 text-red-600" />
                  <span>ระบบบันทึกในเครื่องเปิดใช้งานอยู่แล้ว (Local Storage)</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  คุณสามารถวาดลายเซ็นหรือสร้างตราปั๊ม และกด <strong>"บันทึก"</strong> ได้ทันทีโดยไม่จำเป็นต้องล็อกอิน ระบบจะจำขนาดและตำแหน่งไว้ในเบราว์เซอร์นี้อย่างถาวร
                </p>
                <div className="text-[11px] text-zinc-500 font-mono">
                  จำนวนรายการที่บันทึกอยู่ในเครื่องขณะนี้: <span className="font-bold text-zinc-800">{savedAssetsCount} รายการ</span>
                </div>
              </div>

              {/* Cloud Sync with Google */}
              <div className="bg-red-50/50 border border-red-200 rounded-2xl p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-red-600" />
                    ต้องการใช้งานข้ามเครื่องหรือบันทึกบนคลาวด์ถาวร?
                  </h4>
                  <p className="text-xs text-zinc-600 mt-1">
                    เข้าสู่ระบบด้วย Google เพื่อซิงค์รายการลายเซ็นและตราปั๊มของคุณไปยัง Firebase Cloud
                  </p>
                </div>

                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 flex items-center justify-center gap-2.5 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังเปิดหน้าต่างเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>เข้าสู่ระบบด้วยบัญชี Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-amber-900">{errorMessage}</p>

                      {errorCode === 'auth/unauthorized-domain' && (
                        <div className="pt-2 space-y-2">
                          <p className="text-zinc-600 text-[11px]">
                            กรุณาคัดลอกโดเมนด้านล่างนี้ ไปเพิ่มใน <strong>Firebase Console</strong> &gt; <strong>Authentication</strong> &gt; <strong>Settings</strong> &gt; <strong>Authorized domains</strong>:
                          </p>
                          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200">
                            <span className="font-mono text-xs text-zinc-800 flex-1 truncate select-all">
                              {currentHostname}
                            </span>
                            <button
                              onClick={handleCopyDomain}
                              className="px-2 py-0.5 rounded text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              {copiedDomain ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>คัดลอกแล้ว</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>คัดลอก</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {errorCode === 'auth/popup-blocked' && (
                        <p className="text-zinc-600 text-[11px] pt-1">
                          💡 ดูที่แถบที่อยู่เว็บด้านบน (Address Bar) คลิกไอคอนรูปป๊อปอัปที่ถูกบล็อก แล้วเลือก <strong>"อนุญาตป๊อปอัปเสมอ"</strong> จากนั้นคลิกปุ่มเข้าสู่ระบบอีกครั้ง
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            ระบบความปลอดภัย Google Identity & Firebase
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

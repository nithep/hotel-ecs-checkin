import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import liff from '@line/liff';
import { motion } from 'framer-motion';
import { KeyRound, LogOut, Loader2, CheckCircle, AlertCircle, Mail, Video, Check } from 'lucide-react';

interface Profile {
  displayName: string;
  pictureUrl?: string;
  userId: string;
}

const GuestView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomNumber = searchParams.get('room');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = import.meta.env.VITE_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID is not configured.');
        }

        await liff.init({ liffId });

        if (liff.isLoggedIn()) {
          const userProfile = await liff.getProfile();
          setProfile({
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            userId: userProfile.userId,
          });
        } else {
          liff.login({ redirectUri: window.location.href });
        }
      } catch (err: any) {
        console.error('LIFF init error:', err);
        setError(err.message || 'Failed to initialize LINE LIFF.');
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, []);

  const handleAction = async (action: 'checkin' | 'checkout') => {
    if (!roomNumber) {
      setError('Room number is missing in URL.');
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setCheckinStatus('idle');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `${apiUrl}/api/${action}`;
      
      const payload = {
        roomNumber,
        guestName: profile?.displayName || 'Unknown Guest',
        guestEmail: guestEmail.trim() || undefined,
        pdpaConsent: action === 'checkin' ? pdpaConsent : undefined,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Failed to ${action}`);
      }

      setCheckinStatus('success');
      
      // Optional: Close LIFF app after a delay if success
      if (liff.isInClient()) {
        setTimeout(() => {
          liff.closeWindow();
        }, 3000);
      }

    } catch (err: any) {
      console.error(`${action} error:`, err);
      setError(err.message || `An error occurred during ${action}.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hotel-dark flex flex-col items-center justify-center text-white">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-hotel-accent mb-4" />
        </motion.div>
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-hotel-city tracking-wider font-light"
        >
          CONNECTING...
        </motion.p>
      </div>
    );
  }

  if (!roomNumber) {
    return (
      <div className="min-h-screen bg-hotel-dark flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel p-10 rounded-3xl max-w-sm w-full text-center relative z-10 border border-rose-500/20"
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">ข้อมูลไม่ครบถ้วน</h2>
          <p className="text-slate-400 font-light">กรุณาสแกน QR Code หน้าห้องพักอีกครั้ง</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center p-6 pt-12 relative overflow-hidden">
      {/* Background Glow */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] bg-hotel-accent/15 rounded-full blur-[120px] pointer-events-none" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10 flex flex-col items-center"
      >
        <div className="mb-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-12 h-12 bg-hotel-accent/10 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-hotel-accent/20"
          >
            <KeyRound className="w-6 h-6 text-hotel-accent" />
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 drop-shadow-lg">Smart Key</h1>
          <p className="text-hotel-city uppercase tracking-widest text-xs font-semibold">Hotel ECS Self-Service</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full glass-panel rounded-3xl p-8 shadow-[0_0_40px_rgba(2,132,199,0.15)] mb-6 relative overflow-hidden border-t border-hotel-accent/20"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-hotel-accent/10 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-white/5 relative z-10">
            {profile?.pictureUrl ? (
              <div className="relative">
                <div className="absolute inset-0 bg-hotel-accent rounded-full blur opacity-50 animate-pulse-slow"></div>
                <img 
                  src={profile.pictureUrl} 
                  alt="Profile" 
                  className="relative w-16 h-16 rounded-full border border-hotel-accent/50 object-cover shadow-xl"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-hotel-card flex items-center justify-center border border-hotel-accent/30 shadow-inner">
                <span className="text-2xl font-light text-hotel-accent">{profile?.displayName?.charAt(0) || 'G'}</span>
              </div>
            )}
            <div>
              <p className="text-xs text-hotel-city uppercase tracking-wider mb-1 font-semibold">ยินดีต้อนรับ</p>
              <p className="text-xl font-semibold tracking-tight">{profile?.displayName || 'Guest'}</p>
            </div>
          </div>

          <div className="text-center mb-10">
            <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-3">ห้องพักหมายเลข</p>
            <p className="text-6xl font-light text-white drop-shadow-[0_0_15px_rgba(56,189,248,0.5)] tracking-tighter">
              {roomNumber}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-8 flex gap-3 text-sm shadow-[0_0_20px_rgba(225,29,72,0.1)]"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <p>{error}</p>
            </motion.div>
          )}

          {checkinStatus === 'success' && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-hotel-success/10 border border-hotel-success/30 text-hotel-success p-5 rounded-2xl mb-8 flex gap-4 text-sm items-center shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            >
              <CheckCircle className="w-6 h-6 shrink-0" />
              <p className="font-medium text-base">ดำเนินการสำเร็จ<br/><span className="text-hotel-success/70 font-normal text-sm">ระบบไฟฟ้าพร้อมใช้งานแล้ว</span></p>
            </motion.div>
          )}

          {checkinStatus !== 'success' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <div className="relative mb-5 group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-hotel-accent transition-colors" />
                <input
                  type="email"
                  placeholder="อีเมล (รับใบเสร็จ/รหัสผ่าน)"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-hotel-dark/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-hotel-accent/50 focus:ring-1 focus:ring-hotel-accent/50 transition-all shadow-inner"
                />
              </div>
              <div className="flex items-start gap-4 bg-hotel-dark/30 p-4 rounded-2xl border border-white/5">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    id="pdpa-consent"
                    checked={pdpaConsent}
                    onChange={(e) => setPdpaConsent(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border border-slate-600 rounded-md checked:bg-hotel-accent checked:border-hotel-accent focus:outline-none focus:ring-2 focus:ring-hotel-accent/30 transition-all cursor-pointer"
                  />
                  <Check className="absolute w-3.5 h-3.5 text-hotel-dark opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                </div>
                <label htmlFor="pdpa-consent" className="text-[11px] text-slate-400 text-left leading-relaxed cursor-pointer select-none">
                  ข้าพเจ้ายินยอมให้รวบรวมข้อมูลส่วนบุคคลเพื่อการเข้าพัก และยอมรับเงื่อนไขการให้บริการ <br/>
                  <span className="text-hotel-accent/70 mt-1 block">* ข้อมูลจะถูกลบทิ้งอัตโนมัติเมื่อเช็คเอาท์</span>
                </label>
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-4"
          >
            <button
              onClick={() => handleAction('checkin')}
              disabled={actionLoading || (!pdpaConsent && checkinStatus !== 'success')}
              className="w-full relative group overflow-hidden bg-hotel-accent text-hotel-dark font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-hotel-glow hover:text-white hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-hotel-accent disabled:hover:text-hotel-dark"
            >
              {actionLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-6 h-6" />
                  <span>Check-in เปิดระบบไฟ</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleAction('checkout')}
              disabled={actionLoading}
              className="w-full bg-hotel-card/80 border border-white/5 text-slate-300 font-medium py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <LogOut className="w-5 h-5" />
              <span>Check-out ออกจากห้อง</span>
            </button>
            
            <a
              href="https://meet.google.com/new" 
              target="_blank"
              rel="noreferrer"
              className="w-full mt-2 bg-transparent border border-hotel-city/30 text-hotel-city font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-hotel-city/10 active:scale-[0.98]"
            >
              <Video className="w-5 h-5" />
              <span className="text-sm">ติดต่อพนักงานต้อนรับ</span>
            </a>
          </motion.div>
        </motion.div>
        <p className="text-xs text-neutral-500 text-center px-4">
          หากพบปัญหาการใช้งาน กรุณาติดต่อเคาน์เตอร์ต้อนรับ
        </p>
      </motion.div>
    </div>
  );
};

export default GuestView;

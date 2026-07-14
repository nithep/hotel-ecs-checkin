import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import liff from '@line/liff';
import { motion } from 'framer-motion';
import { KeyRound, LogOut, Loader2, CheckCircle, AlertCircle, Mail, Video } from 'lucide-react';

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
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-neutral-400">กำลังเชื่อมต่อกับ LINE...</p>
      </div>
    );
  }

  if (!roomNumber) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">ข้อมูลไม่ครบถ้วน</h2>
          <p className="text-neutral-400">กรุณาสแกน QR Code หน้าห้องพักใหม่</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center p-6 pt-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10 flex flex-col items-center"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Smart Key</h1>
          <p className="text-neutral-400">Hotel ECS Self-Service</p>
        </div>

        <div className="w-full glass-panel rounded-3xl p-6 shadow-2xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5 relative z-10">
            {profile?.pictureUrl ? (
              <img 
                src={profile.pictureUrl} 
                alt="Profile" 
                className="w-16 h-16 rounded-full border-2 border-emerald-500/30 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center border-2 border-neutral-700">
                <span className="text-xl">{profile?.displayName?.charAt(0) || 'G'}</span>
              </div>
            )}
            <div>
              <p className="text-sm text-neutral-400 mb-1">ยินดีต้อนรับ</p>
              <p className="text-lg font-medium">{profile?.displayName || 'Guest'}</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-neutral-400 uppercase tracking-widest mb-1">ห้องพัก</p>
            <p className="text-5xl font-light text-emerald-400">{roomNumber}</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 flex gap-3 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {checkinStatus === 'success' && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 flex gap-3 text-sm items-center"
            >
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p>ดำเนินการสำเร็จ ไฟห้องพักพร้อมใช้งานแล้ว</p>
            </motion.div>
          )}

          {checkinStatus !== 'success' && (
            <div className="mb-6">
              <div className="relative mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="email"
                  placeholder="อีเมล (เพื่อรับใบเสร็จและลิงก์ห้องพัก)"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-hotel-accent/50 transition-all"
                />
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="pdpa-consent"
                  checked={pdpaConsent}
                  onChange={(e) => setPdpaConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-neutral-700 text-hotel-accent focus:ring-hotel-accent/50 bg-neutral-900"
                />
                <label htmlFor="pdpa-consent" className="text-xs text-neutral-400 text-left leading-relaxed">
                  ข้าพเจ้ายินยอมให้โรงแรมเก็บรวบรวมข้อมูลส่วนบุคคลเพื่อวัตถุประสงค์ในการเข้าพัก และยินยอมรับเงื่อนไขการให้บริการ <br/>
                  <span className="text-emerald-500/70">* ข้อมูลของท่านจะถูกลบทิ้งอัตโนมัติเมื่อเช็คเอาท์</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleAction('checkin')}
              disabled={actionLoading || !pdpaConsent}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-hotel-accent to-yellow-600 text-neutral-950 font-medium text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-6 h-6" />
                  <span>Check-in เข้าห้องพัก</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleAction('checkout')}
              disabled={actionLoading}
              className="w-full bg-neutral-800 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-neutral-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-5 h-5" />
              <span>Check-out</span>
            </button>
            
            <a
              href="https://meet.google.com/new" 
              target="_blank"
              rel="noreferrer"
              className="w-full mt-2 bg-neutral-900/80 border border-hotel-accent/30 text-hotel-accent font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-hotel-accent/10 active:scale-[0.98]"
            >
              <Video className="w-5 h-5" />
              <span>ติดต่อพนักงาน (Video Call)</span>
            </a>
          </div>
        </div>

        <p className="text-xs text-neutral-500 text-center px-4">
          หากพบปัญหาการใช้งาน กรุณาติดต่อเคาน์เตอร์ต้อนรับ
        </p>
      </motion.div>
    </div>
  );
};

export default GuestView;

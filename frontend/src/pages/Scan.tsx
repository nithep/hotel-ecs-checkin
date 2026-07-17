import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ScanLine, CheckCircle2, XCircle, Bed, User, ArrowRight } from 'lucide-react';
import liff from '@line/liff';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';
type FlowType = 'checkin' | 'checkout';

interface Room {
  id: number;
  status: 'occupied' | 'vacant';
  power: boolean;
}

const Scan = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [flow, setFlow] = useState<FlowType>('checkin');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>(searchParams.get('room') || '');
  const [guestName, setGuestName] = useState<string>('');
  const [pdpaConsent, setPdpaConsent] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [lineProfile, setLineProfile] = useState<any>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = import.meta.env.VITE_LIFF_ID || '2010634930-gRJCLqbu';
        await liff.init({ liffId });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineProfile(profile);
          setGuestName(profile.displayName); // Auto-fill
        }
      } catch (err) {
        console.error('LIFF init failed', err);
      }
    };
    initLiff();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
        // Auto-select flow based on room status from QR URL param
        const qrRoom = searchParams.get('room');
        if (qrRoom) {
          const targetRoom = data.rooms.find((r: Room) => String(r.id) === qrRoom);
          if (targetRoom) {
            // ถ้าห้องถูก occupied อยู่แล้ว ให้ auto-switch ไป checkout mode
            setFlow(targetRoom.status === 'occupied' ? 'checkout' : 'checkin');
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [status]);

  // Filter rooms based on selected flow
  const availableRooms = rooms.filter(r => 
    flow === 'checkin' ? r.status === 'vacant' : r.status === 'occupied'
  );

  const handleProcessAction = async () => {
    if (!selectedRoom) {
      setErrorMsg('กรุณาเลือกห้องพักก่อนทำรายการ');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    if (flow === 'checkin' && !guestName.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้เข้าพัก');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('scanning');
    setErrorMsg('');

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const endpoint = flow === 'checkin' ? '/api/checkin' : '/api/checkout';
      const payload = flow === 'checkin' 
        ? { roomNumber: selectedRoom, guestName, pdpaConsent } 
        : { roomNumber: selectedRoom };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 202 && data.reason === 'APPROVAL_REQUIRED') {
        // High-risk commands outside normal schedule
        setStatus('success'); 
      } else if (response.ok && (data.hardware_status?.success || data.success || data.message)) {
        setStatus('success');
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการสั่งการระบบไฟ');
        setStatus('error');
      }
    } catch (error) {
      console.error(`${flow} failed:`, error);
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ควบคุมระบบไฟได้');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setSelectedRoom('');
    setGuestName('');
    setPdpaConsent(false);
    setErrorMsg('');
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[75vh] px-4">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-hotel-accent to-slate-400">
          Smart Self Check-in & Out
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto">
          สแกนคิวอาร์โค้ดหรือทำรายการเช็คอิน/เช็คเอาท์เพื่อควบคุมระบบไฟฟ้าห้องพักของคุณโดยอัตโนมัติ
        </p>
      </div>

      {/* Main card */}
      <div className="w-full glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full blur-3xl opacity-10 bg-hotel-accent" />
        <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl opacity-10 bg-hotel-accent" />

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Tab Selector checkin vs checkout */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900">
                <button
                  onClick={() => { setFlow('checkin'); setSelectedRoom(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    flow === 'checkin' ? 'bg-hotel-card text-hotel-accent border border-slate-800 shadow' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  📥 เช็คอินเข้าห้องพัก (Check-in)
                </button>
                <button
                  onClick={() => { setFlow('checkout'); setSelectedRoom(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    flow === 'checkout' ? 'bg-hotel-card text-hotel-accent border border-slate-800 shadow' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  📤 เช็คเอาท์คืนห้อง (Check-out)
                </button>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                {/* Room selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bed size={14} className="text-hotel-accent" />
                    เลือกห้องพักที่ต้องการ
                  </label>
                  {availableRooms.length === 0 ? (
                    <div className="text-xs text-slate-500 py-3 px-4 bg-slate-950 rounded-xl border border-slate-900/60">
                      ไม่มีห้องพักว่างพร้อมทำรายการในขณะนี้
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[120px] overflow-y-auto pr-1">
                      {availableRooms.map(room => (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoom(String(room.id))}
                          className={`py-3 rounded-xl font-bold border text-sm transition-all ${
                            selectedRoom === String(room.id)
                              ? 'bg-hotel-accent/10 border-hotel-accent text-hotel-accent shadow'
                              : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-white'
                          }`}
                        >
                          {room.id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guest name only for check-in */}
                {flow === 'checkin' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-hotel-accent" />
                      ชื่อผู้เข้าพัก (Guest Name)
                    </label>
                    {lineProfile ? (
                      <div className="flex items-center gap-4 bg-[#00B900]/10 border border-[#00B900]/30 p-3 rounded-xl">
                        <img src={lineProfile.pictureUrl} alt="LINE Profile" className="w-10 h-10 rounded-full border-2 border-[#00B900]" />
                        <div>
                          <p className="text-xs text-[#00B900] font-bold">ยืนยันตัวตนผ่าน LINE แล้ว</p>
                          <p className="text-white text-sm font-medium">{lineProfile.displayName}</p>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="กรอกชื่อ-นามสกุลของคุณ..."
                        className="w-full bg-slate-950 border border-slate-900 focus:border-hotel-accent focus:ring-1 focus:ring-hotel-accent rounded-xl py-3 px-4 text-slate-200 text-sm outline-none transition-all"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* PDPA Consent Checkbox for Check-in */}
              {flow === 'checkin' && (
                <div className="flex items-start gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <input
                    type="checkbox"
                    id="pdpa-consent-scan"
                    checked={pdpaConsent}
                    onChange={(e) => setPdpaConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-800 text-hotel-accent focus:ring-hotel-accent/50 bg-slate-900"
                  />
                  <label htmlFor="pdpa-consent-scan" className="text-xs text-slate-400 text-left leading-relaxed">
                    ข้าพเจ้ายินยอมให้โรงแรมเก็บรวบรวมข้อมูลส่วนบุคคลเพื่อวัตถุประสงค์ในการเข้าพัก และยินยอมรับเงื่อนไขการให้บริการ <br/>
                    <span className="text-emerald-500/70">* ข้อมูลของท่านจะถูกลบทิ้งอัตโนมัติเมื่อเช็คเอาท์</span>
                  </label>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleProcessAction}
                disabled={!selectedRoom || (flow === 'checkin' && (!guestName.trim() || !pdpaConsent))}
                className="w-full py-4 bg-gradient-to-r from-hotel-accent to-amber-600 hover:from-amber-500 hover:to-hotel-accent disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
              >
                ยืนยันและสแกนระบบไฟฟ้า
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {status === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center"
            >
              <div className="relative w-48 h-48 border-2 border-hotel-accent/30 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner">
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-hotel-accent shadow-[0_0_15px_rgba(212,175,55,0.8)]"
                />
                <QrCode size={80} className="text-hotel-accent animate-pulse opacity-40" />
                <ScanLine size={48} className="absolute text-hotel-accent opacity-20" />
              </div>
              <p className="mt-6 text-sm font-bold text-slate-300 tracking-wide animate-pulse">
                กำลังสแกนคิวอาร์โค้ดและส่งสัญญาณไปยังตู้สาขา...
              </p>
              <p className="text-xs text-slate-500 mt-1">กรุณารอสักครู่ (สัญญาณไฟฟ้ากำลังจัดเตรียม)</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="py-10 flex flex-col items-center justify-center text-center"
            >
              <div className="bg-emerald-950/30 text-emerald-400 rounded-full p-4 mb-4 border border-emerald-800 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <CheckCircle2 size={56} className="animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-2">ทำรายการสำเร็จ!</h3>
              <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
                {flow === 'checkin' 
                  ? `ระบบบันทึกการเช็คอินห้อง ${selectedRoom} เรียบร้อย กรุณาเสียบคีย์การ์ดเมื่อเข้าห้องพักเพื่อเปิดระบบไฟ` 
                  : `เช็คเอาท์ห้อง ${selectedRoom} สำเร็จ วงจรไฟฟ้าถูกตัดกระแสเรียบร้อยแล้ว เดินทางปลอดภัยครับ`}
              </p>
              
              <button
                onClick={handleReset}
                className="mt-8 px-6 py-2.5 bg-slate-950 border border-slate-900 hover:border-slate-800 hover:text-white text-slate-400 rounded-xl text-xs font-semibold transition-all"
              >
                กลับไปหน้าหลัก
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="py-10 flex flex-col items-center justify-center text-center"
            >
              <div className="bg-rose-950/30 text-rose-400 rounded-full p-4 mb-4 border border-rose-800 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                <XCircle size={56} />
              </div>
              <h3 className="text-2xl font-bold text-rose-400 mb-2">ทำรายการล้มเหลว</h3>
              <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
                {errorMsg || 'เกิดข้อผิดพลาดในการส่งคำสั่ง สัญญาณขัดข้อง กรุณาลองใหม่อีกครั้ง'}
              </p>

              <button
                onClick={handleReset}
                className="mt-8 px-6 py-2.5 bg-slate-950 border border-slate-900 hover:border-slate-800 hover:text-white text-slate-400 rounded-xl text-xs font-semibold transition-all"
              >
                ลองใหม่อีกครั้ง
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Scan;

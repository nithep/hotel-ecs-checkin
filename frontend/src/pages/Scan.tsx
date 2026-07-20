import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CheckCircle2, XCircle, Bed, User, ArrowRight, CameraOff, Lock } from 'lucide-react';
import liff from '@line/liff';
import { BrowserMultiFormatReader } from '@zxing/browser';

type ScanStatus = 'idle' | 'camera_active' | 'scanned' | 'processing' | 'success' | 'error' | 'permission_denied' | 'insecure_context';
type FlowType = 'checkin' | 'checkout';


const Scan = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [flow, setFlow] = useState<FlowType>('checkin');
  const [selectedRoom, setSelectedRoom] = useState<string>(searchParams.get('room') || '');
  const [guestName, setGuestName] = useState<string>('');
  const [pdpaConsent, setPdpaConsent] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [lineProfile, setLineProfile] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = import.meta.env.VITE_LIFF_ID || '2010634930-gRJCLqbu';
        await liff.init({ liffId });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineProfile(profile);
          setGuestName(profile.displayName);
        }
      } catch (err) {
        console.error('LIFF init failed', err);
      }
    };
    initLiff();

    // Init QR Reader
    codeReader.current = new BrowserMultiFormatReader();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (codeReader.current) {
      (codeReader.current as any).reset?.();
    }
  };

  const startCamera = async () => {
    // 1. Check for Secure Context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecureContext) {
      setStatus('insecure_context');
      return;
    }

    setStatus('camera_active');
    setErrorMsg('');

    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) {
        setStatus('permission_denied');
        setErrorMsg('ไม่พบกล้องในอุปกรณ์นี้');
        return;
      }

      // Try to use back camera
      const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
      const deviceId = backCamera ? backCamera.deviceId : devices[0].deviceId;

      await codeReader.current!.decodeFromVideoDevice(
        deviceId,
        videoRef.current!,
        (result, err) => {
          if (result) {
            handleQRResult(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('QR Scan error:', err);
          }
        }
      );
    } catch (err: any) {
      console.error('Camera startup error:', err);
      setStatus('permission_denied');
      setErrorMsg('เบราว์เซอร์ปฏิเสธการเข้าถึงกล้อง กรุณาอนุญาต (Allow) การใช้งานกล้องในการตั้งค่า');
    }
  };

  const handleQRResult = (data: string) => {
    stopCamera();
    let roomNum = data;

    // Try parsing as JSON or URL
    try {
      if (data.startsWith('{')) {
        const parsed = JSON.parse(data);
        if (parsed.room) roomNum = String(parsed.room);
      } else if (data.startsWith('http')) {
        const url = new URL(data);
        if (url.searchParams.has('room')) {
          roomNum = url.searchParams.get('room')!;
        }
      }
    } catch (e) {
      // Keep raw string
    }

    setSelectedRoom(roomNum);
    setStatus('scanned');
  };

  const handleProcessAction = async () => {
    if (!selectedRoom) {
      setErrorMsg('กรุณาเลือกห้องพักก่อนทำรายการ');
      setStatus('error');
      return;
    }

    if (flow === 'checkin' && !guestName.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้เข้าพัก');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setErrorMsg('');

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
    stopCamera();
    setStatus('idle');
    setSelectedRoom('');
    setGuestName('');
    setPdpaConsent(false);
    setErrorMsg('');
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[75vh] px-4 py-8">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-hotel-accent to-slate-400">
          Smart QR Scanner
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto">
          สแกนคิวอาร์โค้ดประจำห้องพักของคุณ เพื่อควบคุมระบบไฟฟ้าโดยอัตโนมัติ
        </p>
      </div>

      {/* Main card */}
      <div className="w-full glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-white/10">
        {/* Decorative elements */}
        <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full blur-3xl opacity-20 bg-hotel-accent" />
        <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl opacity-20 bg-hotel-accent" />

        <AnimatePresence mode="wait">
          
          {/* STATE: INSECURE CONTEXT (HTTP) */}
          {status === 'insecure_context' && (
            <motion.div
              key="insecure"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="bg-rose-950/30 text-rose-400 rounded-full p-5 mb-2 border border-rose-800 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                <Lock size={48} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-rose-400">การเชื่อมต่อไม่ปลอดภัย</h3>
              <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
                เบราว์เซอร์จะไม่อนุญาตให้เปิดใช้งานกล้องหากไม่ได้เชื่อมต่อผ่าน <strong>HTTPS</strong><br/>
                กรุณาตรวจสอบว่าคุณเข้าใช้งานผ่าน URL ที่ขึ้นต้นด้วย <code>https://</code>
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-600 hover:text-white text-slate-400 rounded-xl text-xs font-semibold transition-all"
              >
                กลับไปหน้าหลัก
              </button>
            </motion.div>
          )}

          {/* STATE: PERMISSION DENIED */}
          {status === 'permission_denied' && (
            <motion.div
              key="denied"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="bg-amber-950/30 text-amber-400 rounded-full p-5 mb-2 border border-amber-800 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <CameraOff size={48} />
              </div>
              <h3 className="text-xl font-bold text-amber-400">ไม่สามารถเข้าถึงกล้องได้</h3>
              <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
                {errorMsg || 'ระบบถูกปฏิเสธสิทธิ์ในการใช้งานกล้อง กรุณากดรูปแม่กุญแจบน Address Bar แล้วเลือกอนุญาต (Allow) กล้องถ่ายรูป'}
              </p>
              <button
                onClick={() => startCamera()}
                className="mt-4 px-6 py-2.5 bg-hotel-accent/20 border border-hotel-accent/50 hover:bg-hotel-accent/40 text-hotel-accent rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                ลองเชื่อมต่อกล้องอีกครั้ง
              </button>
              <button
                onClick={() => setStatus('scanned')}
                className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
              >
                กรอกข้อมูลด้วยตนเอง (Manual Input)
              </button>
            </motion.div>
          )}

          {/* STATE: IDLE */}
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative w-48 h-48 border-2 border-hotel-accent/20 rounded-3xl overflow-hidden bg-slate-950/50 flex flex-col items-center justify-center shadow-inner group cursor-pointer hover:border-hotel-accent/50 transition-all duration-300" onClick={startCamera}>
                <QrCode size={64} className="text-hotel-accent/50 group-hover:text-hotel-accent group-hover:scale-110 transition-all duration-300" />
                <span className="mt-4 text-xs font-bold text-hotel-accent/70 group-hover:text-hotel-accent uppercase tracking-wider">แตะเพื่อสแกน</span>
              </div>
              <button
                onClick={startCamera}
                className="w-full py-4 bg-gradient-to-r from-hotel-accent to-amber-600 hover:from-amber-500 hover:to-hotel-accent text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2"
              >
                <QrCode size={18} />
                เปิดกล้องสแกน QR Code
              </button>
              <button
                onClick={() => setStatus('scanned')}
                className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
              >
                ไม่มี QR Code? กรอกข้อมูลด้วยตนเอง
              </button>
            </motion.div>
          )}

          {/* STATE: CAMERA ACTIVE (SCANNING) */}
          {status === 'camera_active' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative w-full aspect-square max-w-sm rounded-3xl overflow-hidden border-2 border-hotel-accent shadow-[0_0_30px_rgba(212,175,55,0.2)] bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                
                {/* Premium Laser Animation */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-1 bg-hotel-accent shadow-[0_0_20px_rgba(212,175,55,1)]"
                  />
                  {/* Scanner frame guides */}
                  <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-hotel-accent rounded-tl-xl" />
                  <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-hotel-accent rounded-tr-xl" />
                  <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-hotel-accent rounded-bl-xl" />
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-hotel-accent rounded-br-xl" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-slate-200 animate-pulse">จัด QR Code ให้อยู่ในกรอบ</p>
                <p className="text-xs text-slate-500 mt-1">ระบบจะทำการสแกนอัตโนมัติ</p>
              </div>

              <button
                onClick={() => { stopCamera(); setStatus('idle'); }}
                className="px-6 py-2.5 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-900/50 text-rose-400 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
              >
                <CameraOff size={16} />
                ปิดกล้อง
              </button>
            </motion.div>
          )}

          {/* STATE: SCANNED / FORM */}
          {status === 'scanned' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Tab Selector checkin vs checkout */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 shadow-inner">
                <button
                  onClick={() => setFlow('checkin')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    flow === 'checkin' ? 'bg-hotel-card text-hotel-accent border border-hotel-accent/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  📥 เช็คอิน (Check-in)
                </button>
                <button
                  onClick={() => setFlow('checkout')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    flow === 'checkout' ? 'bg-hotel-card text-hotel-accent border border-hotel-accent/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  📤 เช็คเอาท์ (Check-out)
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bed size={14} className="text-hotel-accent" />
                    หมายเลขห้องพัก (Room Number)
                  </label>
                  <input
                    type="text"
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    placeholder="เช่น 101"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-hotel-accent focus:ring-1 focus:ring-hotel-accent rounded-xl py-3 px-4 text-hotel-accent text-lg font-bold outline-none transition-all shadow-inner"
                  />
                </div>

                {flow === 'checkin' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-hotel-accent" />
                      ชื่อผู้เข้าพัก (Guest Name)
                    </label>
                    {lineProfile ? (
                      <div className="flex items-center gap-4 bg-[#00B900]/10 border border-[#00B900]/30 p-3 rounded-xl shadow-inner">
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
                        placeholder="กรอกชื่อ-นามสกุล..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-hotel-accent focus:ring-1 focus:ring-hotel-accent rounded-xl py-3 px-4 text-slate-200 text-sm outline-none transition-all shadow-inner"
                      />
                    )}
                  </div>
                )}
              </div>

              {flow === 'checkin' && (
                <div className="flex items-start gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800 shadow-inner">
                  <input
                    type="checkbox"
                    id="pdpa-consent-scan"
                    checked={pdpaConsent}
                    onChange={(e) => setPdpaConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-hotel-accent focus:ring-hotel-accent/50 bg-slate-900 cursor-pointer"
                  />
                  <label htmlFor="pdpa-consent-scan" className="text-xs text-slate-400 text-left leading-relaxed cursor-pointer">
                    ข้าพเจ้ายินยอมให้โรงแรมเก็บรวบรวมข้อมูลส่วนบุคคลเพื่อวัตถุประสงค์ในการเข้าพัก และยินยอมรับเงื่อนไขการให้บริการ <br/>
                    <span className="text-emerald-500/70 block mt-1 font-medium">* ข้อมูลของท่านจะถูกลบทิ้งอัตโนมัติเมื่อเช็คเอาท์</span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-xl font-bold text-sm transition-all duration-300"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleProcessAction}
                  disabled={!selectedRoom || (flow === 'checkin' && (!guestName.trim() || !pdpaConsent))}
                  className="flex-1 py-4 bg-gradient-to-r from-hotel-accent to-amber-600 hover:from-amber-500 hover:to-hotel-accent disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2 border border-amber-500/50"
                >
                  ยืนยันการทำรายการ
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE: PROCESSING */}
          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-hotel-accent/30 animate-pulse" />
                <LoaderIcon className="w-16 h-16 text-hotel-accent animate-spin relative z-10" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-200">กำลังเชื่อมต่อกับตู้สาขา PBX...</p>
                <p className="text-sm text-slate-500 mt-1">สั่งการระบบไฟฟ้าห้อง {selectedRoom}</p>
              </div>
            </motion.div>
          )}

          {/* STATE: SUCCESS */}
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/30 animate-pulse" />
                <div className="bg-emerald-950/50 text-emerald-400 rounded-full p-5 border-2 border-emerald-500/50 relative z-10">
                  <CheckCircle2 size={64} className="animate-bounce" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">ทำรายการสำเร็จ!</h3>
                <p className="text-sm text-slate-300 max-w-sm leading-relaxed mx-auto">
                  {flow === 'checkin' 
                    ? `ระบบจ่ายกระแสไฟเข้าห้อง ${selectedRoom} เรียบร้อย กรุณาเสียบคีย์การ์ดเมื่อเข้าห้องพัก` 
                    : `เช็คเอาท์ห้อง ${selectedRoom} สำเร็จ วงจรไฟฟ้าถูกตัดกระแสเรียบร้อยแล้ว เดินทางปลอดภัยครับ`}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 px-8 py-3 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:text-white text-slate-300 rounded-xl text-sm font-bold transition-all shadow-lg"
              >
                ทำรายการใหม่
              </button>
            </motion.div>
          )}

          {/* STATE: ERROR */}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-rose-500/30 animate-pulse" />
                <div className="bg-rose-950/50 text-rose-400 rounded-full p-5 border-2 border-rose-500/50 relative z-10">
                  <XCircle size={64} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-rose-400 mb-2">ทำรายการล้มเหลว</h3>
                <p className="text-sm text-slate-300 max-w-sm leading-relaxed mx-auto bg-rose-950/30 p-3 rounded-lg border border-rose-900/50">
                  {errorMsg || 'เกิดข้อผิดพลาดในการส่งคำสั่ง สัญญาณขัดข้อง กรุณาลองใหม่อีกครั้ง'}
                </p>
              </div>
              <button
                onClick={() => setStatus('scanned')}
                className="mt-4 px-8 py-3 bg-hotel-accent/20 border border-hotel-accent/50 hover:bg-hotel-accent/40 text-hotel-accent rounded-xl text-sm font-bold transition-all shadow-lg"
              >
                แก้ไขข้อมูลและลองใหม่
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
              >
                กลับไปหน้าเริ่มต้น
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Simple loader icon component
const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Scan;

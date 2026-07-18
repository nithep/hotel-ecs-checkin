import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { api, pdpa } from '../lib/api';

interface CheckInData {
  roomNumber: string;
  guestName: string;
  guestEmail?: string;
}

const CheckIn: React.FC = () => {
  // State management
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize QR scanner
  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    
    return () => {
      stopScanning();
    };
  }, []);

  // Start QR scanning
  const startScanning = async () => {
    try {
      setError('');
      setCameraError('');
      
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (devices.length === 0) {
        setCameraError('ไม่พบกล้องบนอุปกรณ์นี้');
        return;
      }

      // Use back camera if available, otherwise use first camera
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear')
      );
      
      const selectedDeviceId = backCamera?.deviceId || devices[0].deviceId;

      await codeReader.current!.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result) => {
          if (result) {
            const text = result.getText();
            setScanResult(text);
            parseQRCode(text);
            stopScanning();
          }
        }
      );
      
      setScanning(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
    }
  };

  // Stop QR scanning
  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setScanning(false);
  };

  // Parse QR code data
  const parseQRCode = (qrData: string) => {
    try {
      // Expected format: {"room":"101","name":"John Doe","email":"john@example.com"}
      const data = JSON.parse(qrData);
      
      if (!data.room || !data.name) {
        setError('QR Code ไม่ถูกต้อง或缺少ข้อมูลจำเป็น');
        return;
      }

      setCheckInData({
        roomNumber: data.room,
        guestName: data.name,
        guestEmail: data.email,
      });
      
      setError('');
    } catch (err) {
      // If not JSON, treat as room number only
      setCheckInData({
        roomNumber: qrData,
        guestName: '',
      });
      setError('กรุณากรอกชื่อผู้เข้าพัก');
    }
  };

  // Handle check-in submission
  const handleCheckIn = async () => {
    if (!checkInData) {
      setError('ไม่มีข้อมูลการเช็คอิน');
      return;
    }

    if (!checkInData.guestName.trim()) {
      setError('กรุณากรอกชื่อผู้เข้าพัก');
      return;
    }

    if (!pdpaConsent) {
      setError('กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนดำเนินการ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.checkIn({
        roomNumber: checkInData.roomNumber,
        guestName: checkInData.guestName,
        guestEmail: checkInData.guestEmail,
        pdpaConsent: {
          privacyPolicyAccepted: true,
          acceptedAt: new Date().toISOString(),
        },
      });

      // Save consent to localStorage
      pdpa.setConsentGiven(true);

      // Show success animation
      setSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err: any) {
      console.error('Check-in failed:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเช็คอิน');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setScanResult('');
    setCheckInData(null);
    setPdpaConsent(false);
    setError('');
    setSuccess(false);
  };

  // Manual input fallback
  const handleManualInput = (field: keyof CheckInData, value: string) => {
    setCheckInData(prev => ({
      ...prev!,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-2xl"
          >
            <QrCode className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">
            เช็คอินโรงแรม
          </h1>
          <p className="text-gray-400">
            สแกน QR Code หรือกรอกข้อมูลด้วยตนเอง
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Success Animation */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-gradient-to-br from-green-500/90 to-emerald-600/90 flex items-center justify-center z-50"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <CheckCircle className="w-24 h-24 text-white mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">
                    เช็คอินสำเร็จ!
                  </h2>
                  <p className="text-white/90">
                    ยินดีต้อนรับสู่โรงแรมของเรา
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 space-y-6">
            {/* QR Scanner Section */}
            {!checkInData && (
              <div className="space-y-4">
                <div className="relative aspect-square bg-black/50 rounded-2xl overflow-hidden border-2 border-white/20">
                  {scanning ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                      />
                      {/* Scanning overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-64 h-64 border-2 border-purple-500 rounded-lg"
                        />
                      </div>
                      <button
                        onClick={stopScanning}
                        className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <CameraOff className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-16 h-16 mb-4 opacity-50" />
                      <p className="text-sm">กดปุ่มด้านล่างเพื่อเริ่มสแกน</p>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{cameraError}</p>
                  </motion.div>
                )}

                <button
                  onClick={scanning ? stopScanning : startScanning}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {scanning ? (
                    <>
                      <CameraOff className="w-5 h-5" />
                      หยุดสแกน
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      สแกน QR Code
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Check-in Form */}
            {checkInData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Room Number Display */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                  <p className="text-gray-400 text-sm mb-1">หมายเลขห้อง</p>
                  <p className="text-3xl font-bold text-white">
                    {checkInData.roomNumber}
                  </p>
                </div>

                {/* Guest Name Input */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ชื่อผู้เข้าพัก
                  </label>
                  <input
                    type="text"
                    value={checkInData.guestName}
                    onChange={(e) => handleManualInput('guestName', e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุล"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Guest Email Input (Optional) */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    อีเมล (ไม่บังคับ)
                  </label>
                  <input
                    type="email"
                    value={checkInData.guestEmail || ''}
                    onChange={(e) => handleManualInput('guestEmail', e.target.value)}
                    placeholder="example@email.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* PDPA Consent Checkbox */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdpaConsent}
                      onChange={(e) => setPdpaConsent(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-gray-400 text-purple-600 focus:ring-purple-500 bg-white/10"
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium mb-1">
                        ยอมรับนโยบายความเป็นส่วนตัว
                      </p>
                      <p className="text-gray-400 text-xs">
                        ฉันได้อ่านและยอมรับ{' '}
                        <button
                          onClick={() => window.open('/privacy-policy', '_blank')}
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          นโยบายความเป็นส่วนตัว (PDPA)
                        </button>{' '}
                        ของโรงแรม
                      </p>
                    </div>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3"
                  >
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200 border border-white/20"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleCheckIn}
                    disabled={loading || !pdpaConsent}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        กำลังดำเนินการ...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5" />
                        เช็คอิน
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Scan Result Display */}
            {scanResult && !checkInData && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                <p className="text-green-300 text-sm mb-1">ผลลัพธ์การสแกน:</p>
                <p className="text-white font-mono text-xs break-all">
                  {scanResult}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            ต้องการความช่วยเหลือ? ติดต่อฝ่ายต้อนรับ
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckIn;

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ScanLine, CheckCircle2, XCircle } from 'lucide-react';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

const Scan = () => {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [roomNumber, setRoomNumber] = useState<string | null>(null);

  const handleSimulateScan = async () => {
    setStatus('scanning');

    try {
      // Call our Backend API (Digital Twin)
      const response = await fetch('http://localhost:3000/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: '101' })
      });

      const data = await response.json();

      if (response.ok && data.hardware_status?.success) {
        setRoomNumber('101');
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      setStatus('error');
    } finally {
      // Reset after a few seconds
      setTimeout(() => {
        setStatus('idle');
        setRoomNumber(null);
      }, 4000);
    }
  };

  const handleSimulateCheckout = async () => {
    setStatus('scanning');

    try {
      const response = await fetch('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: '101' })
      });

      const data = await response.json();

      if (response.ok && data.hardware_status?.success) {
        setRoomNumber('101');
        setStatus('success'); // Reusing success UI but we could customize it for checkout
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      setStatus('error');
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setRoomNumber(null);
      }, 4000);
    }
  };

  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Self Check-in / Out</h1>
        <p className="text-slate-400">Scan your booking QR code to unlock your room or check out.</p>
      </div>

      {/* Scanner Mock UI */}
      <div className="relative w-full aspect-square max-w-sm bg-hotel-card rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center mb-8 group">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-slate-500"
            >
              <QrCode size={64} className="mb-4 opacity-50" />
              <p className="font-medium">Camera not initialized</p>
              <p className="text-xs mt-1 opacity-70">Simulation mode active</p>
            </motion.div>
          )}

          {status === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10"
            >
              <div className="relative w-4/5 h-4/5 border-2 border-hotel-accent/50 rounded-xl overflow-hidden">
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-hotel-accent shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                />
                <ScanLine size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-hotel-accent opacity-20" />
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-hotel-success/10 backdrop-blur-md z-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="bg-hotel-success text-white rounded-full p-4 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 size={48} />
              </motion.div>
              <h3 className="text-2xl font-bold text-hotel-success mb-1">Action Complete</h3>
              <p className="text-slate-300">Room {roomNumber} processed.</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-hotel-danger/10 backdrop-blur-md z-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="bg-hotel-danger text-white rounded-full p-4 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              >
                <XCircle size={48} />
              </motion.div>
              <h3 className="text-xl font-bold text-hotel-danger mb-1">Invalid QR Code</h3>
              <p className="text-slate-300">Please try scanning again.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewfinder corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-slate-600 rounded-tl-lg pointer-events-none group-hover:border-hotel-accent transition-colors" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-slate-600 rounded-tr-lg pointer-events-none group-hover:border-hotel-accent transition-colors" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-slate-600 rounded-bl-lg pointer-events-none group-hover:border-hotel-accent transition-colors" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-slate-600 rounded-br-lg pointer-events-none group-hover:border-hotel-accent transition-colors" />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSimulateScan}
          disabled={status !== 'idle'}
          className="px-6 py-3 bg-hotel-accent hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
        >
          <ScanLine size={18} />
          Check-in
        </button>
        <button
          onClick={handleSimulateCheckout}
          disabled={status !== 'idle'}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
        >
          <XCircle size={18} />
          Check-out
        </button>
      </div>
    </div>
  );
};

export default Scan;

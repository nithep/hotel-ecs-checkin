import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ZapOff, 
  Users, 
  BedDouble, 
  LogOut, 
  ShieldAlert, 
  Check, 
  X, 
  FileText, 
  Activity, 
  Clock, 
  Lock 
} from 'lucide-react';
import TerminalStatus from '../components/TerminalStatus';

interface Room {
  id: number;
  status: 'occupied' | 'vacant';
  power: boolean;
}

interface PendingApproval {
  approval_id: string;
  status: string;
  trace_id: string;
  command: {
    command_type: string;
    target_rooms: string[];
    requested_by: string;
    source: string;
    dry_run: boolean;
  };
  classification: {
    requiresApproval: boolean;
    riskCode: string | null;
    riskName: string | null;
    riskLevel: string;
    reason: string;
  };
  requested_at: string;
  pending_expires_at: string;
}

interface AuditEvent {
  event_id: string;
  trace_id: string;
  timestamp: string;
  event_type: string;
  command_type: string;
  target_rooms: string;
  requested_by: string;
  risk_code: string | null;
  decided_by: string | null;
  reason: string | null;
  result: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
};

const Dashboard = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'approvals' | 'audit'>('rooms');
  
  // Modal State for Approval Reason
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch('/api/admin/approval');
      const data = await res.json();
      if (data.success) {
        setPendingApprovals(data.pending);
      }
    } catch (error) {
      console.error("Failed to fetch pending approvals", error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit/events?limit=25');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.events);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    }
  };

  const loadAllData = async () => {
    await Promise.all([fetchRooms(), fetchPendingApprovals(), fetchAuditLogs()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
    // Poll updates every 4 seconds
    const interval = setInterval(() => {
      fetchRooms();
      fetchPendingApprovals();
      if (activeTab === 'audit') fetchAuditLogs();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const showAlert = (type: 'success' | 'error' | 'warning', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const handleCheckout = async (roomId: number) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: roomId })
      });
      const data = await response.json();
      
      if (response.status === 202 && data.reason === 'APPROVAL_REQUIRED') {
        showAlert('warning', `⚠️ คำสั่งเช็คเอาท์ห้อง ${roomId} ถูกส่งไปยังระบบความปลอดภัย (รออนุมัติเนื่องจากอยู่นอกเวลาทำการ)`);
        loadAllData();
      } else if (response.ok) {
        showAlert('success', `✅ เช็คเอาท์ห้อง ${roomId} สำเร็จ`);
        fetchRooms();
        fetchAuditLogs();
      } else {
        showAlert('error', `❌ เกิดข้อผิดพลาด: ${data.error || 'ไม่สามารถทำรายการได้'}`);
      }
    } catch (error) {
      console.error("Checkout failed", error);
      showAlert('error', '❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const openActionModal = (id: string, action: 'approve' | 'reject') => {
    setSelectedApprovalId(id);
    setModalAction(action);
    setActionReason(action === 'approve' ? 'อนุมัติการสั่งงานระดับแอดมิน' : 'ปฏิเสธเนื่องจากไม่มีผู้เข้าพักหรืออยู่นอกเวลาทำการ');
    setShowReasonModal(true);
  };

  const submitApprovalAction = async () => {
    if (!selectedApprovalId || !actionReason.trim()) return;
    setIsSubmittingAction(true);

    try {
      const endpoint = `/api/admin/approval/${selectedApprovalId}/${modalAction}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: actionReason,
          decidedBy: 'admin:web_dashboard'
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process decision');
      }

      // If approved, trigger execute immediately for client convenience
      if (modalAction === 'approve') {
        const execResponse = await fetch(`/api/admin/approval/${selectedApprovalId}/execute`, {
          method: 'POST',
        });
        const execData = await execResponse.json();
        if (!execResponse.ok) {
          throw new Error(execData.error || 'Failed to execute approved command');
        }
        showAlert('success', '✅ อนุมัติและสั่งการไฟฟ้าเรียบร้อยแล้ว');
      } else {
        showAlert('success', '❌ ปฏิเสธคำสั่งเรียบร้อยแล้ว');
      }

      setShowReasonModal(false);
      loadAllData();
    } catch (error: any) {
      showAlert('error', `❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const stats = {
    total: rooms.length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    vacant: rooms.filter((r) => r.status === 'vacant').length,
    powerOn: rooms.filter((r) => r.power).length,
    pending: pendingApprovals.length,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Activity className="animate-spin text-hotel-accent mb-4" size={40} />
        <p className="font-semibold">กำลังเชื่อมต่อกับระบบควบคุม Hotel ECS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Alert Toast */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl border shadow-2xl flex items-center gap-3 backdrop-blur-md max-w-md ${
              alertMessage.type === 'success' 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                : alertMessage.type === 'error'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : 'bg-amber-950/80 text-amber-300 border-amber-800'
            }`}
          >
            <span className="text-sm font-medium">{alertMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Main Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-hotel-accent to-slate-400">
            Hotel ECS Dashboard
          </h1>
          <p className="text-slate-400 mt-1.5 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            เชื่อมต่อตู้สาขา Phonik PBX สำเร็จ (โหมด Live/Simulator)
          </p>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-900 w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'rooms' 
                ? 'bg-hotel-card text-hotel-accent shadow-lg border border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BedDouble size={16} />
            สถานะห้องพัก ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 relative whitespace-nowrap ${
              activeTab === 'approvals' 
                ? 'bg-hotel-card text-hotel-accent shadow-lg border border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert size={16} />
            ค้างการอนุมัติ
            {stats.pending > 0 && (
              <span className="absolute -top-1 -right-1 bg-hotel-danger text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                {stats.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'audit' 
                ? 'bg-hotel-card text-hotel-accent shadow-lg border border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={16} />
            ประวัติความปลอดภัย (Audit Log)
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-hotel-card border border-slate-900/50 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 bg-hotel-accent/10 text-hotel-accent rounded-xl">
            <BedDouble size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">ห้องพักทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-100">{stats.total} ห้อง</p>
          </div>
        </div>
        
        <div className="bg-hotel-card border border-slate-900/50 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">เช็คอินแล้ว</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.occupied} ห้อง</p>
          </div>
        </div>

        <div className="bg-hotel-card border border-slate-900/50 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-hotel-accent/15 text-hotel-accent rounded-xl animate-pulse-slow">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">จ่ายกระแสไฟ</p>
            <p className="text-2xl font-bold text-slate-100">{stats.powerOn} ห้อง</p>
          </div>
        </div>

        <div className="bg-hotel-card border border-slate-900/50 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Lock size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">รอความปลอดภัย</p>
            <p className="text-2xl font-bold text-amber-500">{stats.pending} รายการ</p>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[40vh]">
        <AnimatePresence mode="wait">
          {/* TAB 1: ROOM STATUS */}
          {activeTab === 'rooms' && (
            <motion.div
              key="rooms"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  variants={itemVariants}
                  layout
                  className="bg-hotel-card rounded-2xl p-5 border border-slate-900 hover:border-slate-800 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[200px]"
                >
                  <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl opacity-10 bg-hotel-accent" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-100 tracking-tight">Room {room.id}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`h-2 w-2 rounded-full ${room.status === 'occupied' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wide ${room.status === 'occupied' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {room.status === 'occupied' ? 'เช็คอินแล้ว' : 'ห้องว่าง'}
                        </span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${room.power ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-950 text-slate-600 border-slate-900'}`}>
                      {room.power ? <Zap size={20} className="fill-current" /> : <ZapOff size={20} />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-900/60">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">การจ่ายไฟ</span>
                      <p className={`text-sm font-semibold mt-0.5 ${room.power ? 'text-amber-400' : 'text-slate-500'}`}>
                        {room.power ? 'ON (เสียบการ์ด)' : 'OFF'}
                      </p>
                    </div>

                    <div className="flex justify-end items-end">
                      {room.status === 'occupied' && (
                        <button
                          onClick={() => handleCheckout(room.id)}
                          className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-lg transition-colors border border-rose-500/20 font-medium"
                        >
                          <LogOut size={12} /> เช็คเอาท์
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* TAB 2: PENDING APPROVALS */}
          {activeTab === 'approvals' && (
            <motion.div
              key="approvals"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {pendingApprovals.length === 0 ? (
                <div className="bg-hotel-card rounded-2xl border border-slate-900 p-12 text-center text-slate-500 max-w-xl mx-auto flex flex-col items-center">
                  <ShieldAlert className="text-slate-600 mb-3" size={48} />
                  <h3 className="text-lg font-bold text-slate-300">ไม่มีรายการค้างอนุมัติ</h3>
                  <p className="text-sm mt-1">คำสั่งเสี่ยงสูงทั้งหมดถูกดำเนินการหรือถูกปฏิเสธแล้ว</p>
                </div>
              ) : (
                pendingApprovals.map((req) => {
                  const timeLeft = Math.max(0, Math.round((new Date(req.pending_expires_at).getTime() - Date.now()) / 1000));
                  return (
                    <div key={req.approval_id} className="bg-hotel-card border border-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col lg:flex-row justify-between gap-6 hover:shadow-xl transition-all">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                      
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {req.classification.riskCode} - {req.classification.riskName}
                          </span>
                          <span className="bg-rose-950 text-rose-400 border border-rose-900 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {req.classification.riskLevel}
                          </span>
                          <span className="text-slate-500 text-xs flex items-center gap-1 ml-auto lg:ml-0">
                            <Clock size={12} /> ขอเมื่อ: {new Date(req.requested_at).toLocaleTimeString('th-TH')}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-100">
                          คำสั่ง {req.command.command_type} ➡️ ห้อง {req.command.target_rooms.join(', ')}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          ⚠️ *เหตุผลความเสี่ยง:* {req.classification.reason}
                        </p>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-slate-500">
                          <div>ร้องขอโดย: <span className="text-slate-300 font-medium">{req.command.requested_by}</span></div>
                          <div>ช่องทาง: <span className="text-slate-300 font-medium">{req.command.source}</span></div>
                          <div>Trace ID: <span className="text-slate-300 font-mono">{req.trace_id}</span></div>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col justify-end items-center lg:items-end gap-3 lg:border-l lg:border-slate-900 lg:pl-6 min-w-[200px]">
                        <div className="text-xs text-amber-500 font-bold mb-0 lg:mb-2 flex items-center gap-1.5">
                          <Clock size={14} className="animate-pulse" />
                          เหลือเวลา: {timeLeft} วินาที
                        </div>

                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => openActionModal(req.approval_id, 'approve')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
                          >
                            <Check size={14} /> อนุมัติ (Approve)
                          </button>
                          <button
                            onClick={() => openActionModal(req.approval_id, 'reject')}
                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/20"
                          >
                            <X size={14} /> ปฏิเสธ (Reject)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* TAB 3: AUDIT LOG */}
          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-hotel-card border border-slate-900 rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4">เวลา</th>
                      <th className="p-4">เหตุการณ์</th>
                      <th className="p-4">คำสั่ง</th>
                      <th className="p-4">ห้อง</th>
                      <th className="p-4">แอดมิน / ผู้อนุมัติ</th>
                      <th className="p-4">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-sm text-slate-300">
                    {auditLogs.map((log) => (
                      <tr key={log.event_id} className="hover:bg-slate-950/30 transition-colors">
                        <td className="p-4 whitespace-nowrap text-slate-500 text-xs">
                          {new Date(log.timestamp).toLocaleString('th-TH')}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                            log.event_type === 'APPROVED' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.event_type === 'REJECTED'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : log.event_type === 'AUTO_PASSED'
                              ? 'bg-slate-900 text-slate-400 border border-slate-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {log.event_type}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-200">{log.command_type}</td>
                        <td className="p-4 text-hotel-accent font-mono">{log.target_rooms || '-'}</td>
                        <td className="p-4 text-xs">{log.decided_by || log.requested_by || 'system'}</td>
                        <td className="p-4 text-slate-400 text-xs max-w-xs truncate">{log.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Modal (Approve/Reject Reason) */}
      <AnimatePresence>
        {showReasonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReasonModal(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-hotel-card border border-slate-800 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-3">
                {modalAction === 'approve' ? (
                  <>
                    <Check className="text-emerald-500" />
                    ยืนยันการอนุมัติคำสั่ง
                  </>
                ) : (
                  <>
                    <X className="text-rose-500" />
                    ยืนยันการปฏิเสธคำสั่ง
                  </>
                )}
              </h3>
              
              <p className="text-slate-400 text-sm mb-4">
                กรุณาระบุเหตุผลในการกดยืนยัน (เหตุผลนี้จะถูกเก็บถาวรในประวัติ Audit Log เพื่อความโปร่งใส)
              </p>

              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="ระบุเหตุผลที่นี่..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-900 focus:border-hotel-accent focus:ring-1 focus:ring-hotel-accent rounded-xl p-3 text-slate-200 text-sm outline-none resize-none mb-5"
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowReasonModal(false)}
                  className="bg-slate-950 text-slate-400 border border-slate-900 hover:bg-slate-900 hover:text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={submitApprovalAction}
                  disabled={isSubmittingAction}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 ${
                    modalAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/20'
                  }`}
                >
                  {isSubmittingAction ? (
                    'กำลังบันทึก...'
                  ) : (
                    <>
                      {modalAction === 'approve' ? <Check size={14} /> : <X size={14} />}
                      บันทึกคำอนุมัติ
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* System Console */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-hotel-accent" />
          ระบบควบคุมเทอร์มินัล (System Console)
        </h2>
        <TerminalStatus />
      </div>
    </div>
  );
};

export default Dashboard;

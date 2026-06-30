import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, Users, UserX, BedDouble, LogOut } from 'lucide-react';
import TerminalStatus from '../components/TerminalStatus';
interface Room {
  id: number;
  status: 'occupied' | 'vacant';
  power: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const Dashboard = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckout = async (roomId: number) => {
    try {
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: roomId })
      });
      fetchRooms(); // Refresh UI immediately
    } catch (error) {
      console.error("Checkout failed", error);
    }
  };

  const stats = {
    total: rooms.length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    vacant: rooms.filter((r) => r.status === 'vacant').length,
    powerOn: rooms.filter((r) => r.power).length,
  };

  if (isLoading) {
    return <div className="text-white">Loading room statuses...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Room Status
          </h1>
          <p className="text-slate-400 mt-1">Real-time overview of all hotel rooms</p>
        </div>

        <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="bg-hotel-card border border-slate-800 rounded-xl px-4 py-3 min-w-[120px] flex items-center gap-3">
            <div className="p-2 bg-hotel-accent/10 text-hotel-accent rounded-lg">
              <BedDouble size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="bg-hotel-card border border-slate-800 rounded-xl px-4 py-3 min-w-[120px] flex items-center gap-3">
            <div className="p-2 bg-hotel-success/10 text-hotel-success rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Occupied</p>
              <p className="text-xl font-bold">{stats.occupied}</p>
            </div>
          </div>
          <div className="bg-hotel-card border border-slate-800 rounded-xl px-4 py-3 min-w-[120px] flex items-center gap-3">
            <div className="p-2 bg-hotel-warning/10 text-hotel-warning rounded-lg">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Power On</p>
              <p className="text-xl font-bold">{stats.powerOn}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence>
          {rooms.map((room) => (
            <motion.div
              key={room.id}
              variants={itemVariants}
              layout
              className="bg-hotel-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-colors relative overflow-hidden group flex flex-col justify-between min-h-[220px]"
            >
              {/* Background gradient hint */}
              <div
                className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${
                  room.status === 'occupied' ? 'bg-hotel-success' : 'bg-slate-500'
                }`}
              />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {room.id}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`relative flex h-2 w-2 ${
                        room.status === 'occupied' ? 'text-hotel-success' : 'text-slate-500'
                      }`}
                    >
                      {room.status === 'occupied' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-40"></span>
                      )}
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                    </span>
                    <span
                      className={`text-sm font-medium capitalize ${
                        room.status === 'occupied' ? 'text-hotel-success' : 'text-slate-500'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: room.power ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                    color: room.power ? '#3b82f6' : '#64748b',
                  }}
                  className="p-3 rounded-xl border border-slate-700/50 shadow-inner"
                >
                  {room.power ? <Zap size={24} className="drop-shadow-lg" /> : <ZapOff size={24} />}
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase font-semibold mb-1">Guest</span>
                  {room.status === 'occupied' ? (
                    <div className="flex items-center gap-1 text-sm text-slate-300">
                      <Users size={14} /> In Room
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <UserX size={14} /> Empty
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  {room.status === 'occupied' && (
                    <button
                      onClick={() => handleCheckout(room.id)}
                      className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
                    >
                      <LogOut size={14} /> Checkout
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Server Status Terminal */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-300 mb-4">System Console</h2>
        <TerminalStatus />
      </div>
    </div>
  );
};

export default Dashboard;


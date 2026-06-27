import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, Users, UserX, BedDouble } from 'lucide-react';

interface Room {
  id: number;
  status: 'occupied' | 'vacant';
  power: boolean;
}

const mockRooms: Room[] = [
  { id: 101, status: 'occupied', power: true },
  { id: 102, status: 'vacant', power: false },
  { id: 103, status: 'occupied', power: true },
  { id: 104, status: 'vacant', power: false },
  { id: 105, status: 'occupied', power: false }, // Occupied but keycard out
  { id: 106, status: 'vacant', power: false },
];

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
  const [rooms, setRooms] = useState<Room[]>(mockRooms);

  // Simulate real-time updates for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      setRooms((current) =>
        current.map((room) => {
          // Randomly flip power for one occupied room occasionally
          if (room.id === 105 && Math.random() > 0.7) {
            return { ...room, power: !room.power };
          }
          return room;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: rooms.length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    vacant: rooms.filter((r) => r.status === 'vacant').length,
    powerOn: rooms.filter((r) => r.power).length,
  };

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
              className="bg-hotel-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-colors relative overflow-hidden group"
            >
              {/* Background gradient hint */}
              <div
                className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${
                  room.status === 'occupied' ? 'bg-hotel-success' : 'bg-slate-500'
                }`}
              />

              <div className="flex justify-between items-start mb-6">
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

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase font-semibold mb-1">Guest</span>
                  {room.status === 'occupied' ? (
                    <div className="flex items-center gap-1 text-sm text-slate-300">
                      <Users size={14} /> Checked In
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <UserX size={14} /> Empty
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase font-semibold mb-1">Relay</span>
                  <div
                    className={`text-sm font-medium ${
                      room.power ? 'text-hotel-accent' : 'text-slate-600'
                    }`}
                  >
                    {room.power ? 'Active (220V)' : 'Cut-off'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Dashboard;

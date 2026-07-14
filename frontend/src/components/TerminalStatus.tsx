import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

const TerminalStatus = () => {
  const [uptime, setUptime] = useState(0);
  const [cpu, setCpu] = useState<number>(0);
  const [ram, setRam] = useState<number>(0);
  const [wlanDown, setWlanDown] = useState<string>('0.000');
  const [wlanUp, setWlanUp] = useState<string>('0.000');
  const [logs, setLogs] = useState<{ id: number, text: string, type: string }[]>([
    { id: 1, text: "System initialized and ready.", type: 'sys' }
  ]);

  useEffect(() => {
    const uptimeInterval = setInterval(() => setUptime((u) => u + 1), 1000);
    
    const eventSource = new EventSource('/api/telemetry/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'metrics') {
          setCpu(payload.data.cpu);
          setRam(payload.data.ram);
          setWlanDown(payload.data.wlanDown);
          setWlanUp(payload.data.wlanUp);
        } else if (payload.type === 'pbx' || payload.type === 'sys') {
          const timestamp = new Date().toLocaleTimeString('en-GB');
          setLogs(prev => {
            const newLogs = [...prev, { id: Date.now(), text: `[${timestamp}] ${payload.data}`, type: payload.type }];
            return newLogs.slice(-5); // Keep last 5 logs
          });
        }
      } catch (err) {
        console.error('SSE Parse Error', err);
      }
    };

    return () => {
      clearInterval(uptimeInterval);
      eventSource.close();
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="bg-[#0f1115] border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
      {/* Metrics Sidebar */}
      <div className="bg-[#15181e] p-6 border-b md:border-b-0 md:border-r border-slate-800/60 w-full md:w-64 flex flex-col gap-6">
        <div className="flex items-center gap-3 text-slate-200">
          <div className="p-2 bg-hotel-accent/10 rounded-lg text-hotel-accent">
            <Server size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Center Node</h3>
            <p className="text-xs text-slate-500">Raspberry Pi 4</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* CPU Metric */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5"><Cpu size={12}/> CPU Usage</span>
              <span className="font-medium text-slate-200">{cpu}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${cpu}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* RAM Metric */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5"><HardDrive size={12}/> RAM Usage</span>
              <span className="font-medium text-slate-200">{ram}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-hotel-accent"
                initial={{ width: 0 }}
                animate={{ width: `${ram}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Network Metric */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Wifi size={12} className="text-slate-500" /> wlan0 Traffic
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Down: <span className="text-slate-300">{wlanDown}</span> MB/s</span>
              <span className="text-slate-500">Up: <span className="text-slate-300">{wlanUp}</span> MB/s</span>
            </div>
          </div>
          
          {/* Uptime */}
          <div className="pt-2 border-t border-slate-800/60">
             <div className="text-xs text-slate-500 flex justify-between">
                <span>Uptime</span>
                <span className="text-slate-300 font-mono">{formatUptime(uptime)}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Logs View */}
      <div className="p-6 flex-1 bg-[#0f1115] relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Activity size={14} /> System Logs
          </h4>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        
        <div className="font-mono text-[11px] sm:text-xs text-slate-400 leading-relaxed space-y-1.5">
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`pl-3 border-l-2 py-1 ${
                  log.type === 'pbx' 
                    ? 'border-hotel-accent text-hotel-accent/90 bg-hotel-accent/5' 
                    : 'border-slate-700 hover:bg-slate-800/30'
                }`}
              >
                {log.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-hotel-accent/5 blur-[80px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
};

export default TerminalStatus;


import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TerminalStatus = () => {
  const [blink, setBlink] = useState(true);
  const [uptime, setUptime] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    "[PM2] Starting /home/admin/RelaySync/backend/server.js in fork_mode",
    "[PM2] Done.",
    "[PM2] Starting /home/admin/RelaySync/pbx-connector/index.js in fork_mode",
    "[PM2] Done.",
  ]);

  useEffect(() => {
    const cursorInterval = setInterval(() => setBlink((b) => !b), 500);
    const uptimeInterval = setInterval(() => setUptime((u) => u + 1), 1000);
    
    // Simulate some incoming PBX logs
    const logInterval = setInterval(() => {
      const msgs = [
        "[PBX] 💓 Heartbeat OK",
        "[PBX] ⚡ Syncing room states...",
        "[API] GET /api/rooms 200 OK",
        "[SYS] Memory usage stable at 39.2%"
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      setLogs(prev => [...prev.slice(-3), randomMsg]);
    }, 4500);

    return () => {
      clearInterval(cursorInterval);
      clearInterval(uptimeInterval);
      clearInterval(logInterval);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="bg-[#0c0c0c] border border-slate-700 rounded-xl overflow-hidden shadow-2xl font-mono text-xs sm:text-sm">
      {/* Terminal Header */}
      <div className="bg-[#1e1e1e] px-4 py-2 flex items-center gap-2 border-b border-slate-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-slate-400 text-xs ml-2">admin@center-node: ~/RelaySync</div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 text-[#00ff00] leading-relaxed overflow-x-auto hide-scrollbar">
        <div className="mb-4">
          <p className="text-[#00ffff]">host metrics | cpu: 8.8% | ram usage: 39.2% | wlan0: ⇓ 0.223mb/s ⇑ 0.013mb/s |</p>
          <p>uptime: {formatUptime(uptime)}</p>
        </div>

        <pre className="text-[#00ff00] mb-4">
{`┌────┬────────────────┬───────────┬────────┬──────────┐
│ id │ name           │ status    │ cpu    │ mem      │
├────┼────────────────┼───────────┼────────┼──────────┤
│ 0  │ hotel-backend  │ online    │ 0%     │ 60.9mb   │
│ 1  │ pbx-connector  │ online    │ 0%     │ 56.0mb   │
└────┴────────────────┴───────────┴────────┴──────────┘`}
        </pre>

        <div className="text-[#aaaaaa]">
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={log.includes('[PBX]') ? 'text-[#00ffff]' : ''}
            >
              {log}
            </motion.div>
          ))}
        </div>
        
        <div className="mt-2 flex items-center">
          <span className="text-white mr-2">admin@center-node:~$</span> 
          <span className={`w-2 h-4 bg-[#00ff00] inline-block ${blink ? 'opacity-100' : 'opacity-0'}`}></span>
        </div>
      </div>
    </div>
  );
};

export default TerminalStatus;

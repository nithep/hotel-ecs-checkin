import { Link } from 'react-router-dom';
import { PlayCircle, ArrowRight } from 'lucide-react';

const Presentation = () => {
  return (
    <div className="relative w-full h-[85vh] bg-slate-950 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-800 shadow-2xl group">
      
      {/* Video Placeholder Background */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center opacity-30">
        <PlayCircle size={80} className="text-slate-600 mb-4 animate-pulse" />
        <p className="text-slate-500 font-mono text-sm">[ Cinematic AI Video Placeholder ]</p>
        <p className="text-slate-600 font-mono text-xs mt-2 text-center max-w-md">
          Scene 1: Lobby Arrival <br />
          Scene 2: QR Scan <br />
          Scene 3: Lights turning on
        </p>
      </div>

      {/* Overlay Content */}
      <div className="relative z-10 text-center space-y-8 max-w-2xl px-6">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-hotel-accent to-purple-400 drop-shadow-lg">
          Smart Hotel Experience
        </h1>
        <p className="text-xl text-slate-300 font-light">
          Experience the seamless transition from digital check-in to physical comfort. 
          Powered by Digital Twin technology.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            to="/scan"
            className="px-8 py-4 bg-hotel-accent hover:bg-blue-600 text-white rounded-full font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-hotel-accent/30 flex items-center gap-2"
          >
            Try Self Check-in <ArrowRight size={20} />
          </Link>
          <Link
            to="/dashboard"
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold text-lg transition-all active:scale-95 border border-slate-700"
          >
            Staff Dashboard
          </Link>
        </div>
      </div>

      {/* Cinematic Bars */}
      <div className="absolute top-0 left-0 w-full h-16 bg-black z-20"></div>
      <div className="absolute bottom-0 left-0 w-full h-16 bg-black z-20"></div>
    </div>
  );
};

export default Presentation;

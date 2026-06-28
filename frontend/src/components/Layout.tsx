import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, QrCode } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-hotel-dark">
      {/* Background glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-hotel-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <header className="sticky top-0 z-50 border-b border-slate-800 bg-hotel-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-hotel-accent to-blue-700 flex items-center justify-center shadow-lg shadow-hotel-accent/20">
                <span className="font-bold text-white text-lg">H</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">Smart Hotel</span>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/"
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === '/' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {location.pathname === '/' && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-slate-800 rounded-md -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="hidden sm:inline">Presentation</span>
              </Link>

              <Link
                to="/dashboard"
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === '/dashboard' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {location.pathname === '/dashboard' && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-slate-800 rounded-md -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link
                to="/scan"
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === '/scan' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {location.pathname === '/scan' && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-slate-800 rounded-md -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <QrCode size={18} />
                <span className="hidden sm:inline">Check-in</span>
              </Link>

              <Link
                to="/manual"
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  location.pathname === '/manual' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {location.pathname === '/manual' && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-slate-800 rounded-md -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="hidden sm:inline">Manual</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;

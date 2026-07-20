import { useState, useEffect } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, CheckCircle2, Shield, UserCog, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import api from '../lib/api';

// Type definitions for role-specific themes
type RoleTheme = {
  primary: string;
  secondary: string;
  accent: string;
  glowColor: string;
  welcomeText: string;
  icon: React.ReactNode;
  buttonGradient: string;
  borderGlow: string;
};

const roleThemes: Record<'admin' | 'staff', RoleTheme> = {
  admin: {
    primary: 'from-slate-950 via-slate-900 to-slate-950',
    secondary: 'bg-slate-900/80 backdrop-blur-xl',
    accent: 'text-amber-400',
    glowColor: 'shadow-amber-500/30',
    welcomeText: 'Welcome, Administrator',
    icon: <Shield className="w-8 h-8 text-amber-400" />,
    buttonGradient: 'from-amber-600 via-amber-500 to-gold-500 hover:from-amber-500 hover:via-amber-400 hover:to-gold-400',
    borderGlow: 'border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]',
  },
  staff: {
    primary: 'from-slate-950 via-emerald-950/10 to-slate-950',
    secondary: 'bg-slate-900/80 backdrop-blur-xl',
    accent: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/30',
    welcomeText: 'Front Desk Access Granted',
    icon: <UserCog className="w-8 h-8 text-emerald-400" />,
    buttonGradient: 'from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400',
    borderGlow: 'border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]',
  },
};

const Login = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'success'>('idle');
  const [detectedRole, setDetectedRole] = useState<'admin' | 'staff' | null>(null);
  const [shakeError, setShakeError] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const { setRole, setToken } = useAuth();
  const navigate = useNavigate();

  // Auto-detect role based on PIN input with smooth transition
  useEffect(() => {
    if (pin === '9999') {
      setDetectedRole('admin');
      setError('');
      generateParticles();
    } else if (pin === '1234') {
      setDetectedRole('staff');
      setError('');
      generateParticles();
    } else {
      setDetectedRole(null);
      setParticles([]);
    }
  }, [pin]);

  // Generate floating particles for visual effect
  const generateParticles = () => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setParticles(newParticles);
  };

  // Trigger shake animation on error
  useEffect(() => {
    if (error) {
      setShakeError(true);
      const timer = setTimeout(() => setShakeError(false), 600);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate PIN length
    if (pin.length !== 4) {
      setError('กรุณากรอกรหัส PIN 4 หลัก');
      return;
    }

    setIsLoading(true);
    setValidationState('validating');

    try {
      // Calls backend verify-pin endpoint
      const response = await api.post('/auth/verify-pin', { pin });
      const { success, token, role } = response.data;

      if (success && token) {
        // Map backend roles -> frontend roles
        const mappedRole: UserRole =
          role === 'owner' ? 'admin' :
          role === 'front_desk' ? 'staff' : 'guest';

        setValidationState('success');
        
        // Delay for visual feedback before navigation
        setTimeout(() => {
          setToken(token);
          setRole(mappedRole);

          // Redirect based on role
          if (mappedRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/staff/dashboard');
          }
        }, 1500);
      }
    } catch (err: any) {
      setValidationState('idle');
      setError(err.response?.data?.error || 'เข้าสู่ระบบล้มเหลว โปรดตรวจสอบรหัส PIN');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current theme based on detected role
  const currentTheme = detectedRole ? roleThemes[detectedRole] : null;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme?.primary || 'from-slate-950 via-slate-900 to-slate-950'} flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-700`}>
      
      {/* Animated Background Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-1 h-1 rounded-full animate-float opacity-30 ${detectedRole === 'admin' ? 'bg-amber-400' : detectedRole === 'staff' ? 'bg-emerald-400' : 'bg-purple-400'}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Dynamic Background Gradients with Pulse */}
      <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${detectedRole === 'admin' ? 'bg-amber-600/20 animate-pulse-slow' : detectedRole === 'staff' ? 'bg-emerald-600/20 animate-pulse-slow' : 'bg-purple-600/30'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${detectedRole === 'admin' ? 'bg-gold-500/15 animate-pulse-slow' : detectedRole === 'staff' ? 'bg-teal-500/15 animate-pulse-slow' : 'bg-emerald-600/20'}`} />

      <div className={`relative z-10 w-full max-w-md transition-all duration-500 ${shakeError ? 'animate-shake' : ''}`}>
        <div className={`${currentTheme?.secondary || 'bg-slate-900/80 backdrop-blur-xl'} p-8 rounded-3xl border ${detectedRole === 'admin' ? 'border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]' : detectedRole === 'staff' ? 'border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : 'border-slate-800 shadow-2xl'} transition-all duration-700 relative overflow-hidden`}>
          
          {/* Subtle scanning line animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className={`absolute w-full h-px ${detectedRole === 'admin' ? 'bg-gradient-to-r from-transparent via-amber-500/20 to-transparent' : detectedRole === 'staff' ? 'bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent' : 'bg-gradient-to-r from-transparent via-purple-500/20 to-transparent'} animate-scan`} />
          </div>

          {/* Header Section with Dynamic Icon */}
          <div className="text-center mb-8 relative">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all duration-500 relative ${detectedRole === 'admin' ? 'bg-amber-500/10 ring-2 ring-amber-500/20' : detectedRole === 'staff' ? 'bg-emerald-500/10 ring-2 ring-emerald-500/20' : 'bg-purple-500/10'}`}>
              {currentTheme?.icon || <LogIn className="w-8 h-8 text-purple-400" />}
              
              {/* Sparkle effect on role detection */}
              {detectedRole && currentTheme && validationState !== 'success' && (
                <Sparkles className={`absolute -top-1 -right-1 w-5 h-5 ${currentTheme.accent} animate-twinkle`} />
              )}
            </div>
            
            {/* Welcome Message Animation with Glow */}
            {validationState === 'success' && detectedRole && currentTheme && (
              <div className="mb-4 animate-fade-in-up">
                <p className={`text-lg font-semibold ${currentTheme.accent} flex items-center justify-center gap-2 relative`}>
                  <CheckCircle2 className="w-5 h-5 animate-bounce-subtle" />
                  <span className="relative">
                    {currentTheme.welcomeText}
                    <span className={`absolute inset-0 blur-lg ${currentTheme.accent} opacity-50`}>{currentTheme.welcomeText}</span>
                  </span>
                </p>
              </div>
            )}
            
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight relative">
              เข้าสู่ระบบ
              {detectedRole && currentTheme && (
                <span className={`absolute -top-1 -right-8 ${currentTheme.accent} animate-pulse`}>
                  <Sparkles className="w-4 h-4" />
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm">ระบุรหัส PIN เพื่อเข้าถึงแผงควบคุมระบบ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1 flex items-center gap-2">
                รหัส PIN (Owner / Front Desk)
                {detectedRole && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${detectedRole === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'} animate-fade-in`}>
                    {detectedRole === 'admin' ? '👑 Admin' : '🎯 Staff'}
                  </span>
                )}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-all duration-300 ${inputFocused ? 'scale-110' : ''} ${detectedRole === 'admin' ? 'text-amber-400' : detectedRole === 'staff' ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  className={`w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border ${detectedRole === 'admin' ? 'focus:border-amber-500 focus:ring-amber-500/50' : detectedRole === 'staff' ? 'focus:border-emerald-500 focus:ring-emerald-500/50' : 'focus:border-purple-500 focus:ring-purple-500/50'} focus:ring-2 rounded-xl text-white placeholder-slate-500 transition-all outline-none ${inputFocused ? 'scale-[1.02] shadow-lg' : ''}`}
                  placeholder="••••"
                  required
                  maxLength={4}
                  autoComplete="off"
                />
                
                {/* PIN Dots Indicator */}
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i < pin.length
                          ? detectedRole === 'admin'
                            ? 'bg-amber-400 scale-110'
                            : detectedRole === 'staff'
                            ? 'bg-emerald-400 scale-110'
                            : 'bg-purple-400'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Validation Indicator */}
                {validationState === 'validating' && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin text-slate-400" />
                  </div>
                )}
                
                {validationState === 'success' && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <CheckCircle2 className={`w-5 h-5 ${currentTheme?.accent || 'text-emerald-400'} animate-scale-in`} />
                  </div>
                )}
              </div>
              
              {error && (
                <p className="text-red-400 text-sm mt-2 ml-1 flex items-center gap-2 animate-fade-in bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || validationState === 'success'}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 px-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r ${currentTheme?.buttonGradient || 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'} text-white ${currentTheme?.glowColor || 'shadow-purple-500/25'} relative overflow-hidden group`}
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังยืนยัน...</span>
                </div>
              ) : validationState === 'success' ? (
                <>
                  <span>กำลังนำทาง</span>
                  <ArrowRight className="w-5 h-5 animate-pulse" />
                </>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              © 2026 Hotel ECS System. Protected by PDPA.
            </p>
          </div>
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        
        @keyframes scan {
          0% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8) rotate(180deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;

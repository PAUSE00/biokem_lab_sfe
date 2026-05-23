import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker, LogIn, Lock, Mail } from 'lucide-react';
import api from '../services/api';

import { useAuth } from '../services/AuthContext';
import LaboratoryBackground from '../components/LaboratoryBackground';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError('Identifiants fournis invalides.');
      } else {
        setError('Impossible de se connecter au serveur. Laravel est-il en cours d\'exécution ?');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 font-sans relative bg-[#070b11] text-slate-100 overflow-hidden">
      <LaboratoryBackground />
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />
      
      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-[#0d131f]/90 border border-[#00f0ff]/30 p-3 rounded-lg text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)] animate-pulse">
            <Beaker className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-100 tracking-wider uppercase glow-cyan">
            CHEMLAB LIMS
          </h2>
          <p className="mt-1.5 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
            SECURE ACCESS CORE / SYSTEM-III
          </p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel rounded-xl p-6 shadow-2xl relative overflow-hidden">
          {/* Scientific decorative laser scanning line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-60 animate-[sweep-laser_4s_linear_infinite]" />
          
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="bg-[#ff2e63]/10 text-[#ff2e63] p-3 rounded-lg text-[11px] font-mono border border-[#ff2e63]/25 flex items-start">
                <span className="mr-1.5 font-bold">// ALERT:</span>
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Adresse e-mail</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-[#00f0ff] transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 px-3.5 py-2.5 bg-[#070b11]/85 border border-[#1e293b] rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all text-xs font-mono"
                  placeholder="admin@chemlab.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Mot de passe</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 px-3.5 py-2.5 bg-[#070b11]/85 border border-[#1e293b] rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/20 transition-all text-xs font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[#00f0ff] text-[#070b11] focus:ring-[#00f0ff]/20 border-[#1e293b] rounded bg-[#070b11]"
                />
                <label htmlFor="remember-me" className="ml-1.5 block text-slate-400 font-mono tracking-wide select-none">
                  Se souvenir de moi
                </label>
              </div>

              <div>
                <a href="#" className="font-mono text-[#00f0ff] hover:underline transition-colors tracking-wide">
                  Identifiants perdus ?
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-[#00f0ff]/30 rounded-lg text-xs font-bold text-[#070b11] bg-[#00f0ff] hover:bg-[#00f0ff]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f0ff] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)] font-mono uppercase tracking-wider"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#070b11]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AUTHENTICATING...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    INITIALIZE CONSOLE
                  </span>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-4 pt-4 border-t border-[#1e293b]">
            <p className="text-[10px] text-center text-slate-400 font-mono uppercase tracking-widest leading-relaxed">
              DEMO ACCESS:<br/>
              <span className="text-[#00f0ff] font-bold">admin@chemlab.com</span> / <span className="text-[#a3e635] font-bold">password</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

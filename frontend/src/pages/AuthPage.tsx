import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Mail, Lock, User, Phone, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isLogin && (!name || !phoneNumber)) {
      setError('Please provide your full name and verified phone number for WhatsApp alerts.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.token, res.data.user);
        navigate('/upload');
      } else {
        const res = await api.post('/auth/signup', {
          name,
          email,
          password,
          phone_number: phoneNumber
        });
        login(res.data.token, res.data.user);
        navigate('/upload');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        
        {/* Background Ambient Glow */}
        <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative glass-card rounded-3xl p-8 shadow-2xl border border-slate-800"
        >
          {/* Header Branding */}
          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <Link to="/" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/30">
              <div className="flex h-full w-full items-center justify-center rounded-[14px]" style={{ backgroundColor: 'var(--color-surface-3)' }}>
                <Cpu className="h-6 w-6 text-cyan-400" />
              </div>
            </Link>
            <h2 className="text-2xl font-extrabold text-slate-100">
              {isLogin ? 'Welcome Back to InsightX' : 'Create InsightX Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {isLogin ? 'Enter your credentials to access ML reports' : 'Register with verified phone for WhatsApp risk alerts'}
            </p>
          </div>

          {/* Toggle Switch Tabs */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isLogin ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isLogin ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {!isLogin && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@techcorp.io"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Verified Phone Number (For WhatsApp Alerts)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+14155552671"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    required={!isLogin}
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Stored in MongoDB and used to deliver Twilio WhatsApp risk reports.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Complete Registration'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </motion.div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Settings, Phone, Key, ShieldCheck, History, AlertTriangle, CheckCircle2, Loader2, Github, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phone_number || '');
  const [groqKey, setGroqKey] = useState<string>('');
  const [twilioSid, setTwilioSid] = useState<string>('');
  const [twilioToken, setTwilioToken] = useState<string>('');
  const [githubToken, setGithubToken] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }

    const fetchHistory = async () => {
      try {
        const res = await api.get('/ml/history');
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load project history:", err);
      }
    };

    fetchHistory();
  }, [user]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg(null);

    try {
      const res = await api.put('/auth/settings', {
        phone_number: phoneNumber,
        groq_api_key: groqKey || undefined,
        twilio_account_sid: twilioSid || undefined,
        twilio_auth_token: twilioToken || undefined,
        github_token: githubToken || undefined
      });
      updateUser(res.data.user);
      setSuccessMsg('Settings and WhatsApp phone number successfully updated in MongoDB!');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-4">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
          <Settings className="h-8 w-8 text-cyan-400" />
          <span>Platform & User Settings</span>
        </h1>
        <p className="text-sm text-slate-400">
          Manage your verified WhatsApp phone number, Groq/Twilio credentials, appearance themes, and past project history.
        </p>
      </div>

      {/* Profile & WhatsApp Settings Form */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col gap-6 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3">
          User Profile & WhatsApp Configuration
        </h3>

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateSettings} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold settings-label">Name</label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="settings-input w-full rounded-xl border py-2.5 px-4 text-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold settings-label">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="settings-input w-full rounded-xl border py-2.5 px-4 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold settings-label">
              Verified WhatsApp Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+14155552671"
                className="settings-input w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <span className="text-[11px] settings-hint">
              Used as default recipient for Twilio WhatsApp risk alerts.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold settings-label">Groq API Key (Optional)</label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="settings-input w-full rounded-xl border py-2.5 px-4 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold settings-label">Twilio Account SID (Optional)</label>
              <input
                type="password"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                placeholder="AC..."
                className="settings-input w-full rounded-xl border py-2.5 px-4 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold settings-label">Twilio Auth Token (Optional)</label>
              <input
                type="password"
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
                placeholder="Token..."
                className="settings-input w-full rounded-xl border py-2.5 px-4 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold settings-label">GitHub Personal Access Token (Optional)</label>
            <div className="relative">
              <Github className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="settings-input w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <span className="text-[11px] settings-hint">Enables live GitHub repo stats on the Intelligence Dashboard.</span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-slate-950 hover:scale-105 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Usage & Credit Intelligence */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Zap className="h-5 w-5 text-amber-400" />
          <h3 className="text-base font-bold text-slate-100">Usage & Credit Intelligence</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Projects Analyzed', value: history.length, color: 'text-cyan-400' },
            { label: 'Groq API Calls', value: history.length > 0 ? history.length : 0, color: 'text-purple-400' },
            { label: 'WhatsApp Alerts Sent', value: '—', color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase">{label}</span>
              <span className={`text-2xl font-extrabold font-mono ${color}`}>{value}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          Groq free tier: 14,400 requests/day. Twilio trial: 1 verified number. GitHub API: 5,000 req/hr with token.
        </p>
      </div>

      {/* Past Project History Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <History className="h-5 w-5 text-cyan-400" />
          <h3 className="text-base font-bold text-slate-100">Past Project ML Analyses</h3>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No past project analysis history recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">{item.project_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.filename} • {new Date(item.analyzed_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-red-400">Score: {item.risk_score}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {item.primary_failure}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

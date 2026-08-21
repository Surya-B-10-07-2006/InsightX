import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Phone, CheckCircle2, AlertCircle, Loader2, RefreshCw, ShieldAlert, FileText } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phone_number || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (user?.phone_number && !phoneNumber) {
        setPhoneNumber(user.phone_number);
      }
    }
  }, [isOpen, user]);

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 5) {
      setError('Please enter a valid WhatsApp phone number with country code (e.g. +14155552671)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/alerts/whatsapp', {
        project_id: projectId,
        phone_number_override: phoneNumber
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dispatch WhatsApp risk alert.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          />

          {/* Center-Screen Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-[101] w-full max-w-xl max-h-[88vh] rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl flex flex-col gap-5 overflow-y-auto"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-md">
                  <Send className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                    <span>Send WhatsApp Risk Alert</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Twilio API Gateway • <span className="text-slate-200 font-semibold">{projectName}</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Input Form */}
            {!result ? (
              <form onSubmit={handleSendAlert} className="flex flex-col gap-5">
                
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase text-slate-400">Recipient Phone Number</span>
                    <span className="text-[11px] font-mono text-cyan-400">WhatsApp E.164 Format</span>
                  </div>
                  
                  <div className="relative mt-1">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+14155552671"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <span className="text-[11px] text-slate-500 leading-normal mt-1">
                    Enter country code prefix e.g. <span className="font-mono text-slate-400">+1 415 555 2671</span> or <span className="font-mono text-slate-400">+91 98765 43210</span>.
                  </span>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-red-200">Dispatch Error</span>
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Dispatching Twilio Alert...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Dispatch WhatsApp Alert</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Twilio Result & Detailed Status View */
              <div className="flex flex-col gap-5">
                
                {/* Primary Status Card */}
                <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${
                  result.delivered
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : result.sandbox_note
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : result.sent_via_twilio_api
                    ? 'border-cyan-500/40 bg-cyan-500/10'
                    : 'border-red-500/40 bg-red-500/10'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {result.delivered ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                      ) : result.sandbox_note ? (
                        <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0" />
                      ) : result.sent_via_twilio_api ? (
                        <Send className="h-6 w-6 text-cyan-400 flex-shrink-0 animate-pulse" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                      )}

                      <h4 className={`text-base font-bold ${
                        result.delivered ? 'text-emerald-300'
                        : result.sandbox_note ? 'text-amber-300'
                        : result.sent_via_twilio_api ? 'text-cyan-300'
                        : 'text-red-300'
                      }`}>
                        {result.delivered ? 'WhatsApp Risk Alert Delivered!'
                          : result.sandbox_note ? 'Twilio Sandbox Join Required'
                          : result.sent_via_twilio_api ? 'Alert Dispatched — Pending Delivery'
                          : 'Twilio Delivery Failed'}
                      </h4>
                    </div>

                    <span className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold uppercase tracking-wide border ${
                      result.delivered ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : result.sandbox_note ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : result.sent_via_twilio_api ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}>
                      {result.delivered ? 'DELIVERED' : result.sandbox_note ? 'SANDBOX_JOIN' : result.sent_via_twilio_api ? 'SENT_PENDING' : 'FAILED'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {result.status_note}
                  </p>
                </div>

                {/* Key Twilio Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-[10px] text-slate-500 uppercase block">Recipient</span>
                    <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">{result.recipient_phone}</span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-[10px] text-slate-500 uppercase block">Twilio Status</span>
                    <span className="text-xs font-bold text-cyan-400 truncate block mt-0.5">{result.delivery_status || 'dispatched'}</span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Twilio SID</span>
                    <span className="text-xs font-bold text-slate-300 truncate block mt-0.5">{result.message_sid ? result.message_sid.slice(0, 14) + '...' : 'N/A'}</span>
                  </div>
                </div>

                {/* Twilio Sandbox Setup Instructions (Error 63015 / 63016) */}
                {result.sandbox_note && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Twilio Sandbox Setup Guide (Error 63015)</span>
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      Twilio requires WhatsApp recipient numbers to opt-in before receiving trial sandbox messages.
                    </p>
                    <div className="rounded-xl bg-slate-950 border border-amber-500/20 p-3.5 flex flex-col gap-1.5 text-xs font-mono text-amber-200">
                      <div>1. Open WhatsApp on your mobile phone.</div>
                      <div>2. Send WhatsApp message: <span className="text-cyan-300 font-bold">join &lt;your-sandbox-keyword&gt;</span> to <span className="text-cyan-300 font-bold">+1 415 523 8886</span>.</div>
                      <div className="text-slate-400 text-[11px] mt-1">Find your keyword at console.twilio.com &gt; Messaging &gt; Try it out &gt; Send a WhatsApp message.</div>
                    </div>
                  </div>
                )}

                {/* Error Detail Box */}
                {result.error_detail && !result.sandbox_note && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 text-xs text-red-300">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-red-200">Twilio Error Details</span>
                      <p className="leading-relaxed font-mono text-[11px] text-red-300">{result.error_detail}</p>
                    </div>
                  </div>
                )}

                {/* Scrollable Message Payload Preview */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-mono font-semibold uppercase text-slate-400">
                      Dispatched Message Content
                    </span>
                  </div>
                  <pre className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-[11px] font-mono text-cyan-300 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed shadow-inner">
                    {result.message_payload}
                  </pre>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setResult(null)}
                    className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Try Another Phone Number</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all"
                  >
                    Close Window
                  </button>
                </div>

              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


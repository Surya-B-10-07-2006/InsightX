import React from 'react';
import { X, Bell, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const notifications = [
    {
      id: 1,
      title: "ML Engine Pipeline Ready",
      message: "XGBoost, SHAP, and NetworkX dependency graph models fully bootstrapped.",
      time: "Just now",
      icon: ShieldCheck,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
    },
    {
      id: 2,
      title: "Twilio WhatsApp Ready",
      message: "WhatsApp risk alert integration configured for verified user phone number.",
      time: "2 mins ago",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    },
    {
      id: 3,
      title: "Security Shield Active",
      message: "ZIP upload secret parser active. Prohibits .env, credentials, and API key exposure.",
      time: "10 mins ago",
      icon: AlertTriangle,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm border-l border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100">Live Notifications</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border p-4 flex gap-3 transition-all ${n.color}`}
                >
                  <n.icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-100">{n.title}</span>
                    <p className="text-xs text-slate-300">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 text-center">
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

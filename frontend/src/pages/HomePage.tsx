import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, ShieldAlert, GitBranch, Clock, DollarSign, Send, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: ShieldAlert,
      title: "XGBoost Failure-Type Classification",
      description: "Classifies structural failure modes: Architecture Drift, Tech Debt Surge, API Bottlenecks, and Resource Exhaustion.",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: Cpu,
      title: "SHAP Explainable AI Attribution",
      description: "Calculates exact feature importance metrics explaining why a project is at risk with mathematical transparency.",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: GitBranch,
      title: "NetworkX Dependency Topology",
      description: "Maps interconnected code modules and betweenness centrality to isolate the root cause failure node.",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: Clock,
      title: "7/14/30-Day Risk Time Machine",
      description: "Simulates project risk trajectory over time under baseline velocity versus mitigated intervention speed.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: DollarSign,
      title: "Intervention ROI Calculator",
      description: "Calculates cost savings ($), delay days saved, and risk reduction percentage for every preventive action.",
      color: "from-pink-500 to-rose-600"
    },
    {
      icon: Send,
      title: "Twilio WhatsApp Risk Delivery",
      description: "Sends structured WhatsApp risk alerts to verified signup phone numbers stored securely in MongoDB.",
      color: "from-teal-400 to-cyan-600"
    }
  ];

  return (
    <div className="flex flex-col gap-16 py-6">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(to bottom, var(--color-surface-1), var(--color-page-bg))' }}>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono font-semibold"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>InsightX Production ML Platform 2026</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Predict Project Failures Before They Happen With{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              Explainable ML
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed"
          >
            Upload PHR PDFs or Project ZIP source code for instant static analysis, XGBoost risk classification, SHAP feature importance, NetworkX root-cause graphs, and automated WhatsApp risk alerts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link
              to={isAuthenticated ? "/upload" : "/auth"}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
            >
              <span>{isAuthenticated ? "Upload Project Now" : "Get Started / Register"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              <span>View Intelligence Dashboard</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Statistics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Predictive ML Engine", val: "80% XGB / RF", color: "text-cyan-400" },
          { label: "Generative AI Layer", val: "20% Groq LLaMA3", color: "text-purple-400" },
          { label: "SHAP Explainability", val: "100% Mathematical", color: "text-emerald-400" },
          { label: "Security Inspection", val: "Zero-Execution", color: "text-amber-400" }
        ].map((stat, idx) => (
          <div key={idx} className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${stat.color}`}>{stat.val}</span>
            <span className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            End-to-End Intelligence Suite
          </h2>
          <p className="text-sm text-slate-400">
            Designed for senior engineering managers, lead architects, and PMO executives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col gap-4"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${f.color} p-0.5 shadow-lg`}>
                <div className="flex h-full w-full items-center justify-center rounded-[10px]" style={{ backgroundColor: 'var(--color-surface-3)' }}>
                  <f.icon className="h-6 w-6 text-slate-100" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};

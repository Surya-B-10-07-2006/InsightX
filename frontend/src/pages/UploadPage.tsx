import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UploadCloud, FileText, FolderArchive, ShieldCheck, AlertTriangle,
  ArrowRight, Loader2, CheckCircle2, Lock, Github, GitBranch
} from 'lucide-react';
import { api } from '../services/api';
import { analyzeGitHubRepo } from '../services/api';
import { UploadResponse, GitHubAnalyzeResponse } from '../types';

type InputMode = 'file' | 'github';

export const UploadPage: React.FC = () => {
  const [mode, setMode] = useState<InputMode>('file');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  // GitHub state
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [githubToken, setGithubToken] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [githubResult, setGithubResult] = useState<GitHubAnalyzeResponse | null>(null);

  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setUploadResult(null);
    const fname = file.name.toLowerCase();
    if (!fname.endsWith('.pdf') && !fname.endsWith('.zip')) {
      setError('Only Project Health Report PDF (.pdf) or Source Code ZIP (.zip) files are allowed.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds maximum allowed 50MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await api.post<UploadResponse>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'File security inspection and upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGitHubAnalyze = async () => {
    if (!repoUrl.trim()) { setError('Please enter a GitHub repository URL.'); return; }
    setIsAnalyzing(true);
    setError(null);
    setGithubResult(null);
    try {
      const res = await analyzeGitHubRepo(repoUrl.trim(), githubToken.trim() || undefined);
      setGithubResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'GitHub repository analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProceedToML = () => {
    const pid = uploadResult?.project_id || githubResult?.project_id;
    if (pid) navigate(`/ml-running?project_id=${pid}`);
  };

  const handleProceedToDashboard = () => {
    if (githubResult?.project_id) navigate(`/dashboard?project_id=${githubResult.project_id}`);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-4">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
          <UploadCloud className="h-8 w-8 text-cyan-400" />
          <span>Upload Project for ML Analysis</span>
        </h1>
        <p className="text-sm text-slate-400">
          Upload a PHR PDF / ZIP archive, or analyze a GitHub repository directly. Source code is{' '}
          <span className="text-cyan-400 font-bold">NEVER executed</span>.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-1.5 w-fit">
        <button
          onClick={() => { setMode('file'); setError(null); setGithubResult(null); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'file'
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="h-4 w-4" /> PDF / ZIP Upload
        </button>
        <button
          onClick={() => { setMode('github'); setError(null); setUploadResult(null); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'github'
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Github className="h-4 w-4" /> GitHub Repository
        </button>
      </div>

      {/* Security Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-slate-200">InsightX Zero-Trust Security Protocol</span>
            <span className="text-xs text-slate-400">Prohibits & redacts `.env`, API keys, Stripe secrets, AWS credentials, and `.git` repos.</span>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 font-bold">
          HARDENED
        </span>
      </div>

      {/* FILE UPLOAD MODE */}
      {mode === 'file' && (
        <>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`relative rounded-3xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center transition-all ${
              selectedFile
                ? 'border-cyan-500 bg-cyan-500/5 shadow-2xl shadow-cyan-500/10'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.zip"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileText className="h-8 w-8" />
              </div>
              <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FolderArchive className="h-8 w-8" />
              </div>
            </div>
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-mono font-bold text-cyan-300 bg-cyan-500/10 px-4 py-1.5 rounded-xl border border-cyan-500/30">
                  {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
                <span className="text-xs text-slate-400">File validated. Ready for security scan & AST parsing.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-base font-bold text-slate-200">Drag & Drop your PHR PDF or Project ZIP file here</span>
                <span className="text-xs text-slate-500">Supported: .pdf (Project Health Reports) or .zip (Source code archives up to 50MB)</span>
              </div>
            )}
          </div>

          {selectedFile && !uploadResult && (
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Running Security Scan & AST Parser...</span></>
                ) : (
                  <><ShieldCheck className="h-5 w-5" /><span>Upload & Scan Security</span></>
                )}
              </button>
            </div>
          )}

          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col gap-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Security Scan Passed</h3>
                    <p className="text-xs text-slate-400">Project ID: <span className="font-mono text-cyan-400">{uploadResult.project_id.slice(0, 8)}</span></p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400">
                  {uploadResult.security_scan.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Secrets Detected & Redacted:</span>
                  <span className="text-lg font-bold text-cyan-400">{uploadResult.security_scan.secrets_detected_count} Keys</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Prohibited Files Blocked:</span>
                  <span className="text-lg font-bold text-amber-400">{uploadResult.security_scan.prohibited_files_blocked} Files</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Parsed Lines of Code:</span>
                  <span className="text-lg font-bold text-purple-400">{uploadResult.extracted_summary.lines_of_code.toLocaleString()} LOC</span>
                </div>
              </div>
              {uploadResult.security_scan.blocked_files.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-mono font-semibold text-slate-400">Blocked Prohibited File Entries:</span>
                  <div className="flex flex-wrap gap-2">
                    {uploadResult.security_scan.blocked_files.map((bf, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-[11px] font-mono text-red-300">{bf}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleProceedToML}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
                >
                  <span>Proceed to ML Pipeline Timeline</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* GITHUB MODE */}
      {mode === 'github' && (
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <GitBranch className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-slate-100">GitHub Repository Analysis</h3>
              <span className="ml-auto text-[11px] font-mono text-slate-400">Commits • PRs • Issues • CI/CD • SBOM</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Repository URL or owner/repo</label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo  or  owner/repo"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">GitHub Personal Access Token <span className="text-slate-500 font-normal">(optional — required for private repos)</span></label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Token is used only for this request and never stored.</span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGitHubAnalyze}
                disabled={isAnalyzing || !repoUrl.trim()}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Analyzing Repository...</span></>
                ) : (
                  <><Github className="h-5 w-5" /><span>Analyze GitHub Repository</span></>
                )}
              </button>
            </div>
          </div>

          {githubResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col gap-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{githubResult.repo}</h3>
                    <p className="text-xs text-slate-400">Language: <span className="text-cyan-400">{githubResult.language}</span> • Project ID: <span className="font-mono text-cyan-400">{githubResult.project_id.slice(0, 8)}</span></p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  githubResult.ci_status === 'PASSING'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : githubResult.ci_status === 'FAILING'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  CI: {githubResult.ci_status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">ML Risk Score</span>
                  <span className="text-lg font-bold text-red-400">{githubResult.risk_score}/100</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Compliance Score</span>
                  <span className="text-lg font-bold text-cyan-400">{githubResult.compliance_score}%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Primary Failure</span>
                  <span className="text-xs font-bold text-purple-400 leading-tight">{githubResult.primary_failure.split('&')[0]}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Release Blocking</span>
                  <span className={`text-lg font-bold ${githubResult.release_blocking ? 'text-red-400' : 'text-emerald-400'}`}>
                    {githubResult.release_blocking ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>

              {githubResult.release_blocking && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-center gap-2 text-xs text-red-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Release blocked: AGPL-3.0 or GPL-3.0 dependency detected. Legal review required.</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => navigate(`/ml-running?project_id=${githubResult.project_id}&type=github`)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3.5 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
                >
                  <GitBranch className="h-4 w-4" />
                  <span>View GitHub ML Timeline</span>
                </button>

                <button
                  onClick={handleProceedToDashboard}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
                >
                  <span>Open Intelligence Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

    </div>
  );
};

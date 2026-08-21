import axios from 'axios';
import type {
  GitHubAnalyzeResponse, SOC2Report, PredictiveCompliance, LicenseReport,
  ProvenanceReport, CollabComment, ApprovalRecord
} from '../types';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('insightx_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('insightx_token');
      localStorage.removeItem('insightx_user');
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// --- GitHub ---
export const analyzeGitHubRepo = (repo_url: string, github_token?: string) =>
  api.post<GitHubAnalyzeResponse>('/github/analyze', { repo_url, github_token });

export const getGitHubReport = (projectId: string) =>
  api.get(`/github/report/${projectId}`);

// --- Compliance ---
export const getSOC2Report = (projectId: string) =>
  api.get<SOC2Report>(`/compliance/soc2/${projectId}`);

export const getPredictiveCompliance = (projectId: string) =>
  api.get<PredictiveCompliance>(`/compliance/predictive/${projectId}`);

export const getLicenseReport = (projectId: string) =>
  api.get<LicenseReport>(`/compliance/license/${projectId}`);

// --- Collaboration ---
export const addComment = (project_id: string, content: string, comment_type = 'COMMENT') =>
  api.post('/collaboration/comment', { project_id, content, comment_type });

export const getComments = (projectId: string) =>
  api.get<{ comments: CollabComment[]; total: number }>(`/collaboration/comments/${projectId}`);

export const submitApproval = (project_id: string, decision: string, notes?: string) =>
  api.post('/collaboration/approve', { project_id, decision, notes });

export const getApprovals = (projectId: string) =>
  api.get<{ approvals: ApprovalRecord[]; approval_status: string }>(`/collaboration/approvals/${projectId}`);

// --- Provenance ---
export const getProvenanceReport = (projectId: string) =>
  api.get<ProvenanceReport>(`/provenance/${projectId}`);

export const getSBOM = (projectId: string) =>
  api.get(`/provenance/sbom/${projectId}`);

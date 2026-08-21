export interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SecurityScan {
  secrets_detected_count: number;
  prohibited_files_blocked: number;
  blocked_files: string[];
  status: string;
}

export interface UploadResponse {
  project_id: string;
  filename: string;
  source_type: 'PDF_PHR' | 'PROJECT_ZIP';
  security_scan: SecurityScan;
  extracted_summary: {
    lines_of_code: number;
    cyclomatic_complexity: number;
    dependency_coupling: number;
    top_hotspot_file: string;
  };
}

export interface GitHubAnalyzeResponse {
  project_id: string;
  repo: string;
  language: string;
  risk_score: number;
  primary_failure: string;
  ci_status: string;
  compliance_score: number;
  release_blocking: boolean;
}

export interface MLStep {
  id: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  duration_ms: number;
}

export interface MLStatusResponse {
  status: 'NOT_STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress_pct: number;
  current_step: string;
  total_duration_ms?: number;
  steps?: MLStep[];
}

export interface FailureRanking {
  rank: number;
  failure_type: string;
  probability: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SHAPItem {
  feature: string;
  value: number;
  shap_impact: number;
  direction: 'INCREASES_RISK' | 'REDUCES_RISK';
}

export interface Forecasts {
  days: number[];
  predicted_defects: number[];
  predicted_delay_days: number[];
}

export interface BurnoutAnalysis {
  burnout_risk_score: number;
  burnout_level: 'CRITICAL' | 'HIGH' | 'LOW';
  workload_imbalance_index: number;
  high_risk_contributors_count: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  full_path: string;
  risk_score: number;
  betweenness: number;
  is_root_cause: boolean;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

export interface NetworkGraph {
  root_cause_module: string;
  root_cause_label: string;
  total_components_analyzed: number;
  graph_density: number;
  has_dependency_evidence?: boolean;
  insufficient_reason?: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface InterventionItem {
  id: string;
  title: string;
  category: string;
  risk_reduction_pct: number;
  delay_days_saved: number;
  cost_savings_usd: number | null;
  effort_level: 'LOW' | 'MEDIUM' | 'HIGH';
  effort_days?: number;
  roi_multiplier?: number | null;
  confidence?: number;
  recommended: boolean;
}

export interface InterventionROI {
  is_insufficient_evidence?: boolean;
  interventions: InterventionItem[];
  aggregated_impact: {
    total_risk_reduction_pct: number;
    total_delay_days_saved: number;
    total_estimated_savings_usd: number | null;
    estimated_roi_multiplier: string;
    recommended_action?: string;
  };
}

export interface SimilarityProject {
  id: string;
  name: string;
  domain: string;
  similarity_score: number;
  historical_outcome: string;
  recommended_resolution: string;
}

export interface TimeMachineData {
  is_insufficient_evidence?: boolean;
  days: number[];
  scenarios: {
    baseline: number[];
    mitigated: number[];
    worst_case: number[];
  };
  milestone_projections: {
    day_7_risk_reduction: number;
    day_14_risk_reduction: number;
    day_30_risk_reduction: number;
  };
  confidence?: {
    baseline: Array<number>;
    mitigated: Array<number>;
    worst_case: Array<number>;
  };
}

export interface IntelligenceSections {
  executive_risk_summary?: {
    overall_risk: number;
    risk_level: string;
    model_confidence_pct: number;
    primary_failure: string;
    business_impact: string;
    urgency: string;
  };
  what_will_fail_first?: Array<{
    rank: number;
    failure_type: string;
    probability: number;
    severity: string;
    evidence: string;
    affected_files_modules: string[];
  }>;
  top_risk_hotspots?: Array<{
    file_module: string;
    risk_score: number | null;
    complexity: number | null;
    churn: number | null;
    dependencies: string;
    test_security_signals: {
      defect_density: number | null;
      compliance_fail_count: number | null;
      license_blocking: boolean | null;
    };
    exact_reason: string;
  }>;
  root_cause_intelligence?: {
    module: string;
    dependency_evidence: string;
    shap_evidence: any;
    supported: boolean;
  };
  risk_time_machine?: any;
  preventive_action_plan?: Array<{
    action: string;
    priority: string;
    expected_risk_reduction_pct: number;
    effort: string;
    cost: string;
    days_saved: number;
    confidence: number;
  }>;
  intervention_roi?: {
    interventions_compared: InterventionItem[];
    recommended_highest_value_action: string;
    selection_basis: string;
  };
  compliance_intelligence?: any;
  code_provenance_legal_risk?: any;
  github_intelligence?: any;
  confidence_and_evidence?: {
    model: string;
    model_confidence_pct: number;
    supporting_metrics: Record<string, number | null>;
    top_failure_probabilities: any[];
    top_shap_features: any[];
    data_source: string;
  };
  final_decision_panel?: {
    question: string;
    top_3_actions: Array<{
      rank: number;
      action: string;
      expected_impact: string;
      owner_suggestion: string;
      urgency: string;
      confidence: number;
    }>;
    overall_urgency: string;
  };
}

// --- Compliance Types ---
export interface SOC2EvidenceItem {
  control_id: string;
  domain: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  evidence_note: string;
  collected_at: string;
}

export interface SOC2Report {
  report_id: string;
  generated_at: string;
  compliance_score: number;
  pass_count: number;
  fail_count: number;
  needs_review_count: number;
  overall_status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
  evidence_items: SOC2EvidenceItem[];
  freshness_hours: number;
  is_fresh: boolean;
  integrity_hash: string;
  audit_trail: Array<{ event: string; actor: string; timestamp: string }>;
}

export interface PredictiveCompliance {
  current_risk_score: number;
  projected_30d_risk: number;
  compliance_drift_rate_per_day: number;
  predictive_alerts: Array<{ severity: string; message: string }>;
  recommendation: string;
}

export interface LicenseReport {
  total_packages: number;
  packages_analyzed: number;
  license_alerts: Array<{ package: string; version: string; license: string; severity: string; message: string }>;
  critical_license_count: number;
  high_risk_license_count: number;
  release_blocking: boolean;
  release_block_reason: string | null;
  package_details: Array<{ name: string; version: string; license: string; risk: string; is_copyleft: boolean }>;
}

// --- Collaboration Types ---
export interface CollabComment {
  id: string;
  author: string;
  content: string;
  comment_type: 'COMMENT' | 'CHANGE_REQUEST' | 'APPROVAL';
  created_at: string;
}

export interface ApprovalRecord {
  id: string;
  approver: string;
  decision: 'APPROVED' | 'REJECTED';
  notes?: string;
  decided_at: string;
}

// --- Provenance Types ---
export interface ProvenanceReport {
  generated_at: string;
  total_files_analyzed: number;
  human_contribution_pct: number;
  ai_contribution_pct: number;
  unknown_contribution_pct: number;
  ai_tools_detected: Record<string, number>;
  commit_lineage: Array<{ sha: string; author: string; date: string; message: string; ai_assisted: boolean }>;
  license_detections: Array<{ file: string; license: string; method: string }>;
  unique_licenses: string[];
  signed_hash: string;
  license_summary?: string;
  authorship_attribution?: string;
  ma_ip_summary: {
    human_pct: number;
    ai_pct: number;
    ai_tools: string[];
    license_count: number;
    copyleft_present: boolean;
    report_note: string;
  };
}

// --- GitHub Summary ---
export interface GitHubSummary {
  owner: string;
  repo: string;
  language: string;
  stars: number;
  forks: number;
  open_prs: number;
  merged_prs: number;
  open_issues: number;
  contributors: Array<{ login: string; contributions: number }>;
  ci_status: string;
  last_ci_conclusion: string | null;
  commit_frequency_per_week: number;
  sbom_package_count: number;
}

export interface EvidenceQuality {
  evidence_quality_score: number;
  completeness_pct: number;
  freshness_label: string;
  source_reliability_score: number;
  missing_metrics_count: number;
  historical_coverage_score: number;
  confidence_vs_quality_summary: string;
}

export interface CalibrationPoint {
  predicted_probability: number;
  actual_frequency: number;
}

export interface PredictionVsActualSample {
  sample: string;
  predicted_risk: number;
  actual_risk: number;
  error: number;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  mae: number;
  rmse: number;
  roc_auc: number;
  calibration_points: CalibrationPoint[];
  prediction_vs_actual: PredictionVsActualSample[];
  feature_drift_psi: number;
  concept_drift_status: string;
}

export interface HighRiskDefectArea {
  module: string;
  expected_defects: number;
  risk_contribution: string;
  trend: 'ESCALATING' | 'STABLE' | 'DECREASING';
}

export interface DefectForecast {
  days: number[];
  predicted_defects: number[];
  predicted_delay_days: number[];
  cumulative_defect_growth?: number[];
  expected_defects_total?: number;
  high_risk_defect_areas?: HighRiskDefectArea[];
  trend_comparison?: {
    current_period_defects: number;
    previous_period_baseline: number;
    defect_velocity_change_pct: number;
    trend_status: string;
  };
}

export interface AICodeGovernance {
  tool_attribution: Array<{ tool: string; usage_count: number; percentage: number }>;
  generation_stats: {
    primary_model: string;
    estimated_generation_time_minutes: number;
    total_prompts_executed: number;
  };
  developer_events: {
    accepted_suggestions: number;
    rejected_suggestions: number;
    acceptance_rate_pct: number;
  };
  human_review: {
    confirmed_human_reviews: number;
    unreviewed_ai_files: number;
    review_status: 'VERIFIED' | 'NEEDS_CONFIRMATION';
  };
  policy_enforcement: {
    max_allowed_ai_pct: number;
    current_ai_pct: number;
    policy_status: 'COMPLIANT' | 'VIOLATION' | 'POLICY_WARNING';
    release_blocked: boolean;
    policy_note: string;
  };
}

export interface LicenseIPGovernance {
  detected_licenses: string[];
  similarity_matches: Array<{ snippet: string; similarity_score_pct: number; matched_source: string; risk: string }>;
  license_conflicts: Array<{ license_A: string; license_B: string; conflict_type: string; severity: string; recommendation: string }>;
  release_blocking: boolean;
  release_block_reason: string | null;
  legal_review: {
    status: 'APPROVED' | 'ACTION_REQUIRED';
    checklist: Array<{ item: string; status: string }>;
  };
  patent_ip_report: {
    proprietary_ip_score: number;
    external_dependency_risk: string;
    patent_exposure_risk: string;
    ip_ownership_status: string;
  };
  ma_provenance: {
    ma_readiness_score: number;
    signed_certificate_hash: string;
    due_diligence_note: string;
  };
}

export interface ScopeDriftStep {
  step_index: number;
  step_name: string;
  metric_label: string;
  detail: string;
}

export interface ScopeDriftIntelligence {
  is_insufficient_evidence?: boolean;
  scope_change_pct: number;
  added_loc: number;
  affected_modules_count: number;
  effort_person_days: number;
  cost_impact_usd: number;
  schedule_delay_days: number;
  risk_increase_delta: number;
  new_projected_risk: number;
  pipeline_steps: ScopeDriftStep[];
  summary: string;
}

export interface ProjectComparisonItem {
  project_id: string;
  project_name: string;
  risk_score: number;
  failure_probability: string;
  team_health_score: number;
  compliance_score: number;
  hotspots_count: number;
  recommended_intervention: string;
}

export interface MultiProjectComparisonData {
  current_project_complexity: number;
  benchmark_average_complexity: number;
  current_project_coupling: number;
  benchmark_average_coupling: number;
  portfolio_aggregate_risk?: number;
  portfolio_risk_grade?: string;
  portfolio_projects_count?: number;
  project_comparison_matrix?: ProjectComparisonItem[];
}

export interface RootCauseCluster {
  id: string;
  category: string;
  color: string;
  description: string;
  module_count: number;
  average_risk: number;
  top_affected_modules: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface DashboardData {
  id: string;
  project_id: string;
  project_name: string;
  filename: string;
  analyzed_at: string;
  total_duration_ms: number;
  source_type?: string;
  is_insufficient_evidence?: boolean;
  insufficient_reason?: string;
  github_summary?: GitHubSummary;
  metrics: {
    lines_of_code: number;
    cyclomatic_complexity: number;
    dependency_coupling: number;
    defect_density: number;
    sprint_velocity: number;
    churn_rate: number;
  };
  hotspots: Array<{
    file: string;
    complexity: number;
    risk_score: number;
    loc?: number;
  }>;
  ml_results: {
    overall_risk_score: number;
    risk_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    model_confidence?: number;
    evidence_quality?: EvidenceQuality;
    model_performance?: ModelPerformance;
    primary_failure_type: string;
    failure_rankings: FailureRanking[];
    shap_feature_importance: SHAPItem[];
    forecasts: DefectForecast;
    burnout_analysis: BurnoutAnalysis;
    scope_adjusted_risk?: number;
  };
  network_graph: NetworkGraph & { root_cause_clusters?: RootCauseCluster[] };
  similarity: {
    has_historical_comparison?: boolean;
    message?: string;
    top_matching_project?: SimilarityProject;
    similar_projects: SimilarityProject[];
    multi_project_comparison: MultiProjectComparisonData;
  };
  time_machine: TimeMachineData;
  intervention_roi: InterventionROI;
  scope_drift?: ScopeDriftIntelligence;
  ai_explanations: {
    source: string;
    executive_summary: string;
    executive_risk_summary?: Record<string, any>;
    report_sections: Array<{ section: string; content: string }>;
    preventive_recommendations: string[];
    preventive_action_plan?: any[];
    final_decision_panel?: any;
    intelligence_sections?: IntelligenceSections;
  };
  compliance_report?: SOC2Report;
  predictive_compliance?: PredictiveCompliance;
  license_report?: LicenseReport;
  provenance_report?: ProvenanceReport & {
    ai_code_governance?: AICodeGovernance;
    advanced_license_ip_governance?: LicenseIPGovernance;
  };
  comments?: CollabComment[];
  approvals?: ApprovalRecord[];
  approval_status?: string;
}


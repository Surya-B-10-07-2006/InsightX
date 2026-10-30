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
  quality_fusion_grade?: string;
  architecture_risk_index?: number;
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
  evidence?: string;
  trigger_metric?: string;
  trigger_value?: number;
  affected_files?: string[];
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
}

// ----------------------------------------------------------------------------
// 14 Core Risk Intelligence Capabilities Types
// ----------------------------------------------------------------------------

export interface QualityFusionDimension {
  maintainability: number;
  complexity_health: number;
  architectural_cohesion: number;
  security_posture: number;
  reliability_stability: number;
}

export interface QualityFusionRadarPoint {
  dimension: string;
  score: number;
  benchmark: number;
}

export interface QualityFusionScore {
  composite_score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  grade_label: string;
  dimensions: QualityFusionDimension;
  summary_radar: QualityFusionRadarPoint[];
}

export interface SASTFinding {
  id: string;
  file: string;
  line_number: number;
  code_snippet: string;
  category: string;
  cwe: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  taint_source: string;
  taint_sink: string;
  impact: string;
  remediation: string;
  confidence: string;
}

export interface DeepHybridSASTReport {
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  taint_flows_detected: number;
  security_rating: string;
  security_score: number;
  findings: SASTFinding[];
}

export interface ReachablePackage {
  package_name: string;
  version: string;
  license: string;
  reachability_status: 'DIRECT_REACHABLE' | 'UNREACHABLE_GHOST';
  call_depth: number;
  calling_files_count: number;
  sample_calling_files: string[];
  has_known_cve: boolean;
  cve_id?: string | null;
  cve_severity: string;
  cve_description?: string | null;
  risk_impact: string;
  exploitability_rating: string;
}

export interface ReachabilityReport {
  total_dependencies_audited: number;
  reachable_count: number;
  ghost_count: number;
  reachable_percentage: number;
  ghost_percentage: number;
  vulnerable_reachable_count: number;
  reachability_health_score: number;
  attack_surface_status: string;
  reachable_packages: ReachablePackage[];
  ghost_packages: ReachablePackage[];
}

export interface ModuleArchitectureMetric {
  module: string;
  afferent_coupling_ca: number;
  efferent_coupling_ce: number;
  instability: number;
  abstractness: number;
  distance_from_main_sequence: number;
  architecture_zone: 'ZONE_OF_PAIN' | 'ZONE_OF_USELESSNESS' | 'BALANCED_MAIN_SEQUENCE';
  is_circular: boolean;
}

export interface GodModule {
  module: string;
  betweenness_centrality: number;
  total_coupling: number;
  loc: number;
  bottleneck_severity: string;
  risk_driver: string;
}

export interface ArchitectureRiskReport {
  architecture_risk_index: number;
  architecture_health_grade: string;
  modularity_q_score: number;
  graph_density: number;
  total_nodes: number;
  total_edges: number;
  circular_cycles_count: number;
  circular_cycles: string[][];
  god_modules_count: number;
  god_modules: GodModule[];
  zone_of_pain_modules_count: number;
  zone_of_uselessness_modules_count: number;
  module_metrics_sample: ModuleArchitectureMetric[];
}

export interface LanguageDistributionItem {
  language: string;
  files_count: number;
  loc: number;
  loc_percentage: number;
  avg_complexity: number;
  avg_maintainability: number;
  health_rating: 'OPTIMAL' | 'NEEDS_REVIEW' | 'HIGH_DEBT';
}

export interface PolyglotMeshReport {
  total_loc: number;
  language_distribution: LanguageDistributionItem[];
  primary_language: string;
  average_complexity: number;
  average_maintainability: number;
  total_defect_markers: number;
  polyglot_languages_count: number;
}

export interface AIProvenanceGate {
  gate_status: 'PASSED' | 'WARN' | 'BLOCKED';
  gate_reason: string;
  human_contribution_pct: number;
  ai_contribution_pct: number;
  max_allowed_ai_pct: number;
  ai_tools_detected: Record<string, number>;
  unreviewed_ai_modules_count: number;
  unreviewed_modules_sample: string[];
  compliance_badge: string;
}

export interface AIDebtLedger {
  ai_authored_loc: number;
  refactoring_liability_hours: number;
  estimated_remediation_cost_usd: number;
  volatility_multiplier: number;
  debt_risk_category: string;
  remediation_priority_modules: string[];
}

export interface AnonymizedTeamCohort {
  cohort_role: string;
  member_count: number;
  ownership_share_pct: number;
  burnout_exposure: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface TeamGovernanceReport {
  bus_factor: number;
  knowledge_silo_index: number;
  team_sustainability_score: number;
  contributors_count: number;
  workload_distribution_entropy: number;
  anonymized_cohorts: AnonymizedTeamCohort[];
  privacy_standard: string;
}

export interface PolicyRule {
  rule_id: string;
  title: string;
  category: string;
  threshold: string;
  actual_value: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  remediation: string;
}

export interface PolicyCatalogReport {
  total_rules_evaluated: number;
  passed_rules_count: number;
  failed_rules_count: number;
  policy_compliance_pct: number;
  overall_status: 'COMPLIANT' | 'NON_COMPLIANT';
  policy_rules: PolicyRule[];
}

export interface AutoTriageItem {
  ticket_id: string;
  title: string;
  category: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  severity: string;
  target_file: string;
  estimated_effort_hours: number;
  action_type: string;
  summary: string;
}

export interface VerifiedFixPR {
  pr_id: string;
  title: string;
  target_file: string;
  category: string;
  verification_status: string;
  risk_reduction_pct: number;
  diff: string;
  commit_message: string;
  explanation: string;
}

export interface PortfolioHealthProject {
  project_id: string;
  project_name: string;
  risk_score: number;
  complexity: number;
  coupling: number;
  status: string;
}

export interface PortfolioHealthReport {
  portfolio_projects_count: number;
  portfolio_aggregate_risk: number;
  portfolio_risk_grade: string;
  benchmark_average_complexity: number;
  benchmark_average_coupling: number;
  project_comparison_matrix: PortfolioHealthProject[];
}

// ----------------------------------------------------------------------------
// Master Dashboard Data Container
// ----------------------------------------------------------------------------
export interface EvidenceQuality {
  evidence_quality_score: number;
  completeness_pct: number;
  freshness_label: string;
  source_reliability_score: number;
  missing_metrics_count: number;
  historical_coverage_score: number;
  confidence_vs_quality_summary: string;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  mae: number;
  rmse: number;
  roc_auc: number;
  calibration_points: Array<{ predicted_probability: number; actual_frequency: number }>;
  prediction_vs_actual: Array<{ sample: string; predicted_risk: number; actual_risk: number; error: number }>;
  feature_drift_psi: number;
  concept_drift_status: string;
}

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

export interface SOC2Report {
  report_id: string;
  generated_at: string;
  compliance_score: number;
  pass_count: number;
  fail_count: number;
  needs_review_count: number;
  overall_status: string;
  evidence_items: Array<{ control_id: string; domain: string; description: string; status: string; evidence_note: string }>;
}

export interface PredictiveCompliance {
  current_risk_score: number;
  projected_30d_risk: number;
  compliance_drift_rate_per_day: number;
  predictive_alerts: Array<{ severity: string; message: string }>;
  recommendation: string;
}

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

export interface DefectForecast {
  days: number[];
  predicted_defects: number[];
  predicted_delay_days: number[];
  cumulative_defect_growth?: number[];
  expected_defects_total?: number;
  high_risk_defect_areas?: Array<{ module: string; expected_defects: number; risk_contribution: string; trend: string }>;
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

export interface MultiProjectComparisonData {
  current_project_complexity: number;
  benchmark_average_complexity: number;
  current_project_coupling: number;
  benchmark_average_coupling: number;
  portfolio_aggregate_risk?: number;
  portfolio_risk_grade?: string;
  portfolio_projects_count?: number;
  project_comparison_matrix?: Array<{
    project_id: string;
    project_name: string;
    risk_score: number;
    failure_probability: string;
    team_health_score: number;
    compliance_score: number;
    hotspots_count: number;
    recommended_intervention: string;
  }>;
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

export interface LicenseReport {
  total_packages: number;
  packages_analyzed: number;
  license_alerts: Array<{ package: string; version: string; license: string; severity: string; message: string }>;
  critical_license_count: number;
  high_risk_license_count?: number;
  release_blocking: boolean;
  release_block_reason?: string | null;
  package_details?: Array<{ name: string; version: string; license: string; risk: string; is_copyleft: boolean }>;
}

export interface ProvenanceReport {
  generated_at: string;
  total_files_analyzed: number;
  human_contribution_pct: number;
  ai_contribution_pct: number;
  unknown_contribution_pct?: number;
  ai_tools_detected: Record<string, number>;
  unique_licenses: string[];
  signed_hash?: string;
  license_summary?: string;
  authorship_attribution?: string;
  ma_ip_summary?: {
    human_pct: number;
    ai_pct: number;
    ai_tools: string[];
    license_count: number;
    copyleft_present: boolean;
    report_note: string;
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
  pipeline_steps?: ScopeDriftStep[];
  summary: string;
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
    average_maintainability?: number;
    primary_language?: string;
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
  };
  // 14 Core Capabilities
  quality_fusion: QualityFusionScore;
  sast_analysis: DeepHybridSASTReport;
  reachability_analysis: ReachabilityReport;
  architecture_risk: ArchitectureRiskReport;
  polyglot_mesh: PolyglotMeshReport;
  provenance_gate: AIProvenanceGate;
  ai_debt_ledger: AIDebtLedger;
  team_governance: TeamGovernanceReport;
  policy_catalog: PolicyCatalogReport;
  auto_triage_backlog: AutoTriageItem[];
  verified_fix_prs: VerifiedFixPR[];
  portfolio_health: PortfolioHealthReport;
  
  network_graph: NetworkGraph & { root_cause_clusters?: RootCauseCluster[] };
  similarity: {
    similar_projects: SimilarityProject[];
    multi_project_comparison?: MultiProjectComparisonData;
  };
  time_machine: TimeMachineData;
  intervention_roi: InterventionROI;
  scope_drift?: ScopeDriftIntelligence;
// ---------------------------------------------------------------------------
// Evidence-Based Executive Decision Engine Types
// ---------------------------------------------------------------------------

export interface ExecutiveDecisionEvidence {
  primary_metric?: string;
  primary_value?: number | string | null;
  secondary_metric?: string;
  secondary_value?: number | string | null;
  file?: string;
  complexity?: number | null;
  coupling?: number | null;
  defect_density?: number | null;
  risk_score?: number | null;
  critical_sast_count?: number | null;
  burnout_risk_score?: number | null;
  compliance_failures?: number | null;
  [key: string]: string | number | null | undefined;
}

export interface ExecutiveDecision {
  rank: number;
  decision: string;
  why: string;
  evidence: ExecutiveDecisionEvidence;
  affected_files: string[];
  expected_risk_reduction_pct: number | null;
  estimated_effort: 'LOW' | 'MEDIUM' | 'HIGH';
  effort_days: number | null;
  days_saved: number | null;
  owner: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MODERATE' | 'LOW';
  confidence_pct: number | null;
  measurable_target: string;
  source: string;
}

export interface ExecutiveDecisionPanel {
  decisions: ExecutiveDecision[];
  overall_recommendation: string;
  source: string;
  evidence_grounded: boolean;
}

  ai_explanations: {
    source: string;
    executive_summary: string;
    report_sections: Array<{ section: string; content: string }>;
    preventive_recommendations: string[];
    executive_decisions?: ExecutiveDecisionPanel;
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


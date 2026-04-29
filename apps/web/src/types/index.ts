// ─── Auth ────────────────────────────────────────────────
export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  title?: string | null;
  avatar_url?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  organization_name?: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  title?: string;
  avatar_url?: string;
  organization_id?: string;
  password?: string;
  email?: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  title?: string;
  organization_name?: string;
}

// ─── Analysis ────────────────────────────────────────────
export interface AnalysisCreateRequest {
  sample_id: string;
  media_type?: string;
  volume_plated_ml: number;
  dilution_factor: number;
  protocol?: string;
  incubation_info?: string;
  notes?: string;
}

export interface AnalysisUpdateRequest {
  sample_id?: string;
  media_type?: string;
  volume_plated_ml?: number;
  dilution_factor?: number;
  protocol?: string;
  incubation_info?: string;
  notes?: string;
}

export interface AnalysisImage {
  id: string;
  original_filename: string;
  stored_path: string;
  file_size_bytes: number;
  mime_type: string;
  width?: number | null;
  height?: number | null;
  uploaded_at: string;
}

export interface AnalysisSummary {
  id: string;
  sample_id: string;
  media_type: string;
  ai_colony_count?: number | null;
  final_colony_count?: number | null;
  calculated_cfu_ml?: number | null;
  ai_confidence?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  operator_name?: string | null;
  image?: AnalysisImage | null;
}

export interface AnalysisDetail {
  id: string;
  user_id: string;
  sample_id: string;
  media_type: string;
  volume_plated_ml: number;
  dilution_factor: number;
  protocol?: string | null;
  incubation_info?: string | null;
  notes?: string | null;
  ai_colony_count?: number | null;
  ai_confidence?: number | null;
  final_colony_count?: number | null;
  calculated_cfu_ml?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  image?: AnalysisImage | null;
  colonies?: Colony[];
  operator_name?: string | null;
}

export interface PaginatedAnalyses {
  items: AnalysisSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AnalysisFilterParams {
  scope?: 'mine' | 'team';
  target_user_id?: string;
  status?: string;
  media_type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface AiInferenceResult {
  colony_count: number;
  confidence: number;
  processing_time_ms: number;
}

// ─── Colony ──────────────────────────────────────────────
export interface ColonyCreateRequest {
  position_x: number;
  position_y: number;
  label?: string;
  area_px?: number;
  morphology?: string;
}

export interface ColonyUpdateRequest {
  label?: string;
  position_x?: number;
  position_y?: number;
  area_px?: number;
  morphology?: string;
}

export interface Colony {
  id: string;
  analysis_id: string;
  label?: string | null;
  position_x: number;
  position_y: number;
  bbox_width?: number | null;
  bbox_height?: number | null;
  area_px?: number | null;
  confidence?: number | null;
  species_name?: string | null;
  morphology?: string | null;
  source: string;
  is_removed: boolean;
  added_by?: string | null;
  created_at: string;
}

// ─── Audit ───────────────────────────────────────────────
export interface AuditEvent {
  id: string;
  analysis_id: string;
  user_id?: string | null;
  event_type: string;
  description: string;
  metadata_json?: Record<string, unknown> | null;
  created_at: string;
  user_name?: string | null;
}

// ─── Dashboard ───────────────────────────────────────────
export interface SpeciesCount {
  name: string;
  count: number;
  percentage: number;
}

export interface DashboardOverview {
  total_colonies_today: number;
  colonies_change_pct: number;
  ai_accuracy_avg: number;
  total_analyses_today: number;
  peak_volume_time?: string | null;
  system_status: string;
  time_saved_hours: number;
  unverified_count: number;
  top_species: SpeciesCount[];
}

export interface ActivityItem {
  event_type: string;
  description: string;
  user_name?: string | null;
  user_avatar?: string | null;
  sample_id?: string | null;
  created_at: string;
  tags: string[];
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface DayCount {
  date: string;
  count: number;
}

// ─── Report ──────────────────────────────────────────────
export interface Report {
  id: string;
  analysis_id: string;
  generated_by: string;
  file_path: string;
  report_type: string;
  created_at: string;
}

export interface PaginatedReports {
  items: Report[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReportFilterParams {
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface BatchExportRequest {
  analysis_ids: string[];
}

// ─── Settings ────────────────────────────────────────────
export interface UserSettings {
  default_volume_ul: number;
  default_dilution_exp: number;
  preferred_agar_type: string;
  theme: string;
  language: string;
}

export interface UserSettingsUpdateRequest {
  default_volume_ul?: number;
  default_dilution_exp?: number;
  preferred_agar_type?: string;
  theme?: string;
  language?: string;
}

export interface SystemIntegrityStats {
  integrity_score: number;
  total_records: number;
  verified_records: number;
  system_health: number;
  audit_status: string;
}

// ─── Simulator ───────────────────────────────────────────
export interface SimulatorSample {
  id: string;
  image_path: string;
  ground_truth_count: number;
  label?: string | null;
  created_at: string;
}

export interface SimulatorSessionCreateRequest {
  sample_image_id: string;
}

export interface SimulatorSessionSubmitRequest {
  manual_count: number;
  manual_time_ms: number;
}

export interface SimulatorSession {
  id: string;
  user_id: string;
  sample_image_id: string;
  manual_count?: number | null;
  manual_time_ms?: number | null;
  ai_count?: number | null;
  ai_time_ms?: number | null;
  created_at: string;
}

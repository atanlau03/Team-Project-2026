import apiClient from '../lib/axios';
import type { Report, PaginatedReports, ReportFilterParams, BatchExportRequest } from '../types';

/** List reports with search/filter/pagination */
export async function listReports(params?: ReportFilterParams): Promise<PaginatedReports> {
  const { data } = await apiClient.get<PaginatedReports>('/reports/', { params });
  return data;
}

/** Generate PDF report for a single analysis */
export async function generatePdf(analysisId: string): Promise<Report> {
  const { data } = await apiClient.post<Report>(`/reports/generate/${analysisId}`);
  return data;
}

/** Download a generated PDF report (returns blob URL) */
export async function downloadReport(reportId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/reports/download/${reportId}`, {
    responseType: 'blob',
  });
  return data;
}

/** Generate PDF reports for multiple analyses */
export async function exportBatch(body: BatchExportRequest): Promise<Report[]> {
  const { data } = await apiClient.post<Report[]>('/reports/export-batch', body);
  return data;
}

/** Export analyses to CSV blob */
export async function exportCsv(body: BatchExportRequest): Promise<Blob> {
  const { data } = await apiClient.post<Blob>('/reports/export-csv', body, {
    responseType: 'blob',
  });
  return data;
}

/** Export entire system audit trail as CSV blob */
export async function exportAuditLog(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>('/reports/export-audit', {
    responseType: 'blob',
  });
  return data;
}

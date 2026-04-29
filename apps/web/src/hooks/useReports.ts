import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as reportsApi from '../api/reports';
import type { ReportFilterParams, BatchExportRequest } from '../types';

export const reportKeys = {
  all: ['reports'] as const,
  list: (params?: ReportFilterParams) => [...reportKeys.all, 'list', params] as const,
};

/** List reports with search / filter / pagination */
export function useReports(params?: ReportFilterParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportsApi.listReports(params),
  });
}

/** Generate a PDF report for a single analysis */
export function useGeneratePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (analysisId: string) => reportsApi.generatePdf(analysisId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

/** Download a generated PDF report — triggers browser download */
export function useDownloadReport() {
  return useMutation({
    mutationFn: async (reportId: string) => {
      const blob = await reportsApi.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

/** Generate reports for multiple analyses */
export function useExportBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: BatchExportRequest) => reportsApi.exportBatch(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

/** Export multiple analyses to CSV */
export function useExportCsv() {
  return useMutation({
    mutationFn: async (body: BatchExportRequest) => {
      const blob = await reportsApi.exportCsv(body);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PlateSense_Export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

/** Export entire system audit trail to CSV */
export function useExportAuditLog() {
  return useMutation({
    mutationFn: async () => {
      const blob = await reportsApi.exportAuditLog();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PlateSense_AuditTrail_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

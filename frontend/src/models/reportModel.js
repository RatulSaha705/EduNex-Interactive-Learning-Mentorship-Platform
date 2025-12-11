// src/models/reportModel.js

import { api } from './api';

export const reportModel = {
  /** Submit a new report (e.g. user reports inappropriate content) */
  async submitReport(reportData) {
    // reportData might include: { reporterId, reportedUserId?, courseId?, contentId?, reason, details }
    return await api.post('reports', reportData);
  },

  /** Fetch all reports (for admin dashboard) */
  async getAllReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = query ? `reports?${query}` : 'reports';
    return await api.get(path);
  },

  /** Fetch a single report by ID */
  async getReportById(reportId) {
    return await api.get(`reports/${reportId}`);
  },

  /** Update a report (e.g. admin marks resolved, take action) */
  async updateReport(reportId, updateData) {
    return await api.put(`reports/${reportId}`, updateData);
  },

  /** Delete a report (e.g. invalid or resolved) */
  async deleteReport(reportId) {
    return await api.del(`reports/${reportId}`);
  },
};

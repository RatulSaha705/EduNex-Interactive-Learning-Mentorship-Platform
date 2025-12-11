// src/controllers/reportController.js

import { reportModel } from '../models/reportModel';

export const reportController = {
  /** Submit a new report (user flags content or user) */
  async submitReport(reportData) {
    try {
      const result = await reportModel.submitReport(reportData);
      return result;
    } catch (err) {
      console.error('Error submitting report:', err);
      throw err;
    }
  },

  /** Get all reports (for admin) */
  async fetchAllReports(params = {}) {
    try {
      const reports = await reportModel.getAllReports(params);
      return reports;
    } catch (err) {
      console.error('Error fetching reports:', err);
      throw err;
    }
  },

  /** Get a single report by its ID */
  async fetchReportById(reportId) {
    try {
      const report = await reportModel.getReportById(reportId);
      return report;
    } catch (err) {
      console.error(`Error fetching report ${reportId}:`, err);
      throw err;
    }
  },

  /** Update a report (e.g. mark resolved, take action) */
  async updateReport(reportId, updateData) {
    try {
      const updated = await reportModel.updateReport(reportId, updateData);
      return updated;
    } catch (err) {
      console.error(`Error updating report ${reportId}:`, err);
      throw err;
    }
  },

  /** Delete a report (e.g. invalid or resolved) */
  async deleteReport(reportId) {
    try {
      const result = await reportModel.deleteReport(reportId);
      return result;
    } catch (err) {
      console.error(`Error deleting report ${reportId}:`, err);
      throw err;
    }
  }
};

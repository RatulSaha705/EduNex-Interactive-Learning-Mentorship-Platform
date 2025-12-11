// src/controllers/adminAnalyticsController.js

import { adminAnalyticsModel } from '../models/adminAnalyticsModel';

export const adminAnalyticsController = {
  /** Fetch high‑level overview stats for admin dashboard */
  async fetchOverview() {
    try {
      const data = await adminAnalyticsModel.getOverview();
      return data;
    } catch (err) {
      console.error('Error fetching admin overview:', err);
      throw err;
    }
  },

  /** Fetch top‑rated / top‑used courses data */
  async fetchTopCourses(params = {}) {
    try {
      const data = await adminAnalyticsModel.getTopRatedCourses(params);
      return data;
    } catch (err) {
      console.error('Error fetching top courses:', err);
      throw err;
    }
  },

  /** Fetch system‑usage / analytics / trend data for usage over time */
  async fetchUsageTrends(params = {}) {
    try {
      const data = await adminAnalyticsModel.getSystemUsageTrends(params);
      return data;
    } catch (err) {
      console.error('Error fetching system usage trends:', err);
      throw err;
    }
  }
};

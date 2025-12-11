// src/models/adminAnalyticsModel.js

import { api } from './api';

/**
 * Frontend model for admin analytics / system insights.
 * Talks to backend routes:
 *  - GET /api/admin/overview
 *  - GET /api/admin/top-courses
 *  - GET /api/admin/system-usage
 */
export const adminAnalyticsModel = {
  /**
   * Get high-level admin dashboard overview:
   *  - total users by role
   *  - total courses
   *  - enrollments & learning minutes
   *  - open reports
   */
  async getOverview() {
    return await api.get('admin/overview');
  },

  /**
   * Get top-rated courses for admin analytics.
   * Optional params:
   *  - limit: number of courses to return (default handled by backend)
   *  - minRatings: filter by minimum ratings count, etc. (if supported)
   *
   * Example: { limit: 5 }
   */
  async getTopRatedCourses(params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = query ? `admin/top-courses?${query}` : 'admin/top-courses';
    return await api.get(path);
  },

  /**
   * Get system usage trends:
   *  - users & enrollments per day
   *  - within the last N days (default 7)
   *
   * params:
   *  - days: number (e.g. { days: 7 })
   */
  async getSystemUsageTrends(params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = query ? `admin/system-usage?${query}` : 'admin/system-usage';
    return await api.get(path);
  },
};

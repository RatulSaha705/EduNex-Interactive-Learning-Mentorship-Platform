// src/models/statsModel.js

import { api } from './api';

export const statsModel = {
  /** Fetch stats for a single user (e.g. learning hours, progress, engagement) */
  async getUserStats(userId) {
    return await api.get(`stats/users/${userId}`);
  },

  /** Fetch overall system analytics (e.g. top courses, active users, recent activity) */
  async getSystemAnalytics(params = {}) {
    // params could include date range, pagination, filters, etc.
    const query = new URLSearchParams(params).toString();
    const path = query ? `stats/system?${query}` : 'stats/system';
    return await api.get(path);
  },

  /** Fetch course-wise analytics (e.g. engagement, rating, enrollments) */
  async getCourseStats(courseId) {
    return await api.get(`stats/courses/${courseId}`);
  },

  /** Fetch global leaderboard / stats (e.g. most active students, top courses) */
  async getLeaderboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = query ? `stats/leaderboard?${query}` : 'stats/leaderboard';
    return await api.get(path);
  }
};

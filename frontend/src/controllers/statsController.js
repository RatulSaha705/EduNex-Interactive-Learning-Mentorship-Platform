// src/controllers/statsController.js

import { statsModel } from '../models/statsModel';

export const statsController = {
  /** Get stats for a single user (learning hours, engagement, etc.) */
  async fetchUserStats(userId) {
    try {
      const stats = await statsModel.getUserStats(userId);
      return stats;
    } catch (err) {
      console.error(`Error fetching stats for user ${userId}:`, err);
      throw err;
    }
  },

  /** Get overall system analytics (top courses, active users, usage trends) */
  async fetchSystemAnalytics(params = {}) {
    try {
      const analytics = await statsModel.getSystemAnalytics(params);
      return analytics;
    } catch (err) {
      console.error('Error fetching system analytics:', err);
      throw err;
    }
  },

  /** Get analytics data for a specific course */
  async fetchCourseStats(courseId) {
    try {
      const courseStats = await statsModel.getCourseStats(courseId);
      return courseStats;
    } catch (err) {
      console.error(`Error fetching stats for course ${courseId}:`, err);
      throw err;
    }
  },

  /** Get leaderboard or global stats (e.g. most active students / top courses) */
  async fetchLeaderboard(params = {}) {
    try {
      const leaderboard = await statsModel.getLeaderboard(params);
      return leaderboard;
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      throw err;
    }
  },
};

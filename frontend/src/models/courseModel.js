// src/models/courseModel.js

import { api } from './api';

export const courseModel = {
  /** Fetch all courses (optionally with query params) */
  async getAllCourses(params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = query ? `courses?${query}` : 'courses';
    return await api.get(path);
  },

  /** Fetch single course by ID */
  async getCourseById(courseId) {
    return await api.get(`courses/${courseId}`);
  },

  /** Create a new course */
  async createCourse(courseData) {
    return await api.post('courses', courseData);
  },

  /** Update existing course */
  async updateCourse(courseId, courseData) {
    return await api.put(`courses/${courseId}`, courseData);
  },

  /** Delete a course */
  async deleteCourse(courseId) {
    return await api.del(`courses/${courseId}`);
  },
};

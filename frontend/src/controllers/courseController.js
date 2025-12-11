// src/controllers/courseController.js

import { courseModel } from '../models/courseModel';

export const courseController = {
  /**
   * Get list of courses, optionally with filters or params
   * e.g. { category: 'math', page: 2 }
   */
  async fetchCourses(params = {}) {
    try {
      const data = await courseModel.getAllCourses(params);
      // Optionally: transform or filter data before returning
      return data;
    } catch (err) {
      console.error('Error fetching courses:', err);
      throw err;
    }
  },

  /**
   * Get a single course by ID
   */
  async fetchCourseById(courseId) {
    try {
      const course = await courseModel.getCourseById(courseId);
      return course;
    } catch (err) {
      console.error(`Error fetching course ${courseId}:`, err);
      throw err;
    }
  },

  /**
   * Create a new course
   * courseData: object containing course fields, e.g. { title, description, ... }
   */
  async createCourse(courseData) {
    try {
      const newCourse = await courseModel.createCourse(courseData);
      return newCourse;
    } catch (err) {
      console.error('Error creating course:', err);
      throw err;
    }
  },

  /**
   * Update existing course
   */
  async updateCourse(courseId, courseData) {
    try {
      const updated = await courseModel.updateCourse(courseId, courseData);
      return updated;
    } catch (err) {
      console.error(`Error updating course ${courseId}:`, err);
      throw err;
    }
  },

  /**
   * Delete a course
   */
  async deleteCourse(courseId) {
    try {
      const result = await courseModel.deleteCourse(courseId);
      return result;
    } catch (err) {
      console.error(`Error deleting course ${courseId}:`, err);
      throw err;
    }
  }
};

// src/utils/constants.js

// Base API configuration
export const API = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  ENDPOINTS: {
    COURSES: 'courses',
    USERS: 'users',
    AUTH_LOGIN: 'auth/login',
    AUTH_LOGOUT: 'auth/logout',
    AUTH_PROFILE: 'auth/profile',
    REPORTS: 'reports',
    STATS_USER: 'stats/users',
    STATS_COURSE: 'stats/courses',
    STATS_SYSTEM: 'stats/system',
    STATS_LEADERBOARD: 'stats/leaderboard',
    // add more endpoints as needed
  },
};

// HTTP methods
export const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

// User roles (example — adapt to your backend roles)
export const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
};

// Status constants (e.g. for async calls, loading states)
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

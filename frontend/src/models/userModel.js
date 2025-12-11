// src/models/userModel.js

import { api } from './api';

export const userModel = {
  /** Fetch all users (e.g. for admin dashboard) */
  async getAllUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = query ? `users?${query}` : 'users';
    return await api.get(path);
  },

  /** Fetch single user by ID */
  async getUserById(userId) {
    return await api.get(`users/${userId}`);
  },

  /** Create / register a new user */
  async registerUser(userData) {
    return await api.post('users/register', userData);
  },

  /** Update existing user data */
  async updateUser(userId, userData) {
    return await api.put(`users/${userId}`, userData);
  },

  /** Delete a user (or for admin to ban / remove) */
  async deleteUser(userId) {
    return await api.del(`users/${userId}`);
  },

  /** Login / authenticate user — assuming backend returns auth token + user info */
  async login(credentials) {
    return await api.post('auth/login', credentials);
  },

  /** Logout or invalidate session — if your backend supports it */
  async logout() {
    return await api.post('auth/logout', {});
  },

  /** Get current user profile (if backend has an endpoint for that) */
  async fetchProfile() {
    return await api.get('auth/profile');
  },
};

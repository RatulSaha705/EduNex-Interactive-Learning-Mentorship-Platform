// src/controllers/userController.js

import { userModel } from '../models/userModel';

export const userController = {
  /** Fetch all users (for admin) */
  async fetchUsers(params = {}) {
    try {
      const users = await userModel.getAllUsers(params);
      return users;
    } catch (err) {
      console.error('Error fetching users:', err);
      throw err;
    }
  },

  /** Fetch single user by ID */
  async fetchUserById(userId) {
    try {
      const user = await userModel.getUserById(userId);
      return user;
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
      throw err;
    }
  },

  /** Register a new user */
  async registerUser(userData) {
    try {
      const newUser = await userModel.registerUser(userData);
      return newUser;
    } catch (err) {
      console.error('Error registering user:', err);
      throw err;
    }
  },

  /** Update user info */
  async updateUser(userId, userData) {
    try {
      const updatedUser = await userModel.updateUser(userId, userData);
      return updatedUser;
    } catch (err) {
      console.error(`Error updating user ${userId}:`, err);
      throw err;
    }
  },

  /** Delete (or ban) a user */
  async deleteUser(userId) {
    try {
      const result = await userModel.deleteUser(userId);
      return result;
    } catch (err) {
      console.error(`Error deleting user ${userId}:`, err);
      throw err;
    }
  },

  /** Handle login */
  async login(credentials) {
    try {
      const authData = await userModel.login(credentials);
      return authData;
    } catch (err) {
      console.error('Error logging in:', err);
      throw err;
    }
  },

  /** Handle logout */
  async logout() {
    try {
      const res = await userModel.logout();
      return res;
    } catch (err) {
      console.error('Error logging out:', err);
      throw err;
    }
  },

  /** Fetch current user's profile */
  async fetchProfile() {
    try {
      const profile = await userModel.fetchProfile();
      return profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      throw err;
    }
  }
};

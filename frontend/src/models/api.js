// src/models/api.js

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}/${path}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorBody = null;

      try {
        errorBody = await response.json();
      } catch (getError) {
        // if parsing fails, ignore
      }

      const errorMessage =
        (errorBody && errorBody.message) ||
        `API request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (err) {
    console.error('API request error:', err);
    throw err;
  }
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

// Central API configuration for Task Manager Backend (Express + MongoDB + JWT Auth)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'task_auth_token';
const USER_KEY = 'task_auth_user';

// Callbacks for 401 unauthorized events
const unauthorizedListeners = new Set();

export const onUnauthorized = (callback) => {
  unauthorizedListeners.add(callback);
  return () => unauthorizedListeners.delete(callback);
};

// Token Storage Helpers
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to save token to localStorage:', err);
  }
};

export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (err) {
    console.error('Failed to save user to localStorage:', err);
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to clear auth from localStorage:', err);
  }
};

/**
 * Returns Authorization header if token exists
 */
const getAuthHeaders = (additionalHeaders = {}) => {
  const token = getToken();
  const headers = { ...additionalHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Helper to handle fetch responses and parse errors gracefully
 */
async function handleResponse(response) {
  if (response.status === 401) {
    let errorMessage = 'Session expired or unauthorized. Please log in again.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // response wasn't JSON
    }
    // Notify unauthorized subscribers
    unauthorizedListeners.forEach((cb) => cb(errorMessage));
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// ==========================================
// Authentication Endpoints
// ==========================================

/**
 * Register a new user (POST /auth/register)
 * @param {Object} data { name, email, password }
 */
export const register = async (data) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  if (result.token) {
    setToken(result.token);
    setUser(result.user);
  }
  return result;
};

/**
 * Login existing user (POST /auth/login)
 * @param {Object} credentials { email, password }
 */
export const login = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const result = await handleResponse(response);
  if (result.token) {
    setToken(result.token);
    setUser(result.user);
  }
  return result;
};

/**
 * Fetch authenticated user profile (GET /auth/me)
 */
export const getMe = async () => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const result = await handleResponse(response);
  if (result.user) {
    setUser(result.user);
  }
  return result;
};

/**
 * Client logout
 */
export const logout = () => {
  clearAuth();
};

// ==========================================
// Protected Task Endpoints (Authorization header automatically attached)
// ==========================================

/**
 * Fetch all tasks from MongoDB (GET /tasks)
 */
export const getTasks = async () => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

/**
 * Fetch single task by ID (GET /tasks/:id)
 */
export const getTaskById = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

/**
 * Create a new task (POST /tasks)
 * @param {Object} taskData { title, description, completed, priority }
 */
export const createTask = async (taskData) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(taskData)
  });
  return handleResponse(response);
};

/**
 * Update an existing task (PUT /tasks/:id)
 * @param {string} id Task ID
 * @param {Object} taskData Updated fields
 */
export const updateTask = async (id, taskData) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(taskData)
  });
  return handleResponse(response);
};

/**
 * Delete a task (DELETE /tasks/:id)
 * @param {string} id Task ID
 */
export const deleteTask = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

/**
 * Generate AI task description (POST /api/ai/generate-description)
 * @param {string} title Task title
 */
export const generateTaskDescription = async (title) => {
  const response = await fetch(`${BASE_URL}/api/ai/generate-description`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ title })
  });
  return handleResponse(response);
};

export default {
  BASE_URL,
  getToken,
  setToken,
  getUser,
  setUser,
  clearAuth,
  register,
  login,
  getMe,
  logout,
  onUnauthorized,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  generateTaskDescription
};

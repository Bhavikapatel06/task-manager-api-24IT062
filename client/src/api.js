// Central API configuration for Task Manager Backend (Express + MongoDB)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Helper to handle fetch responses and parse errors gracefully
 */
async function handleResponse(response) {
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

/**
 * Fetch all tasks from MongoDB (GET /tasks)
 */
export const getTasks = async () => {
  const response = await fetch(`${BASE_URL}/tasks`);
  return handleResponse(response);
};

/**
 * Fetch single task by ID (GET /tasks/:id)
 */
export const getTaskById = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`);
  return handleResponse(response);
};

/**
 * Create a new task (POST /tasks)
 * @param {Object} taskData { title, description, completed, priority }
 */
export const createTask = async (taskData) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
    headers: {
      'Content-Type': 'application/json'
    },
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
    method: 'DELETE'
  });
  return handleResponse(response);
};

export default {
  BASE_URL,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};

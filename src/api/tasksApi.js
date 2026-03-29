import api from './authApi';

export const tasksAPI = {
  // Get dashboard data
  getDashboard: () => {
    return api.get('/api/tasks/dashboard/');
  },

  // Create new task
  createTask: (taskData) => {
    return api.post('/api/tasks/create/', taskData);
  },

  // Search tasks
  searchTasks: (searchQuery) => {
    return api.get(`/api/tasks/?search=${searchQuery}`);
  },

  // Update task status
  updateTaskStatus: (taskId, status) => {
    return api.patch(`/api/tasks/${taskId}/status/`, { status });
  },

  // Quick edit task
  quickEditTask: (taskId, updateData) => {
    return api.patch(`/api/tasks/${taskId}/quick-edit/`, updateData);
  },

  // Get user's tasks
  getMyTasks: () => {
    return api.get('/api/tasks/my-tasks/');
  },

  // Get assigned tasks
  getAssignedTasks: () => {
    return api.get('/api/tasks/my-tasks/');
  },

  // Delete task
  deleteTask: (taskId) => {
    return api.delete(`/api/tasks/${taskId}/`);
  },

  // Get single task
  getTask: (taskId) => {
    return api.get(`/api/tasks/${taskId}/`);
  },

  // Update task
  updateTask: (taskId, taskData) => {
    return api.put(`/api/tasks/${taskId}/`, taskData);
  },

  // Get task statistics
  getTaskStatistics: () => {
    return api.get('/api/tasks/statistics/');
  },

  // Get tasks by status
  getTasksByStatus: (status) => {
    return api.get(`/api/tasks/?status=${status}`);
  },

  // Update task status
  updateTaskStatus: (taskId, statusData) => {
    return api.patch(`/api/tasks/${taskId}/`, statusData);
  },
};

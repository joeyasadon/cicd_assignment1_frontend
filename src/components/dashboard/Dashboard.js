import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../../api/tasksApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'all', 'todo', 'in_progress', 'completed'
  const [viewTasks, setViewTasks] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get both dashboard data and statistics for accurate counts
      const [dashboardResponse, statsResponse] = await Promise.all([
        tasksAPI.getDashboard(),
        tasksAPI.getTaskStatistics()
      ]);
      
      console.log('Dashboard API response:', dashboardResponse);
      console.log('Statistics API response:', statsResponse);
      
      // Extract dashboard data
      const backendStats = dashboardResponse.data?.dashboard?.stats || {};
      const statsData = statsResponse.data?.statistics || {};
      
      // Transform to match frontend expectations
      const transformedStats = {
        total_tasks: backendStats.total_tasks || 0,
        todo_count: statsData.by_status?.todo || 0,
        in_progress_count: statsData.by_status?.in_progress || 0,
        completed_count: backendStats.completed_tasks || 0,
        owned_tasks: backendStats.owned_tasks || 0,
        assigned_tasks: backendStats.assigned_tasks || 0,
        overdue_tasks: backendStats.overdue_tasks || 0,
        due_today: backendStats.due_today || 0,
        due_this_week: backendStats.due_this_week || 0,
        recent_tasks: dashboardResponse.data?.dashboard?.recent_tasks || []
      };
      
      setDashboardData(transformedStats);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
      setDashboardData({}); // Set empty object on error
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await tasksAPI.searchTasks(query);
      // Extract tasks from nested response structure
      let tasksData = [];
      if (response.data?.results?.tasks) {
        tasksData = response.data.results.tasks;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        tasksData = response.data.results;
      } else if (response.data?.tasks) {
        tasksData = response.data.tasks;
      } else if (Array.isArray(response.data)) {
        tasksData = response.data;
      }
      
      setSearchResults(tasksData);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEdit = (taskId) => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigate(`/edit-task/${taskId}`);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(taskId);
        // Remove from search results
        setSearchResults(prevResults => prevResults.filter(task => task.id !== taskId));
        // Refresh view tasks if in a task view
        if (activeView !== 'dashboard') {
          await fetchTasksByStatus(activeView);
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleStatCardClick = async (viewType) => {
    setActiveView(viewType);
    if (viewType === 'dashboard') {
      setViewTasks([]);
      return;
    }
    await fetchTasksByStatus(viewType);
  };

  const fetchTasksByStatus = async (status) => {
    setViewLoading(true);
    try {
      let response;
      if (status === 'all') {
        response = await tasksAPI.getMyTasks();
      } else {
        response = await tasksAPI.getTasksByStatus(status);
      }
      
      // Extract tasks from nested response structure
      let tasksData = [];
      if (response.data?.results?.tasks) {
        tasksData = response.data.results.tasks;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        tasksData = response.data.results;
      } else if (response.data?.tasks) {
        tasksData = response.data.tasks;
      } else if (Array.isArray(response.data)) {
        tasksData = response.data;
      }
      
      setViewTasks(tasksData);
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setViewTasks([]);
    } finally {
      setViewLoading(false);
    }
  };

  const handleTaskEdit = (taskId) => {
    navigate(`/edit-task/${taskId}`);
  };

  const handleTaskDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(taskId);
        // Refresh the task list
        if (activeView !== 'dashboard') {
          await fetchTasksByStatus(activeView);
        }
        // Also refresh dashboard data to update counts
        fetchDashboardData();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateTaskStatus(taskId, { status: newStatus });
      // Refresh the task list to show updated status
      if (activeView !== 'dashboard') {
        await fetchTasksByStatus(activeView);
      }
      // Also refresh dashboard data to update counts
      fetchDashboardData();
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleOutsideClick = (e) => {
    if (!e.target.closest('.search-container')) {
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('click', handleOutsideClick);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchDashboardData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>TaskSphere Dashboard</h1>
          <div className="header-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
              {showSearchResults && (
                <div className="search-results">
                  {searchLoading ? (
                    <div className="search-loading">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((task) => (
                      <div key={task.id} className="search-result-item">
                        <div className="task-content">
                          <div className="task-header">
                            <h4 className="task-title">{task.title}</h4>
                            <div className="task-actions">
                              <button 
                                onClick={() => handleEdit(task.id)} 
                                className="edit-button"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(task.id)} 
                                className="delete-button"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="task-description">{task.description}</p>
                          <div className="task-meta">
                            <span className={`status ${task.status}`}>{task.status}</span>
                            <span className={`priority ${task.priority}`}>{task.priority}</span>
                            <span className="category">{task.category}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="search-no-results">No tasks found</div>
                  )}
                </div>
              )}
            </div>
            <div className="user-info">
              <span>Welcome, {user?.profile?.display_name || user?.email}</span>
              <button 
                onClick={() => navigate('/profile')} 
                className="profile-button"
              >
                Edit Profile
              </button>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="stats-grid">
          <div 
            className={`stat-card ${activeView === 'all' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('all')}
          >
            <h3>Total Tasks</h3>
            <p className="stat-number">{dashboardData?.total_tasks || 0}</p>
          </div>
          <div 
            className={`stat-card ${activeView === 'todo' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('todo')}
          >
            <h3>To Do</h3>
            <p className="stat-number todo">{dashboardData?.todo_count || 0}</p>
          </div>
          <div 
            className={`stat-card ${activeView === 'in_progress' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('in_progress')}
          >
            <h3>In Progress</h3>
            <p className="stat-number in-progress">{dashboardData?.in_progress_count || 0}</p>
          </div>
          <div 
            className={`stat-card ${activeView === 'completed' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('completed')}
          >
            <h3>Completed</h3>
            <p className="stat-number completed">{dashboardData?.completed_count || 0}</p>
          </div>
        </div>

        <div className="dashboard-actions">
          {activeView !== 'dashboard' && (
            <button 
              onClick={() => handleStatCardClick('dashboard')} 
              className="action-button back-to-dashboard"
            >
              Dashboard Overview
            </button>
          )}
          <button 
            onClick={() => navigate('/tasks')} 
            className="action-button"
          >
            View All Tasks
          </button>
          <button 
            onClick={() => navigate('/create-task')} 
            className="action-button primary"
          >
            Create New Task
          </button>
        </div>

        {/* Task List View */}
        {activeView !== 'dashboard' && (
          <div className="task-list-view">
            <h2>
              {activeView === 'all' && 'All Tasks'}
              {activeView === 'todo' && 'To Do Tasks'}
              {activeView === 'in_progress' && 'In Progress Tasks'}
              {activeView === 'completed' && 'Completed Tasks'}
            </h2>
            
            {viewLoading ? (
              <div className="loading">Loading tasks...</div>
            ) : viewTasks.length > 0 ? (
              <div className="tasks-grid">
                {viewTasks.map(task => (
                  <div key={task.id} className="task-card">
                    <div className="task-header">
                      <h3>{task.title}</h3>
                      <div className="task-actions">
                        <button onClick={() => handleTaskEdit(task.id)} className="edit-button">
                          Edit
                        </button>
                        <button onClick={() => handleTaskDelete(task.id)} className="delete-button">
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <p className="task-description">{task.description}</p>
                    
                    <div className="task-meta">
                      <span className={`status ${task.status}`}>{task.status}</span>
                      <span className={`priority ${task.priority}`}>{task.priority}</span>
                      <span className="category">{task.category}</span>
                    </div>

                    <div className="status-actions">
                      <select 
                        value={task.status} 
                        onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-tasks">
                <p>No tasks found in this category.</p>
              </div>
            )}
          </div>
        )}

        {dashboardData?.recent_tasks && Array.isArray(dashboardData.recent_tasks) && dashboardData.recent_tasks.length > 0 && activeView === 'dashboard' && (
          <div className="recent-tasks">
            <h2>Recent Tasks</h2>
            <div className="task-list">
              {dashboardData.recent_tasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-content">
                    <div className="task-info">
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                      <div className="task-meta">
                        <span className={`status ${task.status}`}>{task.status}</span>
                        <span className={`priority ${task.priority}`}>{task.priority}</span>
                      </div>
                      <div className="status-actions">
                        <select 
                          value={task.status} 
                          onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button 
                        onClick={() => handleEdit(task.id)} 
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(task.id)} 
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

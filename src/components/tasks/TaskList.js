import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../../api/tasksApi';
import { useNavigate } from 'react-router-dom';
import './TaskList.css';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log('Fetching tasks...');
      const response = await tasksAPI.getMyTasks();
      console.log('Tasks API response:', response);
      console.log('Full response structure:', JSON.stringify(response, null, 2));
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', Object.keys(response.data || {}));
      console.log('Response data values:', Object.values(response.data || {}));
      console.log('Is response.data an array?', Array.isArray(response.data));
      
      // Check each possible response structure with detailed logging
      let tasksData = [];
      console.log('Checking response.data.results.tasks:', response.data?.results?.tasks);
      console.log('Is response.data.results.tasks an array?', Array.isArray(response.data?.results?.tasks));
      
      if (response.data?.results && Array.isArray(response.data.results.tasks)) {
        tasksData = response.data.results.tasks;
        console.log('✅ Found tasks in response.data.results.tasks:', tasksData);
      } else if (response.data && Array.isArray(response.data.tasks)) {
        tasksData = response.data.tasks;
        console.log('✅ Found tasks in response.data.tasks:', tasksData);
      } else if (response.data && Array.isArray(response.data.results)) {
        tasksData = response.data.results;
        console.log('✅ Found tasks in response.data.results:', tasksData);
      } else if (Array.isArray(response.data)) {
        tasksData = response.data;
        console.log('✅ Found tasks directly in response.data:', tasksData);
      } else {
        console.log('❌ Unknown response structure, using empty array');
        console.log('Full response data:', response.data);
      }
      
      console.log('Final processed tasks data:', tasksData);
      console.log('Number of tasks:', tasksData.length);
      setTasks(tasksData);
    } catch (err) {
      console.error('Tasks error:', err);
      setError('Failed to load tasks');
      setTasks([]); // Ensure tasks is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTasks();
      return;
    }

    try {
      setLoading(true);
      const response = await tasksAPI.searchTasks(searchQuery);
      // Extract tasks from nested paginated response
      let tasksData = [];
      if (response.data?.results && Array.isArray(response.data.results.tasks)) {
        tasksData = response.data.results.tasks;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        tasksData = response.data.results;
      } else if (response.data && Array.isArray(response.data.tasks)) {
        tasksData = response.data.tasks;
      } else if (Array.isArray(response.data)) {
        tasksData = response.data;
      }
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to search tasks');
      console.error('Search error:', err);
      setTasks([]); // Ensure tasks is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateTaskStatus(taskId, newStatus);
      setTasks(prevTasks => Array.isArray(prevTasks) ? prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ) : []);
    } catch (err) {
      setError('Failed to update task status');
      console.error('Status update error:', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(taskId);
        setTasks(prevTasks => Array.isArray(prevTasks) ? prevTasks.filter(task => task.id !== taskId) : []);
      } catch (err) {
        setError('Failed to delete task');
        console.error('Delete error:', err);
      }
    }
  };

  const handleEdit = (taskId) => {
    navigate(`/edit-task/${taskId}`);
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h1>My Tasks</h1>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="back-button"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="search-bar">
        <input
            id="search-input"
          name="searchQuery"
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={() => {
          console.log('Create Task button clicked');
          navigate('/create-task');
        }} className="create-button">
          Create Task
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tasks-grid">
        {!Array.isArray(tasks) || tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found. Create your first task!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <div className="task-actions">
                  <button onClick={() => handleEdit(task.id)} className="edit-button">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="delete-button">
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
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;

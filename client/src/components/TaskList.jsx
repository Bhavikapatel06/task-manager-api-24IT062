import React, { useState, useMemo } from 'react';
import { Search, Inbox, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import TaskItem from './TaskItem';

export default function TaskList({
  tasks,
  isLoading,
  error,
  onRetry,
  onToggleComplete,
  onEdit,
  onDeleteClick,
  onOpenCreate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | completed
  const [priorityFilter, setPriorityFilter] = useState('all'); // all | low | medium | high

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      const matchesSearch =
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && task.completed) ||
        (statusFilter === 'pending' && !task.completed);

      // Priority
      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  return (
    <div className="glass-card">
      <div className="card-header">
        <h2 className="card-title">
          Tasks List
          <span className="badge-tag" style={{ marginLeft: '0.5rem' }}>
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenCreate}
          >
            <Plus size={15} />
            Add Task
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={onRetry}
            title="Refresh from MongoDB"
            aria-label="Refresh from MongoDB"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div className="error-banner">
          <div className="error-banner-content">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={15} />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {['all', 'pending', 'completed'].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="state-container">
          <div className="spinner"></div>
          <h3 className="state-title">Loading Tasks from MongoDB...</h3>
          <p className="state-desc">Fetching real-time collection records via Express backend API.</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="state-container">
          <Inbox size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
          <h3 className="state-title">No Tasks Found</h3>
          <p className="state-desc">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No tasks match your current search or filter criteria. Try adjusting the filters above.'
              : 'Your task list is empty. Click "Add Task" above to create your first task!'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenCreate}
              style={{ marginTop: '1rem' }}
            >
              <Plus size={15} />
              Create First Task
            </button>
          )}
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

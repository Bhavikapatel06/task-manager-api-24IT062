import React from 'react';
import { Check, Calendar, Edit2, Trash2, Clock } from 'lucide-react';

export default function TaskItem({ task, onToggleComplete, onEdit, onDeleteClick }) {
  const isCompleted = Boolean(task.completed);
  const priorityClass = `priority-${task.priority || 'medium'}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className={`task-item ${priorityClass} ${isCompleted ? 'completed' : ''} ${task._isOptimistic ? 'optimistic' : ''}`}>
      <button
        type="button"
        className={`task-checkbox-custom ${isCompleted ? 'checked' : ''}`}
        onClick={() => onToggleComplete(task)}
        aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as complete'}
      >
        {isCompleted && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="task-body">
        <div className="task-header-row">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-actions">
            <button
              type="button"
              className="btn-icon edit"
              onClick={() => onEdit(task)}
              title="Edit Task"
              aria-label="Edit Task"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              className="btn-icon delete"
              onClick={() => onDeleteClick(task)}
              title="Delete Task"
              aria-label="Delete Task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-footer-row">
          <span className={`priority-badge ${task.priority || 'medium'}`}>
            {task.priority || 'medium'}
          </span>

          <span className="task-date">
            <Calendar size={12} />
            {formatDate(task.createdAt)}
          </span>

          {task._isOptimistic && (
            <span style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> Syncing to MongoDB...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

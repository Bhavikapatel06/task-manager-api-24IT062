import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, X, Sparkles } from 'lucide-react';

export default function TaskForm({ isOpen, onSubmit, editingTask, onClose, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    completed: false
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title || '',
        description: editingTask.description || '',
        priority: editingTask.priority || 'medium',
        completed: Boolean(editingTask.completed)
      });
      setValidationError('');
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        completed: false
      });
      setValidationError('');
    }
  }, [editingTask, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'title' && validationError) {
      setValidationError('');
    }
  };

  const handlePrioritySelect = (priority) => {
    setFormData((prev) => ({ ...prev, priority }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setValidationError('Task title is required.');
      return;
    }
    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      completed: formData.completed
    });
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog task-form-modal">
        <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.65rem' }}>
          <h2 className="card-title">
            {editingTask ? (
              <>
                <Edit3 size={17} style={{ color: 'var(--info)' }} />
                Edit Task
              </>
            ) : (
              <>
                <PlusCircle size={17} style={{ color: 'var(--primary)' }} />
                Create New Task
              </>
            )}
          </h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Close popup"
            aria-label="Close popup"
            disabled={isSubmitting}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {validationError && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              {validationError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Task Title <span className="req">*</span>
            </label>
            <input
              id="task-title"
              name="title"
              type="text"
              className="form-input"
              placeholder="e.g., Implement CORS in Express server"
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">
              Description <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(optional)</span>
            </label>
            <textarea
              id="task-desc"
              name="description"
              className="form-textarea"
              placeholder="Add details, notes, or acceptance criteria..."
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Priority Level</label>
            <div className="priority-selector">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`priority-btn ${formData.priority === p ? `active ${p}` : ''}`}
                  onClick={() => handlePrioritySelect(p)}
                  disabled={isSubmitting}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-group" htmlFor="task-completed">
              <input
                id="task-completed"
                name="completed"
                type="checkbox"
                checked={formData.completed}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <span>Mark as completed</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', margin: 0 }}></span>
                  Saving...
                </>
              ) : editingTask ? (
                <>
                  <Edit3 size={15} />
                  Update Task
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Add Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

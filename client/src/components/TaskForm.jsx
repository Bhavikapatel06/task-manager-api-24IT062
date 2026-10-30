import React, { useState, useEffect } from 'react';
import { generateTaskDescription } from '../api';
import { PlusCircle, Edit3, X, Sparkles } from 'lucide-react';

export default function TaskForm({ isOpen, onSubmit, editingTask, onClose, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    completed: false
  });

  const [validationError, setValidationError] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  const handleGenerateAiDescription = async () => {
    if (!formData.title.trim()) {
      setValidationError("Please enter a task title first to generate an AI description.");
      return;
    }

    try {
      setIsAiLoading(true);
      setAiNotice(null);
      const res = await generateTaskDescription(formData.title.trim());

      if (res && res.description) {
        setFormData((prev) => ({
          ...prev,
          description: res.description
        }));
        setAiNotice({
          fallback: Boolean(res.fallback),
          text: res.fallback
            ? "⚠️ AI service unavailable. A smart local template suggestion was applied."
            : "✨ AI description generated! Feel free to review and edit."
        });
      }
    } catch (err) {
      console.warn("AI generation fallback triggered:", err.message);
      setFormData((prev) => ({
        ...prev,
        description: "Review requirements, execute deliverables, and complete subtasks for: " + formData.title.trim()
      }));
      setAiNotice({
        fallback: true,
        text: "⚠️ Offline fallback description applied."
      });
    } finally {
      setIsAiLoading(false);
    }
  };


  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title || '',
        description: editingTask.description || '',
        priority: editingTask.priority || 'medium',
        completed: Boolean(editingTask.completed)
      });
      setValidationError('');
      setAiNotice(null);
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        completed: false
      });
      setValidationError('');
      setAiNotice(null);
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label className="form-label" htmlFor="task-desc" style={{ marginBottom: 0 }}>
                Description <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(optional)</span>
              </label>
              <button
                type="button"
                className="btn-ai-generate"
                onClick={handleGenerateAiDescription}
                disabled={isAiLoading || !formData.title.trim() || isSubmitting}
                title={!formData.title.trim() ? "Enter a task title first" : "Auto-generate description with AI"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.22rem 0.65rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid #818cf8",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))",
                  color: "#6366f1",
                  cursor: formData.title.trim() && !isAiLoading ? "pointer" : "not-allowed",
                  opacity: formData.title.trim() && !isAiLoading ? 1 : 0.6,
                  transition: "all 0.2s ease"
                }}
              >
                <Sparkles size={13} style={{ animation: isAiLoading ? "spin 1.5s linear infinite" : "none" }} />
                {isAiLoading ? "Generating AI..." : "Generate with AI"}
              </button>
            </div>

            {aiNotice && (
              <div
                style={{
                  fontSize: "0.74rem",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "6px",
                  marginBottom: "0.55rem",
                  background: aiNotice.fallback ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.08)",
                  border: `1px solid ${aiNotice.fallback ? "rgba(245, 158, 11, 0.3)" : "rgba(99, 102, 241, 0.25)"}`,
                  color: aiNotice.fallback ? "#b45309" : "#4f46e5",
                  lineHeight: "1.4"
                }}
              >
                {aiNotice.text}
              </div>
            )}

            <textarea
              id="task-desc"
              name="description"
              className="form-textarea"
              placeholder="Add details, notes, or acceptance criteria..."
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem", fontStyle: "italic" }}>
              💡 Suggestions are AI-generated. Review and modify before saving.
            </div>
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

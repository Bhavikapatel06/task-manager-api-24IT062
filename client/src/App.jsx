import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsCard from './components/StatsCard';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getUser,
  getToken,
  getMe,
  logout,
  onUnauthorized
} from './api';
import { ShieldCheck, CheckCircle2, LogIn } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(getUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Helper for toast notifications
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all tasks from MongoDB for authenticated user
  const fetchTasks = useCallback(async () => {
    if (!getToken()) {
      setIsLoading(false);
      setTasks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError(err.message || 'Unable to connect to backend server. Make sure Express server is running on port 5000.');
      addToast(err.message || 'Failed to connect to backend database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Session verification on mount & 401 handling
  useEffect(() => {
    const checkSession = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await getMe();
          setUser(res.user);
          fetchTasks();
        } catch (err) {
          console.warn('Initial session validation failed:', err);
          setUser(null);
        }
      }
    };

    checkSession();

    // Listen for 401 unauthorized events across all API calls
    const unsubscribe = onUnauthorized((msg) => {
      setUser(null);
      setTasks([]);
      setIsAuthModalOpen(true);
      addToast(msg || 'Session expired. Please log in again.', 'error');
    });

    return () => unsubscribe();
  }, [fetchTasks, addToast]);

  // Handle successful login/registration
  const handleAuthSuccess = (authenticatedUser, successMessage) => {
    setUser(authenticatedUser);
    setIsAuthModalOpen(false);
    addToast(successMessage || 'Authentication successful!', 'success');
    fetchTasks();
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setUser(null);
    setTasks([]);
    addToast('Logged out successfully', 'info');
  };

  // Open creation modal popup
  const handleOpenCreate = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      addToast('Please sign in to create tasks.', 'info');
      return;
    }
    setEditingTask(null);
    setIsFormModalOpen(true);
  };

  // Open edit modal popup
  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  // Close form modal popup
  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setEditingTask(null);
  };

  // Handle Form Submission (Create or Update)
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        // UPDATE (PUT /tasks/:id)
        const updated = await updateTask(editingTask._id, formData);
        setTasks((prev) =>
          prev.map((t) => (t._id === editingTask._id ? updated : t))
        );
        handleCloseForm();
        addToast('Task updated successfully!', 'success');
      } else {
        // OPTIMISTIC TASK CREATION
        const tempId = `temp-${Date.now()}`;
        const optimisticTask = {
          ...formData,
          _id: tempId,
          createdAt: new Date().toISOString(),
          _isOptimistic: true
        };

        // 1. Optimistically insert into state & close popup
        setTasks((prev) => [optimisticTask, ...prev]);
        handleCloseForm();

        // 2. Perform backend API write
        try {
          const savedTask = await createTask(formData);
          // Replace temporary optimistic item with verified MongoDB document
          setTasks((prev) =>
            prev.map((t) => (t._id === tempId ? savedTask : t))
          );
          addToast('Task created successfully!', 'success');
        } catch (postErr) {
          // Rollback on server failure
          setTasks((prev) => prev.filter((t) => t._id !== tempId));
          throw postErr;
        }
      }
    } catch (err) {
      console.error('Operation failed:', err);
      addToast(err.message || 'Action failed. Please check connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Task Completion (PUT /tasks/:id)
  const handleToggleComplete = async (task) => {
    const newStatus = !task.completed;
    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, completed: newStatus } : t))
    );

    try {
      const updated = await updateTask(task._id, { completed: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? updated : t))
      );
      addToast(
        newStatus ? 'Task marked as completed!' : 'Task marked as in progress',
        'info'
      );
    } catch (err) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, completed: task.completed } : t))
      );
      addToast(err.message || 'Failed to update task completion state', 'error');
    }
  };

  // Trigger Delete Confirmation Modal
  const handleDeleteClick = (task) => {
    setDeleteCandidate(task);
  };

  // Confirm and Execute Deletion (DELETE /tasks/:id)
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await deleteTask(deleteCandidate._id);
      setTasks((prev) => prev.filter((t) => t._id !== deleteCandidate._id));
      addToast('Task deleted successfully', 'success');
      setDeleteCandidate(null);
      if (editingTask?._id === deleteCandidate._id) {
        handleCloseForm();
      }
    } catch (err) {
      console.error('Delete failed:', err);
      addToast(err.message || 'Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="main-container">
        {!user ? (
          /* Unauthenticated Landing Screen */
          <section className="auth-guard-banner">
            <div className="auth-guard-icon-wrapper">
              <ShieldCheck size={28} />
            </div>
            <h2 className="auth-guard-title">Secure & Streamlined Task Management</h2>
            <p className="auth-guard-desc">
              Organize your daily tasks, track project priorities, and maintain productivity in a secure, real-time environment. Sign in to access your personal dashboard.
            </p>

            <div className="auth-guard-features">
              <div className="auth-guard-feature-item">
                <CheckCircle2 size={14} />
                <span>Real-Time Cloud Storage</span>
              </div>
              <div className="auth-guard-feature-item">
                <CheckCircle2 size={14} />
                <span>Secure User Isolation</span>
              </div>
              <div className="auth-guard-feature-item">
                <CheckCircle2 size={14} />
                <span>Priority & Progress Filters</span>
              </div>
              <div className="auth-guard-feature-item">
                <CheckCircle2 size={14} />
                <span>Fast & Responsive Interface</span>
              </div>
            </div>

            <div className="auth-guard-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <LogIn size={16} />
                <span>Sign In / Get Started</span>
              </button>
            </div>
          </section>
        ) : (
          /* Authenticated User Workspace */
          <>
            {/* Overview Stats */}
            <StatsCard tasks={tasks} />

            {/* Task List Component */}
            <section className="list-panel-container">
              <TaskList
                tasks={tasks}
                isLoading={isLoading}
                error={error}
                onRetry={fetchTasks}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDeleteClick={handleDeleteClick}
                onOpenCreate={handleOpenCreate}
              />
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <div>
          TaskManager Pro • <strong>Modern Task Management System</strong>
        </div>
      </footer>

      {/* Auth Modal Popup (Login & Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Task Creation & Edit Modal Popup */}
      <TaskForm
        isOpen={isFormModalOpen}
        onSubmit={handleFormSubmit}
        editingTask={editingTask}
        onClose={handleCloseForm}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal Popup */}
      <ConfirmModal
        isOpen={Boolean(deleteCandidate)}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${deleteCandidate?.title}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
        isDeleting={isDeleting}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

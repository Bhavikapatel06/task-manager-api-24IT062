import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsCard from './components/StatsCard';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import { getTasks, createTask, updateTask, deleteTask } from './api';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [serverStatus, setServerStatus] = useState('connecting');

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

  // Fetch all tasks from MongoDB on component mount
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTasks();
      setTasks(data);
      setServerStatus('connected');
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError(err.message || 'Unable to connect to backend server. Make sure Express server is running on port 5000.');
      setServerStatus('error');
      addToast('Failed to connect to backend database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Open creation modal popup
  const handleOpenCreate = () => {
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
        addToast('Task updated successfully in MongoDB!', 'success');
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
          addToast('Task created and saved to MongoDB!', 'success');
        } catch (postErr) {
          // Rollback on server failure
          setTasks((prev) => prev.filter((t) => t._id !== tempId));
          throw postErr;
        }
      }
    } catch (err) {
      console.error('Operation failed:', err);
      addToast(err.message || 'Action failed. Please check backend connection.', 'error');
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
      addToast('Task permanently deleted from MongoDB', 'success');
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
      <Navbar serverStatus={serverStatus} />

      <main className="main-container">
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
      </main>

      <footer className="footer">
        <div>
          Practical 6: Full Stack Integration (React + Node/Express + MongoDB) • <strong>AWDF Lab</strong>
        </div>
      </footer>

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
        message={`Are you sure you want to permanently delete "${deleteCandidate?.title}" from the database?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
        isDeleting={isDeleting}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

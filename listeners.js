const taskEvents = require('./events');

// ==========================================
// Practical 10: Event Listeners
// ==========================================

// 1. Error Event Listener (Supplementary Problem)
// Catches and logs any error thrown inside event handlers to prevent server crashes
taskEvents.on('error', (err) => {
  console.error(`[Notification Error] Handled error in background listener at ${new Date().toISOString()}: ${err.message}`);
});

// 2. task-created Event Listener (Primary Task & Supplementary Problem)
// Handled asynchronously without blocking the main API response
taskEvents.on('task-created', (task) => {
  try {
    const assignedUser = task.user ? (task.user._id || task.user) : 'Unassigned';
    console.log(`[Notification Listener] Event 'task-created' received for "${task.title}" at ${new Date().toISOString()}`);

    // Simulate error handling if title contains 'simulate-error'
    if (task.title && task.title.toLowerCase().includes('simulate-error')) {
      throw new Error(`Simulated notification failure for task: "${task.title}"`);
    }

    // Step 5: Simulate a slow notification handler (e.g., email / SMS / webhook with 2s delay)
    // to clearly demonstrate non-blocking asynchronous execution
    setTimeout(() => {
      try {
        console.log(
          `[Notification Background Service] Completed processing notification for task "${task.title}" (User: ${assignedUser}) at ${new Date().toISOString()}`
        );
      } catch (err) {
        taskEvents.emit('error', err);
      }
    }, 2000);
  } catch (err) {
    // Forward error to the registered 'error' listener instead of unhandled exception
    taskEvents.emit('error', err);
  }
});

// 3. task-deleted Event Listener (Supplementary Problem)
// Logs a distinct deletion message asynchronously
taskEvents.on('task-deleted', (task) => {
  try {
    const assignedUser = task.user ? (task.user._id || task.user) : 'Unassigned';
    console.log(`[Notification Listener] Event 'task-deleted' received for "${task.title}" at ${new Date().toISOString()}`);

    // Asynchronous simulated cleanup / audit log service with 1s delay
    setTimeout(() => {
      try {
        console.log(
          `[Notification Background Service] Task "${task.title}" (ID: ${task._id}) deletion logged at ${new Date().toISOString()} (User: ${assignedUser})`
        );
      } catch (err) {
        taskEvents.emit('error', err);
      }
    }, 1000);
  } catch (err) {
    taskEvents.emit('error', err);
  }
});

module.exports = taskEvents;

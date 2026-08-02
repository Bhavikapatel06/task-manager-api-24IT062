const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Temporary in-memory array for task storage
let tasks = [
  {
    id: 1,
    title: 'Learn Express Middleware',
    description: 'Understand request lifecycle and next() function execution flow',
    completed: true
  },
  {
    id: 2,
    title: 'Build RESTful API',
    description: 'Implement full CRUD routes with Express and custom middleware pipeline',
    completed: false
  }
];
let nextId = 3;

// ==========================================
// 1. Global Request Logging Middleware
// ==========================================
// Logs HTTP method, URL, and timestamp for every incoming request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Parse JSON request body
app.use(express.json());

// ==========================================
// 2. Custom Middleware: Content-Type Validator
// ==========================================
// Rejects POST and PUT requests without Content-Type: application/json header
const validateJsonHeader = (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Header "Content-Type: application/json" is required for POST and PUT requests.'
      });
    }
  }
  next();
};

app.use(validateJsonHeader);

// ==========================================
// 3. Route-Specific Middleware: Task ID Validator
// ==========================================
// Validates that the task ID parameter is a positive integer before reaching route handlers
const validateTaskId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Task ID must be a positive integer.'
    });
  }
  req.taskId = id;
  next();
};

// ==========================================
// 4. RESTful API Routes (CRUD Operations)
// ==========================================

// GET /tasks - Retrieve all tasks
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// GET /tasks/:id - Retrieve a single task by ID
app.get('/tasks/:id', validateTaskId, (req, res) => {
  const task = tasks.find(t => t.id === req.taskId);
  if (!task) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Task with ID ${req.taskId} not found.`
    });
  }
  res.status(200).json(task);
});

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
  const { title, description, completed } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "title" is required and must be a non-empty string.'
    });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    description: description ? String(description).trim() : '',
    completed: Boolean(completed)
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', validateTaskId, (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.taskId);
  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Task with ID ${req.taskId} not found.`
    });
  }

  const { title, description, completed } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "title" must be a non-empty string.'
    });
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: String(description).trim() }),
    ...(completed !== undefined && { completed: Boolean(completed) })
  };

  res.status(200).json(tasks[taskIndex]);
});

// DELETE /tasks/:id - Delete a task by ID
app.delete('/tasks/:id', validateTaskId, (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.taskId);
  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Task with ID ${req.taskId} not found.`
    });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.status(200).json({
    message: 'Task deleted successfully',
    task: deletedTask
  });
});

// GET /test-error - Demo route to test global error handling middleware
app.get('/test-error', (req, res, next) => {
  const err = new Error('Test error for global error handler demonstration');
  next(err);
});

// ==========================================
// 5. 404 Handler for Undefined Routes
// ==========================================
// Catches any requests to routes that were not defined above
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ==========================================
// 6. Global Error Handling Middleware
// ==========================================
// Must be defined last in the middleware chain with 4 parameters (err, req, res, next)
app.use((err, req, res, next) => {
  console.error('[Global Error Handler Log]:', err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

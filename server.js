const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task-manager-db';

// ==========================================
// 1. Database Connection
// ==========================================
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ==========================================
// 2. Enable CORS (Cross-Origin Resource Sharing)
// ==========================================
app.use(cors());

// ==========================================
// 3. Global Request Logging Middleware
// ==========================================
// Logs HTTP method, URL, and timestamp for every incoming request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Parse JSON request body
app.use(express.json());

// ==========================================
// 3. Custom Middleware: Content-Type Validator
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
// 4. Route-Specific Middleware: Task ID Validator
// ==========================================
// Validates that the task ID parameter is a valid 24-character hexadecimal MongoDB ObjectId
const validateTaskId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Task ID must be a valid 24-character hexadecimal MongoDB ObjectId.'
    });
  }
  next();
};

// ==========================================
// 5. RESTful API Routes (CRUD Operations with Mongoose)
// ==========================================

// GET /tasks - Retrieve all tasks
app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id - Retrieve a single task by ID
app.get('/tasks/:id', validateTaskId, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.params.id} not found.`
      });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST /tasks - Create a new task
app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;
    const newTask = new Task({
      title,
      description,
      completed,
      priority
    });
    const savedTask = await newTask.save();
    res.setHeader('Location', `/tasks/${savedTask._id}`);
    res.status(201).json(savedTask);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - Update an existing task by ID
app.put('/tasks/:id', validateTaskId, async (req, res, next) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );
    if (!updatedTask) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.params.id} not found.`
      });
    }
    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - Delete a task by ID
app.delete('/tasks/:id', validateTaskId, async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.params.id} not found.`
      });
    }
    res.status(200).json({
      message: 'Task deleted successfully',
      task: deletedTask
    });
  } catch (err) {
    next(err);
  }
});

// GET /test-error - Demo route to test global error handling middleware
app.get('/test-error', (req, res, next) => {
  const err = new Error('Test error for global error handler demonstration');
  next(err);
});

// ==========================================
// 6. 404 Handler for Undefined Routes
// ==========================================
// Catches any requests to routes that were not defined above
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ==========================================
// 7. Global Error Handling Middleware
// ==========================================
// Intercepts Mongoose ValidationErrors and CastErrors to return structured JSON
app.use((err, req, res, next) => {
  console.error('[Global Error Handler Log]:', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: messages.join(' '),
      details: messages
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid format for field "${err.path}".`
    });
  }

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

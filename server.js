if (!globalThis.crypto) {
  try {
    globalThis.crypto = require('crypto').webcrypto || require('crypto');
  } catch (_) {}
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Task = require('./models/Task');
const User = require('./models/User');
const auth = require('./middleware/auth');
const {
  validateRegisterInput,
  validateLoginInput,
  validateTaskInput
} = require('./middleware/validate');
const {
  cache,
  allTasksKey,
  taskByIdKey,
  recordHit,
  recordMiss,
  getStats,
  invalidateUserTaskCaches,
  isCacheEnabled
} = require('./cache');

// Register event listeners & import EventEmitter (Practical 10)
require('./listeners');
const taskEvents = require('./events');

// AI Assistant Integration (Practical 13)
const { generateDescription } = require('./aiService');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task-manager-db';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_practical7_jwt_signing_key_2026_awdf';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// ==========================================
// 1. Database Connection & Demo User Seeder
// ==========================================
const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/task-manager-db';

const seedDemoUser = async () => {
  try {
    const demoEmail = 'student@charusat.edu.in';
    const existing = await User.findOne({ email: demoEmail });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Demo Student',
        email: demoEmail,
        password: hashedPassword
      });
      console.log(`Demo user seeded successfully (${demoEmail})`);
    }
  } catch (seedErr) {
    console.warn('Demo user seed note:', seedErr.message);
  }
};

const connectDB = async (retries = 5, delay = 2500) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log(`MongoDB connected successfully (${MONGO_URI.includes('mongodb+srv') ? 'Atlas' : MONGO_URI})`);
      await seedDemoUser();
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        console.log(`Retrying MongoDB connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (MONGO_URI !== LOCAL_MONGO_URI) {
        console.log('Attempting connection to local MongoDB fallback:', LOCAL_MONGO_URI);
        try {
          await mongoose.connect(LOCAL_MONGO_URI);
          console.log('Connected successfully to local MongoDB fallback.');
          await seedDemoUser();
        } catch (localErr) {
          console.error('Local MongoDB fallback connection error:', localErr.message);
        }
      }
    }
  }
};

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// ==========================================
// 2. Enable CORS (Cross-Origin Resource Sharing)
// ==========================================
app.use(cors());

// Health Check / Root Endpoint (Practical 12)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Task Manager API is running',
    version: '1.0.0'
  });
});

// ==========================================
// 3. Global Request Logging Middleware
// ==========================================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Parse JSON request body
app.use(express.json());

// ==========================================
// 4. Custom Middleware: Content-Type Validator
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
// 5. Route-Specific Middleware: Task ID Validator
// ==========================================
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
// 6. Authentication Routes (Practical 7)
// ==========================================

// Helper function to handle registration
const handleRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email address is already registered. Please log in or use another email.'
      });
    }

    // Step 3: Hash password with bcrypt before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name ? name.trim() : '',
      email: normalizedEmail,
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    // Step 4: Sign JWT
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email, name: savedUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        createdAt: savedUser.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to handle login
const handleLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Step 4: Verify user exists and compare password using bcrypt
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to handle /me profile retrieval
const handleGetMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found.'
      });
    }
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/register & /api/auth/register
app.post('/auth/register', validateRegisterInput, handleRegister);
app.post('/api/auth/register', validateRegisterInput, handleRegister);

// POST /auth/login & /api/auth/login
app.post('/auth/login', validateLoginInput, handleLogin);
app.post('/api/auth/login', validateLoginInput, handleLogin);

// GET /auth/me, /api/auth/me & /me (Protected by auth middleware)
app.get('/auth/me', auth, handleGetMe);
app.get('/api/auth/me', auth, handleGetMe);
app.get('/me', auth, handleGetMe);

// ==========================================
// 7. Protected RESTful Task Routes (Practical 7)
// ==========================================

// GET /tasks & /api/tasks - Retrieve all tasks for authenticated user
const handleGetTasks = async (req, res, next) => {
  try {
    const cacheKey = allTasksKey(req.user.id);

    if (isCacheEnabled()) {
      const cached = cache.get(cacheKey);
      if (cached) {
        recordHit('allTasks');
        return res.status(200).json(cached);
      }
      recordMiss('allTasks');
    }

    // Return user's tasks or unassigned legacy tasks
    const tasks = await Task.find({
      $or: [
        { user: req.user.id },
        { user: { $exists: false } },
        { user: null }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    if (isCacheEnabled()) {
      cache.set(cacheKey, tasks);
    }

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

app.get('/tasks', auth, handleGetTasks);
app.get('/api/tasks', auth, handleGetTasks);

// GET /tasks/:id & /api/tasks/:id - Retrieve single task by ID
const handleGetTaskById = async (req, res, next) => {
  try {
    const cacheKey = taskByIdKey(req.user.id, req.params.id);

    if (isCacheEnabled()) {
      const cached = cache.get(cacheKey);
      if (cached) {
        recordHit('taskById');
        return res.status(200).json(cached);
      }
      recordMiss('taskById');
    }

    const task = await Task.findById(req.params.id).lean();
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.params.id} not found.`
      });
    }

    // Enforce task ownership if assigned to a user
    if (task.user && task.user.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You do not have permission to view this task.'
      });
    }

    if (isCacheEnabled()) {
      cache.set(cacheKey, task);
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
};

app.get('/tasks/:id', auth, validateTaskId, handleGetTaskById);
app.get('/api/tasks/:id', auth, validateTaskId, handleGetTaskById);

// POST /tasks & /api/tasks - Create a new task (Protected + Input Validated)
const handleCreateTask = async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;
    const newTask = new Task({
      title,
      description,
      completed,
      priority,
      user: req.user.id
    });
    const savedTask = await newTask.save();
    invalidateUserTaskCaches(req.user.id);
    console.log(`[API] Response sent at ${new Date().toISOString()}`);
    res.setHeader('Location', `/tasks/${savedTask._id}`);
    res.status(201).json(savedTask);

    // Emit 'task-created' event asynchronously after response is sent (Practical 10)
    taskEvents.emit('task-created', savedTask);
  } catch (err) {
    next(err);
  }
};

app.post('/tasks', auth, validateTaskInput, handleCreateTask);
app.post('/api/tasks', auth, validateTaskInput, handleCreateTask);

// PUT /tasks/:id & /api/tasks/:id - Update an existing task by ID
const handleUpdateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.params.id} not found.`
      });
    }

    // Enforce task ownership
    if (task.user && task.user.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You do not have permission to modify this task.'
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    invalidateUserTaskCaches(req.user.id, req.params.id);
    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
};

app.put('/tasks/:id', auth, validateTaskId, validateTaskInput, handleUpdateTask);
app.put('/api/tasks/:id', auth, validateTaskId, validateTaskInput, handleUpdateTask);

// DELETE /tasks/:id & /api/tasks/:id - Delete a task by ID
const handleDeleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with ID ${req.params.id} not found.`
      });
    }

    // Enforce task ownership
    if (task.user && task.user.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You do not have permission to delete this task.'
      });
    }

    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    invalidateUserTaskCaches(req.user.id, req.params.id);
    console.log(`[API] Delete response sent at ${new Date().toISOString()}`);
    res.status(200).json({
      message: 'Task deleted successfully',
      task: deletedTask
    });

    // Emit 'task-deleted' event asynchronously after response is sent (Practical 10)
    taskEvents.emit('task-deleted', deletedTask);
  } catch (err) {
    next(err);
  }
};

app.delete('/tasks/:id', auth, validateTaskId, handleDeleteTask);
app.delete('/api/tasks/:id', auth, validateTaskId, handleDeleteTask);

// GET /debug/cache-stats - Cache hit/miss counters (Practical 9)
app.get('/debug/cache-stats', (req, res) => {
  res.status(200).json({
    cacheEnabled: isCacheEnabled(),
    ...getStats()
  });
});
app.get('/api/debug/cache-stats', (req, res) => {
  res.status(200).json({
    cacheEnabled: isCacheEnabled(),
    ...getStats()
  });
});

// GET /test-error - Demo route to test global error handling middleware
app.get('/test-error', (req, res, next) => {
  const err = new Error('Test error for global error handler demonstration');
  next(err);
});

// ==========================================
// 8. AI Assistant Route (Practical 13)
// ==========================================
const handleGenerateDescription = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Field \"title\" is required to generate a description."
      });
    }

    const clientIdentifier = (req.user && req.user.id) || req.ip || "anonymous";
    const result = await generateDescription(title, clientIdentifier);
    res.status(200).json(result);
  } catch (err) {
    console.error("[AI Endpoint Error]:", err.message);
    res.status(200).json({
      description: "Review requirements and execute deliverables for: " + (req.body?.title || ""),
      fallback: true,
      source: "fallback",
      message: "AI service temporarily unavailable."
    });
  }
};

app.post('/api/ai/generate-description', handleGenerateDescription);
app.post('/ai/generate-description', handleGenerateDescription);

// ==========================================
// 9. 404 Handler for Undefined Routes
// ==========================================
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ==========================================
// 9. Global Error Handling Middleware
// ==========================================
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

  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Conflict Error',
      message: 'Duplicate key error: A record with this unique field already exists.'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid format for field "${err.path}".`
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token error.'
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

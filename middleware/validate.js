/**
 * Input Validation Middleware
 * Enforces server-side request sanitization and validation before controllers execute.
 */

// Email regex pattern
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Validates registration payload (email, password, name)
 */
const validateRegisterInput = (req, res, next) => {
  const { email, password, name } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (name !== undefined && typeof name !== 'string') {
    errors.push('Name must be a string.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(' '),
      details: errors
    });
  }

  next();
};

/**
 * Validates login payload (email, password)
 */
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(' '),
      details: errors
    });
  }

  next();
};

/**
 * Validates task payload for creation (POST) and update (PUT)
 */
const validateTaskInput = (req, res, next) => {
  const { title, priority, completed, description } = req.body || {};
  const errors = [];

  // For POST, title is required. For PUT, title is validated if provided.
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || !title.trim()) {
      errors.push('Field "title" is required and cannot be empty.');
    }
  } else if (req.method === 'PUT' && title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      errors.push('Field "title" cannot be empty.');
    }
  }

  // Priority validation
  if (priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      errors.push('Priority must be one of: low, medium, high.');
    }
  }

  // Completed validation
  if (completed !== undefined && typeof completed !== 'boolean') {
    errors.push('Completed must be a boolean value (true or false).');
  }

  // Description validation
  if (description !== undefined && typeof description !== 'string') {
    errors.push('Description must be a string.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(' '),
      details: errors
    });
  }

  next();
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateTaskInput
};

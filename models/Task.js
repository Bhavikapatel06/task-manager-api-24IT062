const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Field "title" is required.'],
    validate: {
      validator: function (v) {
        return typeof v === 'string' && v.trim().length > 0;
      },
      message: 'Field "title" cannot be empty.'
    }
  },
  description: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be one of: low, medium, high'
    },
    default: 'medium'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to automatically trim whitespace from title
taskSchema.pre('save', function () {
  if (this.title) {
    this.title = this.title.trim();
  }
});

module.exports = mongoose.model('Task', taskSchema);

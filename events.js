const EventEmitter = require('events');

// Custom EventEmitter class for task management events (Practical 10)
class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents();

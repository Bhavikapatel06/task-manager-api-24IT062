const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60 });

const stats = {
  allTasks: { hits: 0, misses: 0 },
  taskById: { hits: 0, misses: 0 }
};

function allTasksKey(userId) {
  return `all_tasks:${userId}`;
}

function taskByIdKey(userId, taskId) {
  return `task:${userId}:${taskId}`;
}

function recordHit(scope) {
  stats[scope].hits += 1;
}

function recordMiss(scope) {
  stats[scope].misses += 1;
}

function getStats() {
  return {
    allTasks: { ...stats.allTasks },
    taskById: { ...stats.taskById },
    cachedKeyCount: cache.keys().length,
    stdTTLSeconds: 60
  };
}

function invalidateUserTaskCaches(userId, taskId = null) {
  cache.del(allTasksKey(userId));
  if (taskId) {
    cache.del(taskByIdKey(userId, taskId));
  }
}

function isCacheEnabled() {
  return process.env.CACHE_ENABLED !== 'false';
}

module.exports = {
  cache,
  allTasksKey,
  taskByIdKey,
  recordHit,
  recordMiss,
  getStats,
  invalidateUserTaskCaches,
  isCacheEnabled
};

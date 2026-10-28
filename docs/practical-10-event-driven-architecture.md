# Practical 10: Asynchronous Processing with Event-Driven Architecture

**Course:** ITUE301 — Advanced Web Development Frameworks  
**CO/PO:** CO4 / PO3, PO5  

---

## 1. Objective
To implement asynchronous background processing using Node.js native `EventEmitter` without external dependencies, decoupling side-effect tasks (notifications, audit logging) from the critical API request-response cycle.

---

## 2. Architecture & Flow Diagram

```text
POST /tasks (or DELETE /tasks/:id) Request
             │
             ▼
    Save/Delete Task in MongoDB
             │
             ▼
  Send HTTP Response Immediately ──► Client receives 201 Created / 200 OK
             │
             ▼
  emit('task-created' / 'task-deleted', task)
             │
             ▼ (handled asynchronously via Node.js Event Loop)
Notification Listener (listeners.js)
  ├── Logs event reception timestamp
  ├── Simulates async I/O / Notification (setTimeout 2s)
  └── Logs completion: title, timestamp, assigned user
```

---

## 3. Implementation Details

### A. Dedicated Event Module (`events.js`)
Extends Node's built-in `EventEmitter` and exports a singleton instance:
```javascript
const EventEmitter = require('events');

class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents();
```

### B. Event Listeners (`listeners.js`)
Registers handlers for background processing and error safety:
```javascript
const taskEvents = require('./events');

// Error Listener (Supplementary)
taskEvents.on('error', (err) => {
  console.error(`[Notification Error] Handled error in background listener at ${new Date().toISOString()}: ${err.message}`);
});

// task-created Listener (with simulated 2s background job)
taskEvents.on('task-created', (task) => {
  try {
    const assignedUser = task.user ? (task.user._id || task.user) : 'Unassigned';
    console.log(`[Notification Listener] Event 'task-created' received for "${task.title}" at ${new Date().toISOString()}`);

    if (task.title && task.title.toLowerCase().includes('simulate-error')) {
      throw new Error(`Simulated notification failure for task: "${task.title}"`);
    }

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
    taskEvents.emit('error', err);
  }
});

// task-deleted Listener (Supplementary)
taskEvents.on('task-deleted', (task) => {
  try {
    const assignedUser = task.user ? (task.user._id || task.user) : 'Unassigned';
    console.log(`[Notification Listener] Event 'task-deleted' received for "${task.title}" at ${new Date().toISOString()}`);

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
```

### C. Server Integration (`server.js`)
- Required `listeners.js` and `events.js` on startup.
- In `POST /tasks`, sends `res.status(201).json(savedTask)` immediately, then emits `taskEvents.emit('task-created', savedTask)`.
- In `DELETE /tasks/:id`, sends `res.status(200).json(...)` immediately, then emits `taskEvents.emit('task-deleted', deletedTask)`.

---

## 4. Console Evidence: Synchronous vs. Asynchronous Execution

When running `POST /tasks`:

```text
POST /tasks - 2026-10-09T04:39:55.130Z
[API] Response sent at 2026-10-09T04:39:55.143Z
[Notification Listener] Event 'task-created' received for "Practical 10 Async Task" at 2026-10-09T04:39:55.145Z
[CLIENT] POST returned status 201 in 23ms

... [2 seconds pass while client is already doing other work] ...

[Notification Background Service] Completed processing notification for task "Practical 10 Async Task" (User: 6ab94008e2ce0785c00f6679) at 2026-10-09T04:39:57.156Z
```

### Analysis of Timestamps:
- **API Response Sent:** `2026-10-09T04:39:55.143Z` (Client receives 201 Created in ~23ms)
- **Background Listener Completed:** `2026-10-09T04:39:57.156Z` (~2013ms later)
- **Proof:** The client request completes instantaneously; slow notification work is scheduled asynchronously on the event loop and finishes without blocking the response.

---

## 5. Answers to Key Analysis Questions (Viva Preparation)

### Q1: Why does emitting an event not block the API response, even though both run on the same Node.js process?
**Answer:** In Node.js, `EventEmitter` invokes listeners synchronously by default unless deferred, but by placing `taskEvents.emit()` after `res.status(201).json()` (or by using asynchronous primitives like timers/I/O inside the listener), the HTTP response headers and body are flushed to the client socket immediately. The slow notification logic runs inside an asynchronous callback (`setTimeout`/Promise) which is pushed to Node's Event Loop timers/macrotask queue, allowing the main HTTP cycle to terminate first.

### Q2: What would happen to API response time if notification logic were placed directly inside the POST route instead of in an event handler?
**Answer:** The API response time would increase by the entire execution duration of the notification logic (e.g., +2000ms). If an email service or third-party SMS provider took 2 seconds to respond, the client would hang waiting for 2000ms+ before receiving the `201 Created` status code, degrading user experience and API throughput.

### Q3: Why is EventEmitter a reasonable choice for this scale of application, but not for a production system handling millions of events per day?
**Answer:**
- **Why reasonable here:** It has zero external dependencies, minimal memory footprint, and runs in-process with negligible overhead.
- **Why not suitable for large-scale production:**
  1. **In-memory only:** If the Node.js server crashes or restarts, all pending in-memory events in the event loop are lost forever (no persistence).
  2. **Single process limitation:** Cannot distribute event workloads across multiple server instances or worker nodes.
  3. **No backpressure or retry mechanism:** Cannot handle retries, dead-letter queues, or rate limiting like production message brokers (e.g., RabbitMQ, Redis BullMQ, Kafka, AWS SQS).

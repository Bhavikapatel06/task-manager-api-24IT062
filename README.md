# Practical 4: Task Management RESTful API
 
**Technology Stack**: Node.js (v18+), Express.js  

A RESTful backend server built with Node.js and Express for a Task Management System featuring complete CRUD endpoints, structured JSON responses, custom middleware pipeline (logging, header validation, ID validation), undefined route handling (404), and centralized global error handling (500).

---

## 📌 Architecture & Middleware Pipeline

```text
Client (Postman / Thunder Client / Browser)
                     │
                     ▼
       ┌───────────────────────────┐
       │  1. Logging Middleware    │  → Logs [METHOD] [URL] - [Timestamp]
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │  2. express.json()        │  → Parses JSON request payloads
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │  3. JSON Header Validator │  → Rejects POST/PUT missing Content-Type: application/json (400)
       └─────────────┬─────────────┘
                     │
                     ▼
               Express Router
       ├── GET    /tasks         → getAllTasks (200)
       ├── GET    /tasks/:id     → getTaskById (200 / 400 / 404) [via validateTaskId middleware]
       ├── POST   /tasks         → createTask  (201 / 400)
       ├── PUT    /tasks/:id     → updateTask  (200 / 400 / 404) [via validateTaskId middleware]
       ├── DELETE /tasks/:id     → deleteTask  (200 / 400 / 404) [via validateTaskId middleware]
       └── GET    /test-error    → Triggers deliberate error for testing
                     │
                     ▼
       ┌───────────────────────────┐
       │  4. Undefined Route (404) │  → Returns structured JSON for unmapped paths (404)
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ 5. Global Error Handler   │  → Catches next(err), logs stack server-side, returns JSON (500)
       └───────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Installation & Running

1. **Clone or navigate to project directory**:
   ```bash
   cd task-manager-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   # Production / Standard start
   npm start

   # Development mode (auto-reload on Node 18+)
   npm run dev
   ```
   The server will run on `http://localhost:5000`.

---

## 📑 RESTful API Reference

All requests and responses use `Content-Type: application/json`.

### Endpoints Overview

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks | `200 OK` |
| `GET` | `/tasks/:id` | Retrieve single task by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/tasks` | Create a new task | `201 Created`, `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update an existing task | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/tasks/:id` | Delete a task by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `GET` | `/test-error` | Test global error handling middleware | `500 Internal Server Error` |

---

### Request & Response Examples

#### 1. GET `/tasks`
* **Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "title": "Learn Express Middleware",
      "description": "Understand request lifecycle and next() function execution flow",
      "completed": true
    },
    {
      "id": 2,
      "title": "Build RESTful API",
      "description": "Implement full CRUD routes with Express and custom middleware pipeline",
      "completed": false
    }
  ]
  ```

#### 2. POST `/tasks`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "title": "Setup Postman Collection",
    "description": "Create test requests for Practical 4 endpoints",
    "completed": false
  }
  ```
* **Response (`201 Created`)**:
  ```json
  {
    "id": 3,
    "title": "Setup Postman Collection",
    "description": "Create test requests for Practical 4 endpoints",
    "completed": false
  }
  ```

#### 3. PUT `/tasks/:id`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "completed": true
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "id": 3,
    "title": "Setup Postman Collection",
    "description": "Create test requests for Practical 4 endpoints",
    "completed": true
  }
  ```

#### 4. DELETE `/tasks/:id`
* **Response (`200 OK`)**:
  ```json
  {
    "message": "Task deleted successfully",
    "task": {
      "id": 3,
      "title": "Setup Postman Collection",
      "description": "Create test requests for Practical 4 endpoints",
      "completed": true
    }
  }
  ```

---

### Testing Commands

#### 1. Windows PowerShell (`Invoke-RestMethod`)
*(In Windows PowerShell, use `Invoke-RestMethod` or `curl.exe` instead of `curl`)*

```powershell
# 1. Get all tasks
Invoke-RestMethod -Uri http://localhost:5000/tasks

# 2. Create a new task
Invoke-RestMethod -Uri http://localhost:5000/tasks -Method Post -ContentType "application/json" -Body '{"title": "Study Express Pipeline", "description": "Review next() and error handling"}'

# 3. Get task by ID
Invoke-RestMethod -Uri http://localhost:5000/tasks/1

# 4. Update task
Invoke-RestMethod -Uri http://localhost:5000/tasks/1 -Method Put -ContentType "application/json" -Body '{"completed": true}'

# 5. Delete task
Invoke-RestMethod -Uri http://localhost:5000/tasks/1 -Method Delete

# 6. Test Header Validation (Missing Content-Type header on POST)
Invoke-RestMethod -Uri http://localhost:5000/tasks -Method Post -Body '{"title": "Fail Test"}'

# 7. Test Route-Specific ID Validation (Invalid non-numeric ID)
Invoke-RestMethod -Uri http://localhost:5000/tasks/invalid-id

# 8. Test 404 Route Handler
Invoke-RestMethod -Uri http://localhost:5000/non-existent-route

# 9. Test 500 Global Error Handler
Invoke-RestMethod -Uri http://localhost:5000/test-error
```

#### 2. Standard cURL / Git Bash / CMD (`curl.exe`)

```bash
# 1. Get all tasks
curl.exe -X GET http://localhost:5000/tasks

# 2. Create a new task
curl.exe -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Study Express Pipeline\", \"description\": \"Review next() and error handling\"}"

# 3. Get task by ID
curl.exe -X GET http://localhost:5000/tasks/1

# 4. Update task
curl.exe -X PUT http://localhost:5000/tasks/1 \
  -H "Content-Type: application/json" \
  -d "{\"completed\": true}"

# 5. Delete task
curl.exe -X DELETE http://localhost:5000/tasks/1

# 6. Test Header Validation (Missing Content-Type header on POST)
curl.exe -X POST http://localhost:5000/tasks -d "{\"title\": \"Fail Test\"}"

# 7. Test Route-Specific ID Validation (Invalid non-numeric ID)
curl.exe -X GET http://localhost:5000/tasks/invalid-id

# 8. Test 404 Route Handler
curl.exe -X GET http://localhost:5000/non-existent-route

# 9. Test 500 Global Error Handler
curl.exe -X GET http://localhost:5000/test-error
```

---

## 🧠 Key Questions & Viva Analysis Answers

### Q1: Why must the error handling middleware be defined last in the middleware chain?
> **Answer**: Express processes middleware sequentially in the exact order they are declared using `app.use()`. Error-handling middleware functions are distinguished by accepting **4 parameters**: `(err, req, res, next)`. When an error is passed via `next(err)` inside any route or middleware, Express immediately halts standard middleware execution and jumps to the next error-handling middleware. If the error handler were placed before the routes, it would be registered prior to any error occurring and would fail to intercept errors thrown by routes downstream. Therefore, it **must be placed last** (after all route definitions and normal middleware) to serve as a catch-all for any uncaught errors.

---

### Q2: What is the difference between `app.use()` and a route-specific middleware?
> **Answer**:
> * **`app.use()` (Global / Mount-point Middleware)**: Applies middleware globally across **all** HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, etc.) for every incoming request (or matching path prefixes). Examples include request loggers, body parsers (`express.json()`), and CORS headers.
> * **Route-Specific Middleware**: Passed directly into a specific route endpoint definition (e.g., `app.get('/tasks/:id', validateTaskId, handler)`). It executes **only** when a request matches both the specific HTTP method and the exact URL path pattern. It is ideal for targeted actions such as validating route parameters (`:id`), authenticating protected routes, or authorization checks.

---

### Q3: Why is it considered bad practice to send raw error stack traces to the client?
> **Answer**:
> 1. **Security Vulnerability (Information Leakage)**: Raw error stack traces expose critical server infrastructure details, internal directory structures, file system paths, library versions, database connection parameters, and database query logic. Malicious actors can utilize this information to exploit known vulnerabilities.
> 2. **Poor User Experience**: Stack traces contain verbose developer debugging output that is confusing and unhelpful to end users. Users should receive clear, user-friendly, structured JSON responses with appropriate HTTP status codes (e.g., `{ "error": "Something went wrong" }`).
> 3. **Logging & Monitoring Standard**: Stack traces should be logged server-side (to console/log files or monitoring systems like Datadog/Sentry) for developers, while hiding internal implementation details from public clients.

---

## 📁 Repository Structure

```text
task-manager-api/
├── package.json        # Dependencies & scripts
├── server.js          # Express app, middleware pipeline & CRUD routes
├── .gitignore          # Ignores node_modules and log files
└── README.md           # Documentation & Viva Q&A
```

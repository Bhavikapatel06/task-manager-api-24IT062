# Practical 5: MongoDB Integration and Schema Design with Mongoose

**Technology Stack**: Node.js (v18+), Express.js, MongoDB, Mongoose ODM, dotenv

A RESTful Task Management API extended from Practical 4 to integrate MongoDB via Mongoose. Features schema validation, pre-save hooks for data sanitization, full CRUD database operations, custom middleware, and structured JSON error responses.

---

## 📌 Architecture & Data Flow

```text
Express App
    │
    ▼
Mongoose ODM (Schema Validation & Model Hooks)
    │
    ▼
MongoDB Database
    └── tasks collection
        { _id, title, description, completed, priority, createdAt, __v }
```

### Request Processing & Middleware Pipeline

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
       ├── GET    /tasks         → Task.find() (200)
       ├── GET    /tasks/:id     → Task.findById() (200 / 400 / 404) [via validateTaskId middleware]
       ├── POST   /tasks         → Task.create() / save() (201 / 400) [triggers pre-save hook]
       ├── PUT    /tasks/:id     → Task.findByIdAndUpdate() (200 / 400 / 404) [runValidators: true]
       ├── DELETE /tasks/:id     → Task.findByIdAndDelete() (200 / 400 / 404)
       └── GET    /test-error    → Triggers deliberate error for testing
                     │
                     ▼
       ┌───────────────────────────┐
       │  4. Undefined Route (404) │  → Returns structured JSON for unmapped paths (404)
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ 5. Global Error Handler   │  → Intercepts Mongoose ValidationError & CastError (400 / 500)
       └───────────────────────────┘
```

---

## 🛠️ Environment & Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task-manager-db
```

> **Note**: `.env` is excluded from git via `.gitignore` to protect environment variables.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas instance)

### Installation & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start MongoDB**:
   Ensure local MongoDB service is running on `mongodb://127.0.0.1:27017` (or provide an Atlas URI in `.env`).

3. **Start the Express server**:
   ```bash
   # Development mode (auto-reload)
   npm run dev

   # Production mode
   npm start
   ```
   The server will connect to MongoDB and run on `http://localhost:5000`.

---

## 📑 Mongoose Task Schema (`models/Task.js`)

| Field | Type | Options / Constraints |
| :--- | :--- | :--- |
| `title` | `String` | **Required**, non-empty string validation, auto-trimmed via `pre('save')` hook |
| `description` | `String` | Optional, defaults to `""` |
| `completed` | `Boolean` | Defaults to `false` |
| `priority` | `String` | Enum restricted to `['low', 'medium', 'high']`, defaults to `'medium'` |
| `createdAt` | `Date` | Defaults to `Date.now` |

---

## 📑 RESTful API Reference

All requests and responses use `Content-Type: application/json`.

### Endpoints Overview

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks sorted by `createdAt` descending | `200 OK` |
| `GET` | `/tasks/:id` | Retrieve single task by 24-character ObjectId | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/tasks` | Create a new task in MongoDB | `201 Created`, `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update an existing task in MongoDB | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/tasks/:id` | Delete a task by ObjectId | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `GET` | `/test-error` | Test global error handling middleware | `500 Internal Server Error` |

---

### Request & Response Examples

#### 1. GET `/tasks`
* **Response (`200 OK`)**:
  ```json
  [
    {
      "_id": "6a7772598920e509f34d92f8",
      "title": "Learn Mongoose Schema Design",
      "description": "Practical 5 tasks",
      "completed": false,
      "priority": "high",
      "createdAt": "2026-08-08T18:15:53.433Z",
      "__v": 0
    }
  ]
  ```

#### 2. POST `/tasks`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "title": "  Learn Mongoose Schema Design   ",
    "description": "Practical 5 tasks",
    "priority": "high"
  }
  ```
* **Response (`201 Created`)**:
  ```json
  {
    "_id": "6a7772598920e509f34d92f8",
    "title": "Learn Mongoose Schema Design",
    "description": "Practical 5 tasks",
    "completed": false,
    "priority": "high",
    "createdAt": "2026-08-08T18:15:53.433Z",
    "__v": 0
  }
  ```
  *(Note: Leading and trailing whitespace in `title` is automatically trimmed by the schema pre-save hook)*

#### 3. PUT `/tasks/:id`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "completed": true,
    "priority": "medium"
  }
  ```
* **Response (`200 OK`)**:
  ```json
  {
    "_id": "6a7772598920e509f34d92f8",
    "title": "Learn Mongoose Schema Design",
    "description": "Practical 5 tasks",
    "completed": true,
    "priority": "medium",
    "createdAt": "2026-08-08T18:15:53.433Z",
    "__v": 0
  }
  ```

#### 4. DELETE `/tasks/:id`
* **Response (`200 OK`)**:
  ```json
  {
    "message": "Task deleted successfully",
    "task": {
      "_id": "6a7772598920e509f34d92f8",
      "title": "Learn Mongoose Schema Design",
      "description": "Practical 5 tasks",
      "completed": true,
      "priority": "medium",
      "createdAt": "2026-08-08T18:15:53.433Z",
      "__v": 0
    }
  }
  ```

#### 5. Validation Error Example (`400 Bad Request`)
* **Request Body (Invalid priority)**:
  ```json
  {
    "title": "Invalid Priority Task",
    "priority": "urgent"
  }
  ```
* **Response (`400 Bad Request`)**:
  ```json
  {
    "error": "Validation Error",
    "message": "Priority must be one of: low, medium, high",
    "details": [
      "Priority must be one of: low, medium, high"
    ]
  }
  ```

---

## 🧠 Key Questions & Theory Analysis

### Q1: What is the purpose of a schema in a NoSQL database like MongoDB, given that MongoDB itself is schema-less?
> **Answer**:  
> While MongoDB at the storage engine level is schemaless (allowing documents within a collection to have flexible and varying fields), building enterprise applications requires **predictable data structures and data integrity**.  
> Mongoose provides an ODM (Object Data Modeling) schema layer on top of MongoDB that enforces:
> 1. **Data Consistency**: Ensures documents conform to standard types (`String`, `Date`, `Boolean`, etc.) across all operations.
> 2. **Business Rule Enforcement**: Defines required attributes, enum restrictions, default values, and custom validators before documents touch the database.
> 3. **Application-Level Features**: Enables pre/post middleware hooks, virtual fields, and model helper methods that simplify application code.

---

### Q2: Why is it important to define required fields and default values at the schema level rather than relying on frontend validation alone?
> **Answer**:  
> Relying solely on client-side/frontend validation is a severe security and architectural anti-pattern for several reasons:
> 1. **Bypassing Frontend**: Malicious users, external API clients, cURL scripts, or Postman requests can easily bypass web frontend validation and send arbitrary payloads directly to backend endpoints.
> 2. **Single Source of Truth**: Schema-level validation enforces data rules regardless of which client (web, mobile app, microservice, background worker) interacts with the database.
> 3. **Data Pollution Protection**: Default values guaranteed at the schema level ensure essential fields (such as `completed: false` or `createdAt: Date.now`) are reliably populated even when clients omit them.

---

### Q3: What happens internally when a document fails Mongoose validation — where is the request stopped?
> **Answer**:  
> Mongoose performs schema validation **completely inside the Node.js runtime process before sending any write command to the MongoDB server**.
> 1. When `doc.save()` or `findByIdAndUpdate(..., { runValidators: true })` is called, Mongoose evaluates document fields against defined schema validators and pre-save hooks.
> 2. If any validation rule fails, Mongoose immediately aborts the operation and constructs a `ValidationError` object containing field-level error messages. **No network request or write operation is transmitted to the MongoDB database engine.**
> 3. The rejected Promise throws an exception caught inside the endpoint's `try/catch` block, which forwards `err` via `next(err)` to Express's global error handler to return a formatted `400 Bad Request` JSON response to the client.

---

## 📁 Repository Structure

```text
task-manager-api/
├── models/
│   └── Task.js         # Mongoose schema, validation rules & pre-save hook
├── .env                # Local environment variables (DB URI, Port)
├── .env.example        # Environment variables template
├── .gitignore          # Excludes node_modules and .env
├── package.json        # Dependencies (express, mongoose, dotenv)
├── server.js          # Express app, Mongoose connection & REST API routes
├── MATURITY.md         # Richardson Maturity Model Evaluation Report
└── README.md           # Documentation & Practical 5 Viva Q&A
```

# Practical 6: Full Stack Integration React + Node + MongoDB
<!-- 
**CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY**  
**FACULTY OF TECHNOLOGY AND ENGINEERING**  
**B. TECH (IT/CE/CSE/AIML)**  
**ADVANCED WEB DEVELOPMENT FRAMEWORKS (ITUE301)**  
**Course Outcomes / Program Outcomes**: CO1, CO2 / PO3, PO5 
-->

---

## 📌 Overview & Objective

To wire the **React frontend** to the **Node.js/Express/MongoDB backend** into a fully functional, end-to-end full-stack MERN task management application with robust state synchronization, CORS support, optimistic UI updates, confirmation dialogs, and toast notifications.

---

## 🏗️ Architecture & Full-Stack Data Flow

```text
React Frontend (Vite @ localhost:5173)
        │
        │  fetch() JSON API Calls (CORS enabled)
        ▼
Express Backend (Node.js @ localhost:5000)
        │
        │  Mongoose ODM (Validation & Hooks)
        ▼
MongoDB Database (localhost:27017/task-manager-db)
        └── tasks collection
```

### End-to-End Operation Flow:
1. **Create**: User submits UI form → Optimistic local UI insert → `POST /tasks` with JSON payload → MongoDB saves document → Server returns 201 Created → Local state confirmed.
2. **Read**: React component mounts (`useEffect`) → `GET /tasks` → MongoDB queries collection (`Task.find()`) → UI renders tasks with metrics & filters.
3. **Update**: User edits task or clicks completion toggle → `PUT /tasks/:id` → MongoDB updates document (`findByIdAndUpdate`) → State synchronized & success toast displayed.
4. **Delete**: User clicks delete → Interactive confirmation modal displayed → `DELETE /tasks/:id` → MongoDB removes record (`findByIdAndDelete`) → UI removes item & triggers notification.

---

## 🚀 Key Features Implemented

1. **CORS Configuration**:
   - `cors` middleware enabled on the Express server (`app.use(cors())`) allowing cross-origin requests from the React dev server (`localhost:5173` to `localhost:5000`).
2. **Centralized API Client (`client/src/api.js`)**:
   - Modular helper functions (`getTasks`, `getTaskById`, `createTask`, `updateTask`, `deleteTask`) consuming backend REST endpoints.
3. **Optimistic UI Updates**:
   - Immediate feedback on task creation with instant UI insertion, followed by asynchronous server confirmation and rollback on network failure.
4. **Interactive Confirmation Dialog (`ConfirmModal`)**:
   - Prevents accidental deletions by requiring explicit user confirmation before executing `DELETE /tasks/:id`.
5. **Toast Notification System (`Toast`)**:
   - Real-time feedback alerts for successful creation, editing, deletion, completion toggling, or backend connection errors.
6. **Live Dashboard Metrics (`StatsCard`)**:
   - Real-time aggregation of Total Tasks, In Progress, Completed, and High Priority tasks.
7. **Task Search & Filtering (`TaskList`)**:
   - Instant search by title/description keywords and filtering by status (All / Pending / Completed).

---

## 📁 Repository Structure

```text
task-manager-api/
├── client/                     # React Frontend (Vite + React 18)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx # Deletion confirmation dialog
│   │   │   ├── Navbar.jsx       # Header with live backend connection badge
│   │   │   ├── StatsCard.jsx    # Dashboard metric overview
│   │   │   ├── TaskForm.jsx     # Create & Edit form with priority selector
│   │   │   ├── TaskItem.jsx     # Individual task card with actions
│   │   │   ├── TaskList.jsx     # Filterable and searchable task list
│   │   │   └── Toast.jsx        # Notification alert system
│   │   ├── api.js               # Central backend API client
│   │   ├── App.jsx              # Root full-stack state container
│   │   ├── index.css            # Modern glassmorphic theme styling
│   │   └── main.jsx             # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── models/
│   └── Task.js                 # Mongoose Schema with validation & pre-save hook
├── .env.example                # Sample environment variables
├── package.json                # Root package configuration
├── README.md                   # Full documentation and guide
└── server.js                   # Express server with CORS & REST routes
```

---

## 🛠️ Installation & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task-manager-db
```

### 3. Install Dependencies
In the root directory, install backend and frontend dependencies:
```bash
# Install backend dependencies (express, mongoose, cors, dotenv)
npm install

# Install frontend dependencies
npm run client:install
```

---

## 🏃 Running the Application

For full-stack execution, run the backend and frontend simultaneously in separate terminals:

### Terminal 1: Backend Server (Port 5000)
```bash
npm run dev
# Server running on http://localhost:5000
```

### Terminal 2: Frontend Dev Server (Port 5173)
```bash
npm run client
# React app available at http://localhost:5173
```

---

## 📡 REST API Specification

| Method | Endpoint | Description | Request Body | Response Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks sorted newest first | None | `200 OK` |
| `GET` | `/tasks/:id` | Retrieve single task by MongoDB ObjectId | None | `200 OK` / `404 Not Found` |
| `POST` | `/tasks` | Create a new task | `{ title, description?, priority?, completed? }` | `201 Created` / `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update task details or toggle completion | `{ title?, description?, priority?, completed? }` | `200 OK` / `404 Not Found` |
| `DELETE` | `/tasks/:id` | Delete task by ID | None | `200 OK` / `404 Not Found` |

---

## ❓ Key Questions & Conceptual Analysis

### 1. What changes are required on the backend (CORS) to allow the React dev server to call the Express API?
Browsers enforce the **Same-Origin Policy** (SOP) by default, blocking web apps on one origin (e.g. `http://localhost:5173`) from making fetch requests to another origin (e.g. `http://localhost:5000`). To allow communication, Express must attach CORS headers (such as `Access-Control-Allow-Origin: *` or specific origin) to HTTP responses. This is configured via the `cors` package:
```javascript
const cors = require('cors');
app.use(cors());
```

### 2. Why should the UI re-fetch or update local state after a successful POST/PUT/DELETE rather than assuming success silently?
- **Data Integrity**: MongoDB generates primary keys (`_id`), server timestamps (`createdAt`), default values, and schema sanitization (such as `.trim()` hooks). Local state must reflect the true database record.
- **Error Recovery**: If a server-side validation error or network drop occurs, assuming success leads to ghost UI states that vanish upon browser refresh.

### 3. What is the risk of not handling errors on write operations (POST/PUT/DELETE) the same way as read operations (GET)?
Without write error handling, users receive false confidence that their data was saved. If a database disconnect or validation failure occurs during a POST or PUT, the user might close the browser and permanently lose unsaved work. Proper write error handling catches exceptions, rolls back optimistic UI changes, and provides actionable error notifications to the user.

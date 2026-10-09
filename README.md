# Task Manager API — ITUE301 (Practicals 4–9)

## ITUE301 - Advanced Web Development Frameworks

A Task Management application with JWT authentication, bcrypt password hashing, Express middleware, server-side input validation, and in-memory caching (Practical 9).

## Features

* User registration and login
* Password hashing using bcryptjs
* JWT authentication with 1 hour expiry
* Protected task routes
* Server-side input validation
* `/auth/me` endpoint
* User-specific tasks
* 401 handling for invalid or expired tokens
* Logout functionality
* **Practical 9:** `node-cache` on `GET /tasks` and `GET /tasks/:id` (60s TTL), cache invalidation on POST/PUT/DELETE, debug stats at `/debug/cache-stats`

## Technologies

* Node.js
* Express.js
* MongoDB
* Mongoose
* React
* JWT (`jsonwebtoken`)
* bcryptjs
* `node-cache`
* Postman

## Installation

Install the backend dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
npm run client:install
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
# Optional: set to false to compare uncached response times (Practical 9)
CACHE_ENABLED=true
```

Do not upload `.env` to GitHub.

Add this to `.gitignore`:

```text
.env
node_modules/
```

## Run the Project

Start the backend:

```bash
npm run dev
```

Start the frontend:

```bash
npm run client
```

Backend:

```text
http://localhost:5000
```

Frontend:

```text
http://localhost:5173
```

## API Endpoints

### Authentication

| Method | Endpoint         | Purpose               |
| ------ | ---------------- | --------------------- |
| POST   | `/auth/register` | Register a new user   |
| POST   | `/auth/login`    | Login and receive JWT |
| GET    | `/auth/me`       | Get logged-in user    |

### Tasks

| Method | Endpoint     | Purpose          |
| ------ | ------------ | ---------------- |
| GET    | `/tasks`     | Get user's tasks |
| POST   | `/tasks`     | Create a task    |
| PUT    | `/tasks/:id` | Update a task    |
| DELETE | `/tasks/:id` | Delete a task    |

### Debug (Practical 9)

| Method | Endpoint              | Purpose                          |
| ------ | --------------------- | -------------------------------- |
| GET    | `/debug/cache-stats`  | Cache hit/miss counters & status |

Task routes require:

```text
Authorization: Bearer <token>
```

## Authentication Flow

```text
Register
   ↓
Password hashed using bcrypt
   ↓
User saved in MongoDB
   ↓
Login
   ↓
Password verified
   ↓
JWT generated
   ↓
JWT used for protected task routes
```

## Validation

The server validates incoming requests before accessing the database.

For example, a task without a title returns:

```text
400 Bad Request
```

## Testing with Postman

The following tests were performed:

1. Register user - `201 Created`
2. Login - `200 OK` with JWT token
3. Access `/tasks` without token - `401 Unauthorized`
4. Access `/tasks` with token - `200 OK`
5. Create task without title - `400 Bad Request`
6. Access `/auth/me` with token - `200 OK`

## Practical 9 — Caching

* `GET /tasks` checks an in-memory cache first (per-user key), then MongoDB on miss.
* `GET /tasks/:id` uses a separate cache key per user and task id.
* POST, PUT, and DELETE invalidate the user's list cache (and the single-task key when applicable).
* Response time comparison template: [docs/practical-9-cache-benchmark.md](docs/practical-9-cache-benchmark.md)

## Security

* Passwords are never stored as plain text.
* bcrypt is used for password hashing.
* JWT secret is stored in `.env`.
* `.env` is excluded from GitHub.
* Protected routes require a valid JWT.
* Invalid or expired tokens return `401 Unauthorized`.

## Project Structure

```text
task-manager-api/
├── client/
├── docs/
│   └── practical-9-cache-benchmark.md
├── middleware/
│   ├── auth.js
│   └── validate.js
├── models/
│   ├── User.js
│   └── Task.js
├── cache.js
├── server.js
├── package.json
├── .env
├── .gitignore
└── README.md
```




## ❓ Key Questions & Conceptual Analysis

### 1. Why must passwords be hashed before storage instead of saved as plain text, even in a lab/demo project?
- **Protection Against Database Breaches**: If an unauthorized party gains access to the database dump or backup files, plain-text passwords expose every user's raw credentials immediately.
- **Mitigating Credential Stuffing**: Users frequently reuse passwords across multiple personal and professional services. Exposing plain text passwords compromises accounts on unrelated platforms.
- **Insider Threat Minimization**: Developers, database administrators, and cloud engineers should never have direct visibility into user passwords.
- **Why `bcrypt` Over Plain Hashes (MD5/SHA-256)**:
  - Plain MD5/SHA algorithms are designed for speed and are vulnerable to precomputed lookup tables (**Rainbow Tables**) and GPU-accelerated brute-force attacks (billions of hashes per second).
  - `bcrypt` automatically generates a cryptographically random **salt** for every user (defeating rainbow tables) and incorporates an **adaptive work factor (cost)** that intentionally slows computation, making dictionary attacks mathematically infeasible.

### 2. What does the authentication middleware actually verify, and what happens if the token is missing or expired?
- **Structure of a JWT**: A JWT contains three Base64URL-encoded segments separated by dots (`header.payload.signature`):
  1. `Header`: Algorithm and token type (`HS256`, `JWT`).
  2. `Payload`: Claims such as user ID, email, issued-at (`iat`), and expiration timestamp (`exp`).
  3. `Signature`: Cryptographic hash produced with `HMACSHA256(base64Url(header) + "." + base64Url(payload), JWT_SECRET)`.
- **What the Middleware Verifies**:
  - Checks that the token was signed with the server's private `JWT_SECRET`. If any payload claim (e.g. user ID or role) is tampered with by a client, the recalculated signature will not match, failing verification.
  - Checks that the current server timestamp is strictly less than the `exp` timestamp claim.
- **Missing or Expired Token Behavior**:
  - **Missing Token**: Middleware intercepts the request before controller execution and returns `401 Unauthorized` with an informative JSON message.
  - **Expired or Tampered Token**: `jwt.verify()` throws a `TokenExpiredError` or `JsonWebTokenError`. When wrapped in a `try/catch` block, the middleware intercepts the exception, prevents unhandled server crashes, and safely responds with `401 Unauthorized`.

### 3. Why should input validation happen on the server even if the frontend already validates the same fields?
- **Client-Side Validation is Easily Bypassed**: Any user or attacker can bypass browser validations using tools like Postman, `curl`, browser dev tools, or automated scripts, sending malformed, oversized, or malicious payloads directly to API endpoints.
- **Data Integrity & Schema Guarantees**: Server-side validation acts as the definitive gatekeeper for the database, preventing invalid states (empty task titles, malformed emails, unsupported enum values) from corrupting the database.
- **Defense in Depth**: Frontend validation is designed for **user experience** (instant UI feedback), whereas server-side validation is designed for **security and system integrity**. Never trust incoming client data.

---


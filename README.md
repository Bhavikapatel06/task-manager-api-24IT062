# Task Manager API — ITUE301 (Practicals 4–12)

[![CI Pipeline](https://github.com/Bhavikapatel06/task-manager-api-24IT062/actions/workflows/ci.yml/badge.svg)](https://github.com/Bhavikapatel06/task-manager-api-24IT062/actions/workflows/ci.yml)

## ITUE301 - Advanced Web Development Frameworks

A full-stack Task Management application featuring JWT authentication, bcrypt password hashing, Express middleware, server-side validation, in-memory caching (Practical 9), event-driven asynchronous processing with EventEmitter (Practical 10), multi-container Docker & Docker Compose orchestration (Practical 11), and automated CI/CD pipeline with GitHub Actions (Practical 12).

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
* **Practical 10:** Event-Driven Architecture with native Node.js `EventEmitter` for background notification simulation
* **Practical 11:** Complete containerization via Dockerfiles (backend & multi-stage React frontend) and orchestrated multi-container deployment via Docker Compose (`docker-compose.yml`)
* **Practical 12:** Automated CI/CD pipeline with GitHub Actions running ESLint code quality checks and Jest + Supertest API integration tests on every push and pull request

## Technologies

* Node.js & Express.js
* MongoDB & Mongoose
* React & Vite
* Docker & Docker Compose
* GitHub Actions (CI/CD)
* Jest & Supertest (Automated Testing)
* ESLint (Code Quality & Style)
* JWT (`jsonwebtoken`)
* bcryptjs
* `node-cache`
* Native Node.js `EventEmitter`
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

### Option A: Running with Docker Compose (Practical 11 — Single Command)

The entire full-stack application (React frontend, Node/Express backend, and MongoDB database) can be started with a single command:

```bash
docker compose up --build
```

To run in detached (background) mode:

```bash
docker compose up --build -d
```

To view running containers:

```bash
docker ps
```

To stop all services and remove containers and network:

```bash
docker compose down
```

### Option B: Running Locally (Manual Development)

Start the backend:

```bash
npm run dev
```

Start the frontend:

```bash
npm run client
```

### Option C: Running Automated Tests & Linting (Practical 12 — CI/CD)

Run code quality linter:

```bash
npm run lint
```

Run automated Jest API tests:

```bash
npm test
```

### Access URLs

* **Frontend UI:** `http://localhost:5173`
* **Backend API:** `http://localhost:5000`
* **Demo Login:** Email: `student@charusat.edu.in` | Password: `password123`

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

### Debug & System (Practical 9 & 12)

| Method | Endpoint              | Purpose                          |
| ------ | --------------------- | -------------------------------- |
| GET    | `/`                   | API health & status check        |
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

## Testing with Postman & Jest

The following automated and manual tests verify system functionality:

1. Register user - `201 Created`
2. Login - `200 OK` with JWT token
3. Access `/tasks` without token - `401 Unauthorized`
4. Access `/tasks` with token - `200 OK`
5. Create task without title - `400 Bad Request`
6. Access `/auth/me` with token - `200 OK`
7. Health check `GET /` - `200 OK`
8. Cache metrics `GET /debug/cache-stats` - `200 OK`

## Practical 9 — Caching

* `GET /tasks` checks an in-memory cache first (per-user key), then MongoDB on miss.
* `GET /tasks/:id` uses a separate cache key per user and task id.
* POST, PUT, and DELETE invalidate the user's list cache (and the single-task key when applicable).
* Response time comparison template: [docs/practical-9-cache-benchmark.md](docs/practical-9-cache-benchmark.md)

## Practical 12 — CI/CD Pipeline with GitHub Actions

* **Workflow definition:** `.github/workflows/ci.yml`
* **Trigger:** Triggers automatically on every `push` and `pull_request` to `main`.
* **Jobs:**
  1. `lint`: Executes ESLint code quality and syntax validation.
  2. `build-and-test`: Executes `npm test` using Jest & Supertest across endpoints.
* **Lab Manual Documentation:** [docs/practical-12-ci-cd-pipeline.md](docs/practical-12-ci-cd-pipeline.md)

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
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI Workflow (Practical 12)
├── client/
│   ├── src/
│   ├── .dockerignore
│   ├── Dockerfile             # Multi-stage frontend build (Practical 11)
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── practical-9-cache-benchmark.md
│   ├── practical-10-event-driven-architecture.md
│   ├── practical-11-docker-containerization.md
│   └── practical-12-ci-cd-pipeline.md
├── middleware/
│   ├── auth.js
│   └── validate.js
├── models/
│   ├── User.js
│   └── Task.js
├── tests/
│   └── api.test.js            # Automated Jest API tests (Practical 12)
├── .dockerignore              # Excludes node_modules & .env from build context
├── .env.example
├── .gitignore
├── cache.js
├── docker-compose.yml         # Multi-container orchestration (Practical 11)
├── Dockerfile                 # Backend Node/Express image (Practical 11)
├── eslint.config.js          # ESLint code quality configuration (Practical 12)
├── events.js                  # EventEmitter singleton (Practical 10)
├── listeners.js               # Background event listeners (Practical 10)
├── package.json
├── server.js
└── README.md
```

## ❓ Key Questions & Conceptual Analysis

### Practical 12: CI/CD Pipeline with GitHub Actions

#### 1. What is the difference between Continuous Integration and Continuous Deployment, and which one does this practical demonstrate?
* **Continuous Integration (CI):** The practice of automating the building, linting, and testing of code every time a developer commits changes to a shared repository. It catches integration bugs, regressions, and broken dependencies immediately.
* **Continuous Deployment (CD):** The automated delivery and deployment of validated code directly to production environments (cloud hosting, container registries, servers) without manual approval.
* **Which is demonstrated:** This practical demonstrates **Continuous Integration (CI)**, automating dependency installation, code linting (`eslint`), and API integration tests (`jest`) on GitHub runners upon every commit and pull request.

#### 2. Why does running tests automatically on every push catch problems earlier than testing manually before a release?
* **Immediate Feedback:** Developers receive automated pass/fail feedback within 1–2 minutes while their mental model of the code change is fresh.
* **Root-Cause Isolation:** Instead of debugging a release candidate containing hundreds of accumulated commits, regressions are tied directly to the single commit that caused them.
* **Consistent Clean Environment:** Eliminates "works on my machine" issues by executing tests in a sterile, reproducible `ubuntu-latest` virtual environment.
* **Branch Protection:** Prevents broken code from being merged into production branches (`main`).

#### 3. What would happen to the pipeline if the test file path were incorrect — would the workflow fail at the same step as a genuine test failure?
* **Same Step Failure:** Yes, the workflow fails at the same workflow step (`Run Jest Tests` / `npm test`), because both conditions cause the process to exit with a non-zero exit code (`exit 1`).
* **Diagnostic Difference:** A genuine test failure runs the test runner successfully but fails an assertion (e.g. `Expected: 200, Received: 500`), providing assertion diffs. An incorrect file path fails at runner startup with `No tests found` or `ENOENT: file not found`, indicating a test configuration error rather than a code defect.

---

### Practical 11: Containerization with Docker and Docker Compose

#### 1. Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
* **Container Network Isolation**: Each container runs inside its own isolated network namespace with its own private loopback interface (`127.0.0.1` / `localhost`). Inside the backend container, `localhost:27017` refers to the backend container itself, where no database engine is listening.
* **Automatic Service Discovery via Docker DNS**: When containers are connected to a user-defined network (such as `app-network`), Docker Compose runs an internal DNS resolver at `127.0.0.11`. It resolves the service name `mongodb` to the internal dynamic IP assigned to the MongoDB container.
* **Resilience Across Restarts**: Containers may receive new internal IP addresses upon restart or recreation. Using the hostname `mongodb` guarantees that the connection string `mongodb://mongodb:27017/taskdb` remains permanently valid.

#### 2. What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
* **`EXPOSE` (Dockerfile)**: Serves as documentation and container metadata indicating which port the process inside the container intends to listen on. It does **not** publish or bind the port to the host machine. Containers on the same Docker network can communicate over exposed ports without publishing them to the host.
* **`ports` (docker-compose.yml)**: Actively publishes and forwards host ports to container ports (format: `"HOST:CONTAINER"`, e.g., `"5000:5000"`). This creates host-side IP table / socket bindings so that outside clients (e.g., your host web browser or Postman) can access the service via `http://localhost:5000`.

#### 3. Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
* **Platform Architecture Incompatibility**: The host machine (e.g., Windows 11 x64) and the container OS (Debian/Alpine Linux x64/arm64) may have different ABIs and C runtimes. Native compiled C++ addons (e.g., `bcrypt`, `esbuild`) compiled on Windows will crash inside a Linux container with binary incompatibility errors (`invalid ELF header`).
* **Bloated Build Context**: Host `node_modules` folders typically exceed several hundred megabytes. Sending them across the Docker daemon socket drastically slows down the build context transfer time.
* **Layer Caching Invalidation**: Docker builds use layer caching. By copying only `package*.json` and running `npm install` before `COPY . .`, Docker caches the installed dependencies layer. Subsequent code edits rebuild almost instantaneously without reinstalling dependencies.
* **Clean & Deterministic Environment**: Installing dependencies inside the container ensures a pristine environment governed strictly by `package.json` / `package-lock.json`.

---

### Practical 4–7: Authentication, Hashing & Validation

#### 1. Why must passwords be hashed before storage instead of saved as plain text?
* Protects against database breaches and dump exposure.
* Defeats credential stuffing across unrelated platforms.
* `bcryptjs` introduces a cryptographic salt and configurable work factor to defeat rainbow tables and GPU brute-force attacks.

#### 2. What does the authentication middleware verify?
* Validates token signature against `JWT_SECRET` to prevent tampering.
* Validates `exp` claim against current server time.
* Returns `401 Unauthorized` for missing, expired, or invalid tokens.

#### 3. Why validate on the server if the client already validates?
* Client-side validation is trivial to bypass via Postman, `curl`, or scripts.
* Server-side validation is the authoritative gatekeeper for database integrity and security.

---

# Task Manager API — ITUE301 (Practicals 4–13)

[![CI Pipeline](https://github.com/Bhavikapatel06/task-manager-api-24IT062/actions/workflows/ci.yml/badge.svg)](https://github.com/Bhavikapatel06/task-manager-api-24IT062/actions/workflows/ci.yml)

## ITUE301 - Advanced Web Development Frameworks

A full-stack Task Management application featuring JWT authentication, bcrypt password hashing, Express middleware, server-side validation, in-memory caching (Practical 9), event-driven asynchronous processing with EventEmitter (Practical 10), multi-container Docker & Docker Compose orchestration (Practical 11), automated CI/CD pipeline with GitHub Actions (Practical 12), and secure AI API integration with graceful degradation (Practical 13).

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
* **Practical 13:** AI API integration (Groq / OpenAI / Gemini) for auto-generating task descriptions, with server-side key security, rate limiting, and graceful degradation fallback

## Technologies

* Node.js & Express.js
* MongoDB & Mongoose
* React & Vite
* Docker & Docker Compose
* GitHub Actions (CI/CD)
* OpenAI & Groq AI SDKs / APIs
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
# AI API Key (Groq / OpenAI / Gemini) (Practical 13)
AI_API_KEY=your_ai_api_key_here
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

### AI Assistant (Practical 13)

| Method | Endpoint                       | Purpose                                        |
| ------ | ------------------------------ | ---------------------------------------------- |
| POST   | `/api/ai/generate-description` | Generate contextual task description via AI    |

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
9. AI description generation `POST /api/ai/generate-description` - `200 OK`

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

## Practical 13 — AI API Integration & Responsible AI

* **Endpoint:** `POST /api/ai/generate-description`
* **Security:** API keys are managed exclusively on the backend (`.env`) and never exposed in client bundles or network requests.
* **Graceful Degradation:** Automatic timeout handling (8s) and local template fallback ensures zero downtime if third-party AI APIs become unreachable.
* **Rate Limiting:** Sliding-window rate limiter (max 10 requests/min per client) protects quotas against abuse.
* **User Agency & Transparency:** Suggestions are loaded into editable textareas with clear AI disclosure disclaimers.
* **Lab Manual Documentation:** [docs/practical-13-ai-api-integration.md](docs/practical-13-ai-api-integration.md)

## Security

* Passwords are never stored as plain text.
* bcrypt is used for password hashing.
* JWT secret is stored in `.env`.
* AI API keys are stored strictly in `.env`.
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
│   │   ├── components/
│   │   │   └── TaskForm.jsx   # AI generation button & editable suggestions (Practical 13)
│   │   └── api.js             # Client API integration for AI endpoint (Practical 13)
│   ├── .dockerignore
│   ├── Dockerfile             # Multi-stage frontend build (Practical 11)
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── practical-9-cache-benchmark.md
│   ├── practical-10-event-driven-architecture.md
│   ├── practical-11-docker-containerization.md
│   ├── practical-12-ci-cd-pipeline.md
│   └── practical-13-ai-api-integration.md
├── middleware/
│   ├── auth.js
│   └── validate.js
├── models/
│   ├── User.js
│   └── Task.js
├── tests/
│   └── api.test.js            # Automated Jest API tests (Practicals 12 & 13)
├── .dockerignore              # Excludes node_modules & .env from build context
├── .env.example
├── .gitignore
├── aiService.js               # Multi-provider AI service & rate limiting (Practical 13)
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

### Practical 13: AI API Integration into a Web Application

#### 1. Why must the AI API key be called from the backend rather than directly from the React frontend?
* **Exposure in Browser Runtime**: React runs client-side inside the user's web browser. Any key used on the frontend is publicly exposed in JavaScript bundles and HTTP request headers in DevTools.
* **Financial & Quota Risk**: Unauthorized individuals can easily harvest leaked keys to consume your API quota, incurring substantial costs or leading to account suspension.
* **Server-Side Governance**: Calling through the backend allows the server to sanitize prompts, enforce authentication, apply rate limits, log usage, and inject safety guardrails.

#### 2. What does 'graceful degradation' mean in this context, and why does it matter for a feature that depends on a third-party service outside your control?
* **Definition**: A software design principle where a system maintains core operational capabilities even when external dependencies fail, rather than presenting a hard crash or blocking user actions.
* **Importance for AI Features**: External AI APIs can experience outages, latency spikes, rate limits, or network failures. Because generating an AI description is an auxiliary enhancement, a failure in the AI service must never prevent the user from creating or saving their task. Our backend catches errors and delivers a deterministic local fallback suggestion seamlessly.

#### 3. What are the privacy and governance implications of sending task data to an external AI API, and what kind of data should never be sent this way?
* **Privacy Implications**: Data sent to external AI providers leaves your organizational boundary and may be logged or utilized for model training by third-party providers.
* **Data That Must NEVER Be Sent**:
  1. Passwords, secrets, and API tokens.
  2. Personally Identifiable Information (PII) such as Social Security numbers, government IDs, and health data.
  3. Proprietary business algorithms, trade secrets, and confidential financial metrics.

---

### Practical 12: CI/CD Pipeline with GitHub Actions

#### 1. What is the difference between Continuous Integration and Continuous Deployment, and which one does this practical demonstrate?
* **Continuous Integration (CI):** Automates the building, linting, and testing of code every time changes are pushed to a shared repository to catch bugs immediately.
* **Continuous Deployment (CD):** The automated delivery and release of tested code directly into production environments without manual intervention.
* **Which is demonstrated:** This practical demonstrates **Continuous Integration (CI)**.

#### 2. Why does running tests automatically on every push catch problems earlier than testing manually before a release?
* **Immediate Feedback:** Developers receive automated feedback within 1–2 minutes while context is fresh.
* **Root-Cause Isolation:** Issues are tied to the specific commit that introduced them.
* **Clean Environment:** Executes in pristine `ubuntu-latest` virtual runners, eliminating environment drift.

#### 3. What would happen to the pipeline if the test file path were incorrect — would the workflow fail at the same step as a genuine test failure?
* **Same Step Failure:** Yes, the workflow fails at the same workflow step (`Run Jest Tests` / `npm test`), as both return a non-zero exit code (`exit 1`).
* **Diagnostic Difference:** A genuine failure shows assertion mismatches; an incorrect path shows `No tests found` or `ENOENT`.

---

### Practical 11: Containerization with Docker and Docker Compose

#### 1. Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
* **Container Network Isolation**: Each container runs inside its own isolated network namespace with its own private loopback interface (`127.0.0.1` / `localhost`). Inside the backend container, `localhost:27017` refers to the backend container itself.
* **Automatic Service Discovery via Docker DNS**: On user-defined bridge networks, Docker's embedded DNS server automatically maps service names (`mongodb`) to internal dynamic IP addresses.

#### 2. What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
* **`EXPOSE` (Dockerfile)**: Metadata documenting which container port the process listens on; does not publish to host.
* **`ports` (docker-compose.yml)**: Actively maps and publishes host ports to container ports (`HOST:CONTAINER`).

#### 3. Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
* Avoids binary ABI incompatibilities between host OS and container Linux runtime.
* Avoids bloating Docker build context by hundreds of megabytes.
* Leverages Docker layer caching for rapid rebuilds.

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

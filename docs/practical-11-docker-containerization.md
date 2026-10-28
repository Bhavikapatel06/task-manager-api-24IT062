# Practical 11: Containerization with Docker and Docker Compose

**Course:** ITUE301 — Advanced Web Development Frameworks  
**CO/PO:** CO5 / PO3, PO5  

---

## 1. Objective
To containerize the complete full-stack Task Management application (React frontend, Node/Express backend, and MongoDB database) using Docker and orchestrate all services seamlessly using Docker Compose with an internal bridge network and persistent volume storage.

---

## 2. Architecture & Networking Diagram

```text
                           Host Browser (Client)
                                  │
         ┌────────────────────────┴────────────────────────┐
         │ http://localhost:5173                           │ http://localhost:5000
         ▼                                                 ▼
┌──────────────────┐                              ┌──────────────────┐
│     frontend     │                              │     backend      │
│  (React + Vite)  │                              │  (Node/Express)  │
│ Container Port:  │                              │ Container Port:  │
│       5173       │                              │       5000       │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         │           Docker Internal Bridge Network        │
         │                   (app-network)                 │
         │                                                 │
         │                                                 ▼
         │                                        ┌──────────────────┐
         │                                        │     mongodb      │
         └───────────────────────────────────────►│  (Official Mongo)│
                                                  │ Service: mongodb │
                                                  │ Container Port:  │
                                                  │      27017       │
                                                  └────────┬─────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │   Named Volume   │
                                                  │  (mongodb_data)  │
                                                  └──────────────────┘
```

### Service Summary:
| Service | Image / Build Context | Container Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **frontend** | `./client` (Multi-stage build) | `5173` | `5173` | Serves compiled React SPA via Vite preview |
| **backend** | `.` (Node 18 base image) | `5000` | `5000` | REST API, JWT Auth, In-Memory Caching, Events |
| **mongodb** | `mongo:7.0` (Official Mongo) | `27017` | `27018`* | NoSQL Database with persistent volume |

*\* Host port `27018` is mapped to container port `27017` to eliminate port conflicts when a local MongoDB service runs on the host machine.*

---

## 3. Implementation Details

### A. Backend Dockerfile (`./Dockerfile`)
Contains container definitions for the Express API server:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### B. Frontend Multi-Stage Dockerfile (`./client/Dockerfile`)
Uses a multi-stage build to isolate the build environment from the lean runtime container:
```dockerfile
# Stage 1: Build stage - compiles Vite React production assets
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime stage - lightweight Alpine runner for production preview
FROM node:18-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.js ./
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host"]
```

### C. Docker Ignore Files (`.dockerignore`)
Prevents unnecessary and sensitive files from being copied into the build context, dramatically speeding up builds:
- **Root `.dockerignore`**:
  ```text
  node_modules
  npm-debug.log*
  .env
  .env.*
  .git
  .gitignore
  client/node_modules
  client/dist
  docs
  *.md
  ```
- **Client `.dockerignore` (`client/.dockerignore`)**:
  ```text
  node_modules
  dist
  npm-debug.log*
  .env
  .env.*
  .git
  .gitignore
  ```

### D. Docker Compose File (`docker-compose.yml`)
Orchestrates all 3 containers with dependencies, networking, and volumes:
```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: always
    ports:
      - "${MONGO_PORT:-27018}:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongodb:27017/taskdb
      - JWT_SECRET=supersecret_practical11_jwt_docker_key_2026_awdf
      - JWT_EXPIRES_IN=1h
      - CACHE_ENABLED=true
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: frontend
    restart: always
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:5000
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mongodb_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

---

## 4. Execution & Step-by-Step Verification

### Step 1: Start the Entire Application Stack
Execute the single orchestration command from the root repository directory:
```bash
docker compose up --build -d
```

### Step 2: Verify Running Containers
Verify that all 3 services are healthy and running:
```bash
docker ps
```
**Actual Terminal Output:**
```text
CONTAINER ID   IMAGE                       COMMAND                  STATUS          PORTS                                             NAMES
f3e9aebe1100   task-manager-api-frontend   "docker-entrypoint.s…"   Up 20 minutes   0.0.0.0:5173->5173/tcp, [::]:5173->5173/tcp       frontend
bd0b316f48b3   task-manager-api-backend    "docker-entrypoint.s…"   Up 20 minutes   0.0.0.0:5000->5000/tcp, [::]:5000->5000/tcp       backend
61f69a5a0a30   mongo:7.0                   "docker-entrypoint.s…"   Up 20 minutes   0.0.0.0:27018->27017/tcp, [::]:27018->27017/tcp   mongodb
```

### Step 3: Inspect Backend Startup Logs
```bash
docker logs backend
```
**Actual Output:**
```text
Server running on port 5000
MongoDB connected successfully (mongodb://mongodb:27017/taskdb)
Demo user seeded successfully (student@charusat.edu.in)
```

### Step 4: Verify Frontend Web Interface
- Open `http://localhost:5173` in any host web browser.
- Login using demo credentials:
  - **Email:** `student@charusat.edu.in`
  - **Password:** `password123`
- Create, view, update, and delete tasks.

### Step 5: Test Data Persistence Across Restarts (Named Volume Test)
1. Create a task via API / UI.
2. Tear down the containers and recreate them:
   ```bash
   docker compose down
   docker compose up -d
   ```
3. Fetch tasks using the JWT token:
   ```powershell
   $login = Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body '{"email":"student@charusat.edu.in","password":"password123"}'
   $tasks = Invoke-RestMethod -Uri "http://localhost:5000/tasks" -Method GET -Headers @{ "Authorization" = "Bearer $($login.token)" }
   $tasks | Format-Table _id, title, completed
   ```
   **Output:**
   ```text
   _id                      title                      completed
   ---                      -----                      ---------
   6ae180db05798c89bcb91b22 Dockerized Full Stack Task     False
   ```
   *Result:* Task data persisted successfully across container destruction thanks to the `mongodb_data` named volume.

---

## 5. Key Questions & Conceptual Analysis

### Q1. Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
- **Network Isolation:** Each Docker container runs in its own network namespace with its own loopback interface (`127.0.0.1` / `localhost`). When running inside the `backend` container, `localhost` points directly to the `backend` container itself, where no MongoDB instance is running.
- **Docker Embedded DNS:** When containers share a user-defined network (such as `app-network`), Docker Compose injects a built-in DNS server (at `127.0.0.11`). This DNS server automatically maps service names (e.g., `mongodb`, `backend`, `frontend`) to the internal IP addresses dynamically assigned to those containers.
- **Dynamic IP Management:** Container IPs can change when containers are restarted, recreated, or scaled. Referencing the DNS service name `mongodb` ensures the connection string (`mongodb://mongodb:27017/taskdb`) remains valid regardless of underlying IP assignment.

---

### Q2. What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
| Feature | `EXPOSE` (Dockerfile) | `ports` (docker-compose.yml / `docker run -p`) |
| :--- | :--- | :--- |
| **Function** | Documentation & metadata instruction | Active network port binding and forwarding |
| **Host Accessibility** | Does **NOT** publish ports to the host machine | Maps host ports to container ports (`HOST:CONTAINER`) |
| **Inter-container Traffic** | Allows other containers in the same network to know which port is listened on | Not required for inter-container traffic on shared bridge networks |
| **Security Implication** | Safe; exposes nothing outside Docker internal networking | Opens ports on the host's network interfaces (`0.0.0.0`) |

*Summary:* `EXPOSE 5000` informs Docker that the application inside listens on port 5000. `ports: ["5000:5000"]` binds host port 5000 to container port 5000 so users can reach `http://localhost:5000` from their host browser.

---

### Q3. Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
1. **Platform Architecture Incompatibility (Binary Add-ons):**
   - Development machines frequently run different operating systems and CPU architectures than container runtimes (e.g., Windows 11 host vs. Debian/Alpine Linux container).
   - Node packages with native C/C++ bindings (such as `bcrypt`, `sharp`, `esbuild`) compile OS-specific binaries (`.node` files). Copying host `node_modules` causes runtime crashes (`invalid ELF header` or `DLL load failed`).
2. **Massive Build Context Overhead:**
   - A local `node_modules` folder contains tens of thousands of small files totaling 300MB–1GB+.
   - Sending this massive context to the Docker daemon dramatically increases build startup time.
3. **Layer Caching Invalidation:**
   - Copying `package.json` first and running `RUN npm install` allows Docker to cache the dependency layer. As long as `package.json` doesn't change, subsequent code changes build in less than a second instead of reinstalling everything.
4. **Reproducibility & Security:**
   - Running `npm install` (or `npm ci`) inside the container ensures clean, deterministic dependencies derived strictly from `package.json` / `package-lock.json`, free from corrupted local host artifacts.

---

## 6. Supplementary Problems Solved

1. **`.dockerignore` Optimization:**
   - Both root and client `.dockerignore` files exclude `node_modules`, `.env`, `.git`, and build caches from the build context.
   - Context transfer reduced from over 500MB to just **17KB**.
2. **Multi-Stage Build for Frontend:**
   - Stage 1 compiles React Vite production assets inside Node 18.
   - Stage 2 copies only the compiled `dist/` directory and runtime configuration into a lightweight Alpine runner (`node:18-alpine`).
   - Final compressed image content size reduced to **71.5MB** (an 80%+ reduction over standard Debian Node images).
3. **Persistent Named Volume for MongoDB:**
   - Volume `mongodb_data` is mounted to `/data/db`.
   - Data persists safely across container recreations, updates, and host reboots.

---

## 7. Troubleshooting & Gotchas

| Symptom | Root Cause | Solution Applied |
| :--- | :--- | :--- |
| `Bind for 0.0.0.0:27017 failed: port is already allocated` | Host machine already has a local MongoDB process running on port 27017 | Configured `"${MONGO_PORT:-27018}:27017"` in `docker-compose.yml` to safely map host port 27018 without conflicts |
| Backend fails to connect on initial startup | MongoDB container is still initializing while backend tries to connect | Added connection retry logic with backoff in `server.js` (`connectDB`) |
| `Demo user seed note: crypto is not defined` | Node 18 native WebCrypto not bound to `globalThis` before `bcryptjs` loads | Added `globalThis.crypto = require('crypto').webcrypto` polyfill at line 1 of `server.js` |
| Code changes not reflected | Docker cached old image layers | Ran `docker compose up --build` to force fresh image layer creation |

---

## 8. Summary Checklist
- [x] Backend `Dockerfile` created with `node:18`
- [x] Frontend `Dockerfile` created with multi-stage build (`node:18 AS build` -> `node:18-alpine AS runner`)
- [x] Root and client `.dockerignore` files excluding `node_modules` and `.env`
- [x] `docker-compose.yml` orchestrating `frontend`, `backend`, `mongodb` on `app-network`
- [x] Named volume `mongodb_data` for database durability
- [x] Backend connects via `mongodb://mongodb:27017/taskdb`
- [x] Entire stack launches with a single command: `docker compose up --build -d`
- [x] All 3 containers verified running with `docker ps`
- [x] End-to-end task creation, retrieval, and auth verified

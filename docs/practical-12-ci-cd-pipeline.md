# Practical 12: CI/CD Pipeline with GitHub Actions

**Course:** ITUE301 — Advanced Web Development Frameworks  
**CO/PO:** CO5 / PO3, PO5  

---

## 1. Objective
To automate testing and code quality verification of the Task Management full-stack application using a Continuous Integration (CI) pipeline powered by GitHub Actions, ensuring every commit pushed or pull request opened against the `main` branch is validated automatically before merging or deployment.

---

## 2. Architecture & CI/CD Pipeline Flow Diagram

```text
               Developer commits & pushes code to GitHub
                         (git push origin main)
                                   │
                                   ▼
                 GitHub Actions Event Trigger (on: push / PR)
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Workflow: CI Pipeline                           │
│                                                                        │
│  Job 1: lint (Code Quality & Style Check)                              │
│  ├── Step 1: actions/checkout@v4                                       │
│  ├── Step 2: actions/setup-node@v4 (Node 18 + npm cache)               │
│  ├── Step 3: npm install                                               │
│  └── Step 4: npm run lint (ESLint validation)                         │
│                                                                        │
│                                  │ (needs: lint - passes)              │
│                                  ▼                                     │
│                                                                        │
│  Job 2: build-and-test (Build & Automated Unit/Integration Tests)      │
│  ├── Step 1: actions/checkout@v4                                       │
│  ├── Step 2: actions/setup-node@v4 (Node 18 + npm cache)               │
│  ├── Step 3: npm install                                               │
│  └── Step 4: npm test (Jest + Supertest API endpoints)                │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
          Test Passes (Exit 0)                Test Fails (Exit 1)
                 │                                   │
                 ▼                                   ▼
     Green Checkmark on GitHub             Red 'X' on GitHub +
        "All checks have passed"              Detailed Error Logs
```

---

## 3. Implementation Details

### A. GitHub Actions Workflow Configuration (`.github/workflows/ci.yml`)
Located at `.github/workflows/ci.yml`, orchestrating a two-stage CI pipeline (`lint` followed by `build-and-test`):

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Code Quality & Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install Dependencies
        run: npm install

      - name: Run ESLint
        run: npm run lint

  build-and-test:
    name: Build & Run Automated Tests
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install Dependencies
        run: npm install

      - name: Run Jest Tests
        run: npm test
```

### B. Automated Test Suite (`tests/api.test.js`)
Built with **Jest** and **Supertest** to test critical HTTP endpoints without requiring a live external database connection during CI runs:

```javascript
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const Task = require('../models/Task');

describe('Task Management API - CI/CD Automated Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_practical7_jwt_signing_key_2026_awdf';
  const testToken = jwt.sign(
    { id: '6ae180b805798c89bcb91b21', email: 'student@charusat.edu.in' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeAll(() => {
    // Mock Task.find to enable fast, self-contained CI testing without external database dependency
    jest.spyOn(Task, 'find').mockImplementation(() => ({
      sort: () => ({
        lean: () => Promise.resolve([
          { _id: '6ae180db05798c89bcb91b22', title: 'CI Pipeline Automated Task', completed: false }
        ])
      })
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Test 1: API Health Check (GET /)
  test('GET / returns 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.message).toBe('Task Manager API is running');
  });

  // Test 2: Primary Practical 12 Requirement (GET /tasks returns 200)
  test('GET /tasks returns 200', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Test 3: Authentication Security (GET /tasks returns 401 when unauthenticated)
  test('GET /tasks returns 401 when unauthorized', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  // Test 4: Supplementary Requirement (Covering second endpoint: GET /debug/cache-stats)
  test('GET /debug/cache-stats returns 200', async () => {
    const res = await request(app).get('/debug/cache-stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('cacheEnabled');
    expect(res.body).toHaveProperty('cachedKeyCount');
  });
});
```

### C. ESLint Linter Configuration (`eslint.config.js`)
Configured modern ESLint flat config checking for syntax errors, undeclared variables, and code hygiene:

```javascript
module.exports = [
  {
    ignores: ['node_modules/**', 'client/**', 'dist/**', 'docs/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        globalThis: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        setTimeout: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error'
    }
  }
];
```

### D. Package Scripts (`package.json`)
```json
"scripts": {
  "start": "node server.js",
  "dev": "node --watch server.js",
  "client": "npm run dev --prefix client",
  "client:install": "npm install --prefix client",
  "client:build": "npm run build --prefix client",
  "lint": "eslint .",
  "test": "jest --detectOpenHandles --forceExit"
}
```

---

## 4. Execution & Step-by-Step Verification

### Step 1: Local Test & Lint Verification
Before pushing to GitHub, both pipeline commands were verified locally:
```bash
npm run lint
npm test
```
**Actual Output:**
```text
> task-manager-api@1.0.0 lint
> eslint .

> task-manager-api@1.0.0 test
> jest --detectOpenHandles --forceExit

PASS tests/api.test.js
  Task Management API - CI/CD Automated Tests
    √ GET / returns 200 (219 ms)
    √ GET /tasks returns 200 (50 ms)
    √ GET /tasks returns 401 when unauthorized (35 ms)
    √ GET /debug/cache-stats returns 200 (34 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        2.5 s
Ran all test suites.
```

### Step 2: Demonstration of Deliberate Failure (Broken Test)
To demonstrate the pipeline's failure detection capabilities as required by the lab manual:
1. In `tests/api.test.js`, an assertion was deliberately broken:
   ```javascript
   // Deliberately changed expected status code from 200 to 500:
   expect(res.statusCode).toBe(500); // Expected: 500, Received: 200
   ```
2. When pushed to GitHub, GitHub Actions executed `npm test`, caught the assertion failure, and exited with code 1.
3. **Observed GitHub Actions Result:**
   - **Job Status:** Red X (Failed)
   - **Error Log:**
     ```text
     FAIL tests/api.test.js
       ● Task Management API - CI/CD Automated Tests › GET / returns 200
         Expected: 500
         Received: 200
           at Object.toBe (tests/api.test.js:33:31)
     Error: Process completed with exit code 1.
     ```

### Step 3: Demonstration of Fixed Pipeline (Passing Test)
1. The test assertion was corrected back to the intended value:
   ```javascript
   expect(res.statusCode).toBe(200);
   ```
2. Code was committed and pushed to `main`.
3. GitHub Actions triggered automatically:
   - **Job 1 (lint):** Green Checkmark (Passed in ~15s)
   - **Job 2 (build-and-test):** Green Checkmark (Passed in ~25s)
4. **Observed GitHub Actions Result:**
   - Overall pipeline status: **Passed (Green Checkmark)**
   - All tests passing: 4/4

---

## 5. Key Questions & Conceptual Analysis (Viva / Rubric)

### Q1. What is the difference between Continuous Integration and Continuous Deployment, and which one does this practical actually demonstrate?
* **Continuous Integration (CI):**
  - **Definition:** The practice of automating the integration of code changes from multiple developers into a shared repository frequently. Every commit automatically triggers an isolated build and automated test suite.
  - **Goal:** Detect syntax errors, broken dependencies, logic bugs, and regression failures immediately at the time of commit rather than weeks later.
* **Continuous Deployment (CD):**
  - **Definition:** The automated release and deployment of validated code directly to production environments (e.g., AWS, Render, Docker Swarm, Kubernetes) without manual human intervention.
* **Which one does this practical demonstrate?**
  - This practical strictly demonstrates **Continuous Integration (CI)**. It automatically checks out the codebase, sets up the Node.js runtime, installs dependencies (`npm install`), executes lint checks (`npm run lint`), and runs test assertions (`npm test`) on every push and PR to verify code health. It does not deploy the built artifact to an external cloud host.

---

### Q2. Why does running tests automatically on every push catch problems earlier than testing manually before a release?
1. **Immediate Feedback Loop:** When a developer commits broken code, GitHub Actions sends an immediate alert within 1–2 minutes. The developer still has full context of the code they just wrote and can fix it immediately.
2. **Isolation of Root Cause:** In a pre-release manual test, dozens or hundreds of commits from multiple developers have accumulated. Pinpointing which specific commit introduced a regression is difficult and time-consuming. With CI, the offending commit is identified pinpoint accuracy.
3. **Eliminates "It Works on My Machine" Syndrome:** Manual local testing relies on the individual developer's local environment (dirty dependencies, existing database state, OS-specific files). GitHub Actions runs on a pristine, standardized `ubuntu-latest` runner, exposing missing dependencies and configuration oversights.
4. **Enforces Quality Gates on Pull Requests:** Automated CI blocks broken code from ever being merged into `main`, protecting trunk branch stability.

---

### Q3. What would happen to the pipeline if the test file path were incorrect — would the workflow fail at the same step as a genuine test failure?
* **Same Workflow Step, Different Failure Mechanism:**
  - Yes, the workflow would fail at the **same step** (`Run Jest Tests / npm test`), because both scenarios cause the test runner process to exit with a non-zero exit code (`exit 1`), signaling failure to GitHub Actions.
* **Differences in Diagnostics:**
  - **Genuine Test Failure:** Jest successfully discovers and executes the test file, mounts the Express app, makes HTTP requests, but one or more assertions fail (`expect(received).toBe(expected)`). Jest outputs a detailed assertion diff explaining the mismatch.
  - **Incorrect File Path / Missing Test:** Jest searches the repository matching glob patterns (`**/*.test.js`). If the path is wrong or no test files match, Jest exits with:
    ```text
    Pattern matches no files.
    No tests found, exiting with code 1.
    ```
    Or if a hardcoded path like `jest tests/wrong-name.test.js` is used, Jest immediately throws `ENOENT: no such file or directory`. The error indicates a **configuration failure**, not a **software logic regression**.

---

## 6. Supplementary Problems Solved

1. **Second Job Running Linter (ESLint) Before Tests:**
   - Configured `lint` job with ESLint v10 flat config.
   - Configured `build-and-test` with `needs: lint`, creating a formal stage dependency. If code style or syntax validation fails, expensive test jobs are aborted early, saving runner minutes.
2. **Configured Triggers for Push and Pull Requests:**
   - The workflow triggers automatically on both direct pushes to `main` and on any Pull Request opened against `main`, protecting the main branch before merges happen.
3. **CI Pipeline Status Badge in README:**
   - Added dynamic live status badge linking to GitHub Actions:
   ```markdown
   [![CI Pipeline](https://github.com/Bhavikapatel06/task-manager-api-24IT062/actions/workflows/ci.yml/badge.svg)](https://github.com/Bhavikapatel06/task-manager-api-24IT062/actions/workflows/ci.yml)
   ```

---

## 7. Troubleshooting Guide & Common Mistakes

| Symptom | Likely Cause | Solution Applied |
| :--- | :--- | :--- |
| `npm test fails with 'no test specified'` | `package.json` test script not configured | Configured `"test": "jest --detectOpenHandles --forceExit"` in `package.json` |
| Test hangs indefinitely in CI | Open database connections or background timers preventing clean exit | Skipped automatic database retry loop when `NODE_ENV === 'test'` and added `--forceExit` to Jest script |
| Workflow YAML syntax error | Tabs or incorrect indentation in YAML | Used strict 2-space indentation and validated with YAML parser |
| Workflow not triggered | Workflow file in wrong directory | Ensured path is precisely `.github/workflows/ci.yml` |

---

## 8. Summary Checklist
- [x] Installed `jest` and `supertest` as devDependencies
- [x] Configured `"test"` and `"lint"` scripts in `package.json`
- [x] Created `tests/api.test.js` covering `GET /`, `GET /tasks`, unauthenticated `GET /tasks`, and `GET /debug/cache-stats`
- [x] Configured `.github/workflows/ci.yml` with `lint` and `build-and-test` jobs
- [x] Added status badge to project `README.md`
- [x] Tested both passing and failing assertions locally
- [x] All 4 tests verified passing with exit code 0

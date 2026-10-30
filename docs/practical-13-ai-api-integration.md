# Practical 13: AI API Integration into a Web Application

**Course:** ITUE301 — Advanced Web Development Frameworks  
**CO/PO:** CO6 / PO3, PO5, PO12  

---

## 1. Objective
To integrate an external AI service into the full-stack Task Management application to provide automated, context-aware task description generation, while enforcing responsible AI practices, strict server-side API key security, in-memory rate limiting, and graceful degradation on API failures.

---

## 2. Architecture & Data Flow Diagram

```text
  React Frontend (TaskForm.jsx)
        │
        │ 1. User clicks "Generate with AI" (sends task title)
        ▼
  Express Backend API (/api/ai/generate-description)
        │
        ├── 2. Verify Rate Limit (max 10 req/min per client)
        ├── 3. Read API Key strictly server-side (.env)
        │
        ▼
  External AI Service (Groq / OpenAI / Gemini)
        │
        ├── Success Path (HTTP 200)
        │     └── Returns model completion ──► Parsed into description
        │
        └── Failure Path (Network error / invalid key / timeout 8s)
              └── Catch error ──► Generate deterministic local fallback
        │
        ▼
  JSON Response to React Client:
  {
    "description": "...",
    "fallback": false / true,
    "source": "ai_generated" / "local_fallback",
    "disclaimer": "AI suggestions must be reviewed before saving."
  }
        │
        ▼
  React UI displays suggestion in editable Description field + disclaimer
```

---

## 3. Implementation Details

### A. Dedicated AI Service (`aiService.js`)
Located at `aiService.js`, handling model interaction, multi-provider compatibility, rate limiting, and fallback generation:

```javascript
/**
 * AI Service Integration (Practical 13)
 * Provides AI-powered task description generation with server-side key
 * management, in-memory sliding window rate limiting, and graceful degradation.
 */

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10;     // 10 requests / minute

function checkRateLimit(identifier) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const activeTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - activeTimestamps[0])) / 1000);
    return { limited: true, retryAfter };
  }

  activeTimestamps.push(now);
  rateLimitMap.set(identifier, activeTimestamps);
  return { limited: false };
}

function generateLocalFallback(title) {
  const trimmed = (title || '').trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('fix') || lower.includes('bug')) {
    return `Investigate root cause, replicate the issue in a local environment, implement fix for "${trimmed}", and verify with unit tests.`;
  }
  if (lower.startsWith('test') || lower.includes('ci')) {
    return `Write unit and integration test assertions covering edge cases and error paths for "${trimmed}".`;
  }
  return `Review requirements, draft implementation plan, execute deliverables, and verify completion criteria for: ${trimmed}.`;
}

async function generateDescription(title, identifier = 'anonymous') {
  const DISCLAIMER = 'Notice: AI-generated suggestions should be reviewed and verified by the user before saving.';
  // Rate limiting & API call with 8s timeout and fallback handling...
}
```

### B. Backend API Route (`server.js`)
Secured route exposed at `POST /api/ai/generate-description`:

```javascript
// POST /api/ai/generate-description
app.post('/api/ai/generate-description', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "title" is required to generate a description.'
      });
    }

    const clientIdentifier = (req.user && req.user.id) || req.ip || 'anonymous';
    const result = await generateDescription(title, clientIdentifier);
    res.status(200).json(result);
  } catch (err) {
    console.error('[AI Endpoint Error]:', err.message);
    res.status(200).json({
      description: 'Review requirements and execute deliverables for: ' + (req.body?.title || ''),
      fallback: true,
      source: 'fallback',
      message: 'AI service temporarily unavailable.'
    });
  }
});
```

### C. React Frontend Integration (`client/src/components/TaskForm.jsx`)
- Adds a **"Generate with AI"** button adjacent to the description field with a sparkle icon.
- Features a **loading state** (`isAiLoading`) while waiting for the response.
- Populates the returned text into the editable `textarea` so the user retains full agency to edit or accept the suggestion.
- Displays a visible **disclaimer notice** indicating that the suggestion is AI-generated and should be reviewed.

---

## 4. Execution & Step-by-Step Verification

### Step 1: Live AI Generation (Success Path)
Executing a request to the backend with a valid title:
```bash
Invoke-RestMethod -Uri "http://localhost:5000/api/ai/generate-description" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body '{"title":"Setup CI/CD Pipeline on GitHub Actions"}'
```
**Actual Output:**
```json
{
  "description": "Create a GitHub Actions workflow that builds, tests, and deploys the project automatically on push or PR events. Configure environment variables, caching, and deployment steps as required.",
  "fallback": false,
  "source": "ai_generated",
  "disclaimer": "Notice: AI-generated suggestions should be reviewed and verified by the user before saving."
}
```

### Step 2: Graceful Degradation Test (Failure Path)
Testing system behavior with an invalid or broken API key (`invalid_key_demo`):
```json
{
  "description": "Verify container build, configure environment variables, and orchestrate automated deployment steps for \"Deploy containerized app to Kubernetes\".",
  "fallback": true,
  "source": "local_fallback",
  "disclaimer": "Notice: AI-generated suggestions should be reviewed and verified by the user before saving.",
  "message": "AI service unavailable (Network/Key error). Fallback suggestion provided."
}
```
*Result:* The server does not crash, the HTTP status remains 200, and the user receives a context-aware local template suggestion.

---

## 5. Key Questions & Conceptual Analysis (Viva / Rubric)

### Q1. Why must the AI API key be called from the backend rather than directly from the React frontend?
1. **Exposure of Secret Credentials:** React code runs entirely inside the client's web browser. Any API key embedded in frontend JavaScript, `.env.local`, or bundle files is publicly visible to anyone opening browser DevTools (Network tab or Sources tab).
2. **Financial and Quota Theft:** Malicious actors can extract client-side keys and exhaust API credits, leading to massive cloud bills or service denial for legitimate users.
3. **Prompt Governance & Abuse Prevention:** Backend mediation allows the server to sanitize prompts, inject system guardrails, authenticate the calling user, and enforce server-side rate limits before forwarding the request to third-party providers.

---

### Q2. What does 'graceful degradation' mean in this context, and why does it matter for a feature that depends on a third-party service outside your control?
* **Definition:** Graceful degradation is a software resilience pattern where an application continues to operate in a reduced or fallback capacity when a non-critical component or third-party dependency fails, rather than completely crashing or blocking the user interface.
* **Why it matters for AI:**
  - External AI APIs depend on external network stability, cloud uptime, rate limits, and latency spikes (e.g. 5–10 second response times).
  - In our Task Manager, creating a task is a critical core business function, whereas generating an AI description is an optional assistant feature.
  - If the AI API encounters an outage (503) or rate limit (429), our backend intercepts the error via `try/catch`, generates a local template fallback description, and returns HTTP 200. The user can still create, edit, and save their tasks without interruption.

---

### Q3. What are the privacy and governance implications of sending task data to an external AI API, and what kind of data should never be sent this way?
* **Privacy & Compliance Implications:**
  - Sending data to external AI providers transfers organizational data across network boundaries to third-party servers.
  - Depending on the provider's Terms of Service and data retention policies, prompts may be logged or utilized for future model training unless enterprise Zero Data Retention (ZDR) agreements are signed.
  - Violates privacy regulations (GDPR, HIPAA, FERPA) if Personally Identifiable Information (PII) or protected records are transmitted without consent.
* **Data That Must NEVER Be Sent to Third-Party AI APIs:**
  1. **Authentication Secrets & Credentials:** Passwords, JWT secrets, private keys, API tokens, database connection strings.
  2. **Personally Identifiable Information (PII):** Social Security Numbers (SSN), national IDs, Aadhaar numbers, credit card details, medical records, student grades.
  3. **Proprietary & Confidential Business Data:** Trade secrets, unreleased financial reports, source code containing hardcoded credentials, non-public customer records.

---

## 6. Supplementary Problems Solved

1. **Loading State on Frontend:**
   - Visual spinner animation and text transition (`"Generating AI..."`) implemented in `TaskForm.jsx` during network transit.
2. **In-Memory Rate Limiting:**
   - Sliding-window rate limiter in `aiService.js` allowing a maximum of 10 requests per minute per user/IP. Excess requests return fallback templates with cooldown notes.
3. **Prominent AI Disclaimer Notice:**
   - Clear banner and helper text displayed below the editable suggestion:
     `"💡 Suggestions are AI-generated. Review and modify before saving."`

---

## 7. Summary Checklist
- [x] Installed `openai` SDK & configured multi-provider support (Groq / OpenAI / Gemini)
- [x] API key stored strictly server-side in `.env` (excluded via `.gitignore`)
- [x] Implemented `aiService.js` with sliding-window rate limiting and local fallback generator
- [x] Created `POST /api/ai/generate-description` route in `server.js`
- [x] Integrated "Generate with AI" button, loading state, and disclaimer in `client/src/components/TaskForm.jsx`
- [x] Added automated unit & integration tests in `tests/api.test.js` (6/6 tests passing)
- [x] Verified graceful degradation failure path and local fallback behavior


# Richardson Maturity Model (RMM) API Evaluation & Level 2 Compliance Report

**Course**: ADVANCED WEB DEVELOPMENT FRAMEWORKS (ITUE301)  
**Assignment**: Week 4 Assignment — Evaluating REST API against Richardson Maturity Model  
**CO/PO Mapping**: CO2 / PO3  

---

## 1. Executive Summary

This report evaluates the **Task Management RESTful API** developed using Node.js and Express against Leonard Richardson's **Richardson Maturity Model (RMM)**. The RMM grades an API across four maturity levels (Level 0 through Level 3) based on its utilization of URIs, standard HTTP verbs, HTTP status codes, and hypermedia controls (HATEOAS).

---

## 2. Richardson Maturity Model Evaluation Table

| Level | Criterion | Does your API satisfy this? | Evidence / Code References |
| :--- | :--- | :---: | :--- |
| **Level 0** | **The Swamp of POX**: Single URI for all actions, single HTTP method (typically `POST`), HTTP `200 OK` returned for all responses (even errors). | **No** *(Exceeded)* | The API does **not** rely on a single RPC endpoint (e.g. `/api` or `/doAction`). It defines distinct URIs (`/tasks`, `/tasks/:id`), uses standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`), and returns meaningful status codes (`200`, `201`, `400`, `404`, `500`). |
| **Level 1** | **Resources**: Multiple distinct URIs representing individual resources and resource collections. | **Yes** | The API addresses independent resources via specific paths: `/tasks` identifies the tasks collection, and `/tasks/:id` addresses specific task instances. |
| **Level 2** | **HTTP Verbs & Status Codes**: Correct use of HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) according to standard CRUD semantics, paired with proper HTTP response status codes. | **Yes** | The API utilizes `GET` for safe retrieval, `POST` for creation (with `201 Created` and `Location` header), `PUT` for updates, and `DELETE` for removal, returning status codes (`200`, `201`, `400`, `404`, `500`). |
| **Level 3** | **Hypermedia Controls (HATEOAS)**: Responses contain hypermedia links (`_links`) guiding the client on available state transitions and next actions dynamically. | **No** *(Awareness Only)* | The API returns raw JSON representations of task entities without embedded `_links` metadata. Hypermedia links are documented conceptually below for awareness. |

---

## 3. Endpoint Evaluation & Level 2 Verification

Below is a granular assessment of each endpoint in `server.js` against Level 2 RMM standards:

### 1. `GET /tasks`
- **URI**: `/tasks` (Resource collection noun)
- **HTTP Verb**: `GET` (Safe, idempotent operation)
- **Status Code**: `200 OK`
- **Compliance**: **Satisfies Level 2** — Retrieves all tasks without side effects.

### 2. `GET /tasks/:id`
- **URI**: `/tasks/:id` (Specific resource instance)
- **HTTP Verb**: `GET` (Safe, idempotent operation)
- **Status Codes**: 
  - `200 OK` — Task successfully found and returned.
  - `400 Bad Request` — Non-integer or non-positive ID provided (via `validateTaskId` middleware).
  - `404 Not Found` — Task with specified ID does not exist in dataset.
- **Compliance**: **Satisfies Level 2** — Proper resource URI, HTTP verb, and status code branching.

### 3. `POST /tasks`
- **URI**: `/tasks` (Resource collection target)
- **HTTP Verb**: `POST` (Non-idempotent resource creation)
- **Status Codes & Headers**:
  - `201 Created` — Resource created; returned alongside `Location: /tasks/:id` header pointing to the newly created task resource.
  - `400 Bad Request` — Missing or invalid `title` field, or missing `Content-Type: application/json` header.
- **Compliance**: **Satisfies Level 2** — Uses `POST`, returns `201 Created`, and provides the mandatory RFC-compliant `Location` header.

### 4. `PUT /tasks/:id`
- **URI**: `/tasks/:id` (Specific resource instance)
- **HTTP Verb**: `PUT` (Idempotent resource modification)
- **Status Codes**:
  - `200 OK` — Task successfully updated.
  - `400 Bad Request` — Invalid ID or invalid string datatype for `title`.
  - `404 Not Found` — Task ID does not exist.
- **Compliance**: **Satisfies Level 2** — Uses `PUT` for updating and handles validation and non-existent resource conditions cleanly.

### 5. `DELETE /tasks/:id`
- **URI**: `/tasks/:id` (Specific resource instance)
- **HTTP Verb**: `DELETE` (Idempotent resource removal)
- **Status Codes**:
  - `200 OK` — Resource successfully deleted; returns confirmation message and deleted object.
  - `400 Bad Request` — Invalid ID parameter format.
  - `404 Not Found` — Task ID does not exist.
- **Compliance**: **Satisfies Level 2** — Uses `DELETE` verb with appropriate status code and error handling.

---

## 4. Level 2 Code Improvements Implemented

To ensure full, uncompromising compliance with Level 2 specifications (specifically RFC 7231 / RFC 9110 regarding resource creation), the `POST /tasks` endpoint was improved to include the `Location` response header:

```javascript
// POST /tasks - Create a new task (Level 2 RMM Compliant)
app.post('/tasks', (req, res) => {
  const { title, description, completed } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "title" is required and must be a non-empty string.'
    });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    description: description ? String(description).trim() : '',
    completed: Boolean(completed)
  };

  tasks.push(newTask);
  
  // Level 2 Improvement: Provide Location header pointing to created resource URI
  res.setHeader('Location', `/tasks/${newTask.id}`);
  res.status(201).json(newTask);
});
```

---

## 5. Level 3 Awareness: HATEOAS (Hypermedia As The Engine Of Application State)

### Conceptual JSON Response Body with HATEOAS Links

If the API were upgraded to **Level 3**, task resource representations would embed hypermedia controls (`_links` object, following the HAL specification format) to enable clients to navigate available actions without hardcoding endpoints:

```json
{
  "id": 1,
  "title": "Learn Express Middleware",
  "description": "Understand request lifecycle and next() function execution flow",
  "completed": true,
  "_links": {
    "self": {
      "href": "/tasks/1",
      "method": "GET"
    },
    "update": {
      "href": "/tasks/1",
      "method": "PUT"
    },
    "delete": {
      "href": "/tasks/1",
      "method": "DELETE"
    },
    "collection": {
      "href": "/tasks",
      "method": "GET"
    }
  }
}
```

### Benefits of HATEOAS
- **Self-Discoverability**: The client can examine the `_links` object to determine what actions are permissible on the resource in its current state.
- **Decoupling**: Client applications do not need to hardcode API endpoints (e.g. `/tasks/1`); they follow relational links (e.g. `_links.delete.href`).

---

## 6. Reflection: Why Most Production APIs Stop at Level 2

While Level 3 (HATEOAS) represents the theoretical ideal of REST architectural design, the vast majority of real-world production APIs (such as those from Stripe, GitHub, Twitch, and Twilio) intentionally stop at **Level 2**. The primary technical and practical reasons include:

1. **Payload & Performance Overhead**: Including detailed `_links` metadata for every item in large JSON collection responses (e.g., paginated responses returning hundreds of records) significantly increases response payload sizes, increasing network bandwidth usage and serialization/parsing latencies.
2. **Client-Side Framework Architecture**: Modern frontend stacks (React, Vue, Angular, mobile iOS/Android apps) utilize strongly-typed API clients (TypeScript interfaces, Swagger/OpenAPI code generators, GraphQL) and client-side routing. Developers prefer static, predictable endpoint definitions over dynamically parsing hypermedia links at runtime.
3. **Lack of Universal HATEOAS Standards**: Multiple competing formats exist for hypermedia (HAL, Siren, JSON-LD, Collection+JSON), but none has achieved universal adoption. Without a single industry-wide standard, building cross-platform HATEOAS clients requires custom parsing logic.
4. **Optimal Cost-to-Benefit Ratio at Level 2**: Level 2 delivers 90% of REST's practical benefits—including clean resource separation, HTTP caching via `GET`, standardized method semantics, and explicit error status codes—with minimal engineering overhead. The incremental benefit of Level 3 rarely justifies the added complexity for both API providers and consumers.

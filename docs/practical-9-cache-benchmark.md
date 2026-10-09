# Practical 9 — In-Memory Caching & Response Time Comparison

**Course:** ITUE301 — Advanced Web Development Frameworks  
**TTL:** 60 seconds (`node-cache` `stdTTL`)

## Setup for measurement

1. Start the API: `npm run dev`
2. Log in via `POST /auth/login` and copy the JWT.
3. In Postman or Thunder Client, set `Authorization: Bearer <token>` on `GET /tasks`.
4. **Cached run:** Ensure caching is on (default). Send `GET /tasks` three times within 60s; record Postman **Time** (ms) for each request.
5. **Uncached run:** Stop the server, set `CACHE_ENABLED=false` in `.env` (or remove the variable after testing), restart, and repeat three `GET /tasks` requests. The first request after restart always hits MongoDB; for a fair “always uncached” comparison, leave caching disabled for all three readings.
6. Optional: `GET /debug/cache-stats` shows hit/miss counters while caching is enabled.

## Response time readings (fill in your lab journal)

| Condition | Request # | Response time (ms) | Notes |
|-----------|-----------|-------------------|--------|
| Cached (2nd+ hit) | 1 | | Usually miss if cache was cold |
| Cached | 2 | | Expect cache HIT |
| Cached | 3 | | Expect cache HIT |
| Uncached (`CACHE_ENABLED=false`) | 1 | | |
| Uncached | 2 | | |
| Uncached | 3 | | |

**Average cached (hits only):** _____ ms  
**Average uncached:** _____ ms  

*If the database is small, differences may be small; add more task documents to widen the gap.*

## Key questions (reflection)

### Why invalidate the cache on every write?

After POST, PUT, or DELETE, MongoDB holds the new truth. If `GET /tasks` still served the old cached list, clients would see **stale** data until TTL expiry (up to 60s here). Invalidation keeps reads consistent with writes.

### Reasonable TTL and trade-off

For task lists, **30–120 seconds** is often reasonable in a lab: long enough to measure cache hits, short enough that forgotten invalidation would not hide bugs for long. **Longer TTL** → better performance, more staleness if invalidation fails. **Shorter TTL** → fresher data, fewer cache hits.

### Why node-cache is not suitable for multi-instance deployment

Each Node process has its **own** memory. Instance A may invalidate its cache while Instance B still serves old entries. There is no shared store unless you use Redis or similar.

## Supplementary features implemented

- Separate cache keys for `GET /tasks` (`all_tasks:<userId>`) and `GET /tasks/:id` (`task:<userId>:<taskId>`).
- Debug endpoint: `GET /debug/cache-stats` (also `/api/debug/cache-stats`).

## Toggle caching without editing code

```env
CACHE_ENABLED=false
```

Restart the server after changing `.env`.

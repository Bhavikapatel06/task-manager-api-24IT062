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
    expect(res.statusCode).toBe(500); // Deliberate failure demo
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

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const Task = require('../models/Task');
const aiService = require('../aiService');

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

    // Mock AI service in CI test suite for fast, deterministic, offline-resilient execution
    jest.spyOn(aiService, 'generateDescription').mockImplementation(async (title) => {
      return {
        description: `Automated test description for task: ${title}`,
        fallback: false,
        source: 'ai_generated',
        disclaimer: 'Notice: AI-generated suggestions should be reviewed and verified by the user before saving.'
      };
    });
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

  // Test 5: AI Description Generation (POST /api/ai/generate-description) (Practical 13)
  test('POST /api/ai/generate-description returns 200 and description', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Configure GitHub Actions CI Workflow' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('description');
    expect(typeof res.body.description).toBe('string');
    expect(res.body.description.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('disclaimer');
  });

  // Test 6: AI Validation on missing title (Practical 13)
  test('POST /api/ai/generate-description returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Bad Request');
  });
});

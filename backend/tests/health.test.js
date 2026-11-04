const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns 200 and the expected JSON body', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Server is running',
    });
  });
});

describe('Unknown Route Handler (404)', () => {
  it('returns 404 and structured JSON when requesting non-existent endpoint', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Resource not found: GET /api/does-not-exist',
    });
  });
});

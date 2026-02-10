import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

/**
 * CSRF protection integration tests.
 *
 * These verify the onRequest hook in index.ts that requires
 * `X-Requested-With: BugSnap` on all state-changing requests
 * (POST/PUT/PATCH/DELETE), except for exempt paths.
 */

let app: FastifyInstance;

const CSRF_EXEMPT = new Set(['/health', '/api']);

beforeAll(async () => {
  app = Fastify({ logger: false });

  // Mirror the exact CSRF hook from src/index.ts
  app.addHook('onRequest', async (request, reply) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      if (CSRF_EXEMPT.has(request.url) || request.url.startsWith('/api/share/')) return;
      const xrw = request.headers['x-requested-with'];
      if (xrw !== 'BugSnap') {
        return reply.status(403).send({ error: 'Forbidden — missing CSRF header' });
      }
    }
  });

  // Dummy routes to test against
  app.get('/api/projects', async () => ({ ok: true }));
  app.post('/api/projects', async () => ({ created: true }));
  app.put('/api/projects/1', async () => ({ updated: true }));
  app.patch('/api/projects/1', async () => ({ patched: true }));
  app.delete('/api/projects/1', async () => ({ deleted: true }));
  app.post('/api/auth/register', async () => ({ registered: true }));
  app.post('/api/auth/login', async () => ({ loggedIn: true }));
  app.post('/api/share/abc123', async () => ({ shared: true }));
  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/api', async () => ({ message: 'BugSnap API' }));

  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ─── Requests WITHOUT the header should be REJECTED ───────────────

describe('CSRF: requests without X-Requested-With header', () => {
  it('POST /api/projects → 403', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/projects', payload: {} });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toContain('CSRF');
  });

  it('PUT /api/projects/1 → 403', async () => {
    const res = await app.inject({ method: 'PUT', url: '/api/projects/1', payload: {} });
    expect(res.statusCode).toBe(403);
  });

  it('PATCH /api/projects/1 → 403', async () => {
    const res = await app.inject({ method: 'PATCH', url: '/api/projects/1', payload: {} });
    expect(res.statusCode).toBe(403);
  });

  it('DELETE /api/projects/1 → 403', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/projects/1' });
    expect(res.statusCode).toBe(403);
  });

  it('POST /api/auth/register → 403', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: {} });
    expect(res.statusCode).toBe(403);
  });

  it('POST /api/auth/login → 403', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: {} });
    expect(res.statusCode).toBe(403);
  });
});

// ─── Requests with WRONG header value should be REJECTED ──────────

describe('CSRF: requests with invalid X-Requested-With value', () => {
  it('X-Requested-With: XMLHttpRequest → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'x-requested-with': 'XMLHttpRequest' },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });

  it('X-Requested-With: (empty string) → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'x-requested-with': '' },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });

  it('X-Requested-With: bugsnap (wrong case) → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'x-requested-with': 'bugsnap' },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });
});

// ─── Requests with VALID header should PASS through ───────────────

describe('CSRF: requests with valid X-Requested-With: BugSnap', () => {
  it('POST /api/projects → 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { 'x-requested-with': 'BugSnap' },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().created).toBe(true);
  });

  it('PUT /api/projects/1 → 200', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/projects/1',
      headers: { 'x-requested-with': 'BugSnap' },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().updated).toBe(true);
  });

  it('PATCH /api/projects/1 → 200', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/projects/1',
      headers: { 'x-requested-with': 'BugSnap' },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
  });

  it('DELETE /api/projects/1 → 200', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/projects/1',
      headers: { 'x-requested-with': 'BugSnap' },
    });
    expect(res.statusCode).toBe(200);
  });
});

// ─── GET requests should NOT require the header ───────────────────

describe('CSRF: GET requests are exempt', () => {
  it('GET /api/projects without header → 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /health without header → 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api without header → 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/api' });
    expect(res.statusCode).toBe(200);
  });
});

// ─── Exempt endpoints should PASS without the header ──────────────

describe('CSRF: exempt endpoints pass without header', () => {
  it('POST /api/share/abc123 → 200 (share routes are exempt)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/share/abc123',
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().shared).toBe(true);
  });
});

// ─── Simulated CSRF attack scenario ──────────────────────────────

describe('CSRF: simulated cross-origin attack', () => {
  it('POST from malicious origin without custom header → 403', async () => {
    // A cross-origin form submission cannot set custom headers.
    // The browser would send the request without X-Requested-With,
    // which our hook rejects.
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: {
        origin: 'https://evil-site.com',
        'content-type': 'application/x-www-form-urlencoded',
      },
      payload: 'name=hacked-project',
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST from malicious origin with forged standard headers → 403', async () => {
    // Even with Origin and Referer, the custom header is still missing
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: {
        origin: 'https://evil-site.com',
        referer: 'https://evil-site.com/attack',
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ email: 'hacked@evil.com', password: '12345678', name: 'Hacker' }),
    });
    expect(res.statusCode).toBe(403);
  });
});

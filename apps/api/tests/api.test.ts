import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { createServices } from '../src/container.js';
import { createFakeClock, createFakeMailer, createInMemoryRepositories, testConfig } from './support/in-memory.js';

const EMAIL = 'meera@example.com';
const PASSWORD = 'Monsoon2026';

describe('HTTP API', () => {
  let app: FastifyInstance;
  let mail: ReturnType<typeof createFakeMailer>;

  beforeEach(async () => {
    mail = createFakeMailer();
    const services = createServices({
      config: testConfig,
      repositories: createInMemoryRepositories().repositories,
      mailer: mail.mailer,
      clock: createFakeClock(),
    });
    app = await buildApp({ services, rateLimitPerMinute: 1000 });
  });

  afterEach(() => app.close());

  const post = (url: string, payload: unknown, token?: string) =>
    app.inject({ method: 'POST', url, payload: payload as object, headers: token ? { authorization: `Bearer ${token}` } : {} });
  const put = (url: string, payload: unknown, token: string) =>
    app.inject({ method: 'PUT', url, payload: payload as object, headers: { authorization: `Bearer ${token}` } });
  const get = (url: string, token?: string) =>
    app.inject({ method: 'GET', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

  const signUp = async () => {
    await post('/api/auth/register', { email: EMAIL, password: PASSWORD });
    const verified = await post('/api/auth/verify-email', { email: EMAIL, code: mail.lastCodeFor(EMAIL) });
    return verified.json().token as string;
  };

  it('runs the whole onboarding journey', async () => {
    const registered = await post('/api/auth/register', { email: '  Meera@Example.com ', password: PASSWORD });
    expect(registered.statusCode).toBe(201);
    expect(registered.json()).toMatchObject({ email: EMAIL, verificationRequired: true, resendAvailableInSeconds: 30 });

    const verified = await post('/api/auth/verify-email', { email: EMAIL, code: mail.lastCodeFor(EMAIL) });
    expect(verified.statusCode).toBe(200);
    const token = verified.json().token as string;
    expect(verified.json().user).toMatchObject({ email: EMAIL, onboardingStep: 'profile', profileCompleted: false });

    const profile = await put(
      '/api/me/profile',
      { name: 'Meera Iyer', mobile: '98765 43210', address: 'Road No. 36, Jubilee Hills, Hyderabad 500033', businessName: '' },
      token,
    );
    expect(profile.statusCode).toBe(200);
    expect(profile.json().profile).toMatchObject({ mobile: '+919876543210', businessName: null });
    expect(profile.json().user.onboardingStep).toBe('tasks');

    const catalogue = await get('/api/tasks');
    const categories = catalogue.json().categories as { tasks: { id: string }[] }[];
    expect(categories.length).toBeGreaterThanOrEqual(4);
    expect(categories.flatMap((category) => category.tasks).length).toBeGreaterThanOrEqual(20);

    const saved = await put('/api/me/tasks', { taskIds: ['ac-repair', 'bank-work', 'ac-repair'] }, token);
    expect(saved.statusCode).toBe(200);
    expect(saved.json().tasks.map((task: { id: string }) => task.id)).toEqual(['ac-repair', 'bank-work']);

    const me = await get('/api/me', token);
    expect(me.json().user).toMatchObject({ onboardingStep: 'home', selectedTaskCount: 2 });

    const login = await post('/api/auth/login', { email: EMAIL, password: PASSWORD });
    expect(login.statusCode).toBe(200);
    expect(login.json().user.onboardingStep).toBe('home');

    const logout = await post('/api/auth/logout', {}, login.json().token);
    expect(logout.statusCode).toBe(204);
    expect((await get('/api/me', login.json().token)).statusCode).toBe(401);
  });

  it('returns field-level validation errors in one consistent shape', async () => {
    const response = await post('/api/auth/register', { email: 'not-an-email', password: 'short' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please fix the highlighted fields.',
        fields: {
          email: 'Enter a valid email address.',
          password: 'Password must be at least 8 characters.',
        },
      },
    });
  });

  it('reports a missing body as validation errors, not a crash', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/login' });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.fields).toMatchObject({ email: 'Email is required.', password: 'Password is required.' });
  });

  it('rejects malformed JSON clearly', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{"email":',
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_JSON');
  });

  it('sends unverified users back to verification on login', async () => {
    await post('/api/auth/register', { email: EMAIL, password: PASSWORD });
    const response = await post('/api/auth/login', { email: EMAIL, password: PASSWORD });
    expect(response.statusCode).toBe(403);
    expect(response.json().error).toMatchObject({ code: 'EMAIL_NOT_VERIFIED', details: { email: EMAIL } });
  });

  it('requires a valid token for /api/me routes', async () => {
    expect((await get('/api/me')).json().error.code).toBe('UNAUTHORIZED');
    expect((await get('/api/me', 'garbage')).statusCode).toBe(401);
  });

  it('validates the Indian mobile number and required profile fields', async () => {
    const token = await signUp();
    const response = await put('/api/me/profile', { name: '', mobile: '12345', address: 'short' }, token);
    expect(response.statusCode).toBe(400);
    expect(response.json().error.fields).toEqual({
      name: 'Name must be at least 2 characters.',
      mobile: 'Enter a valid 10-digit Indian mobile number.',
      address: 'Please enter your full address (at least 10 characters).',
    });
  });

  it('accepts common mobile formats and normalises them to +91', async () => {
    const token = await signUp();
    for (const mobile of ['+91 98765-43210', '09876543210', '919876543210']) {
      const response = await put('/api/me/profile', { name: 'Meera', mobile, address: 'Flat 4B, Banjara Hills, Hyderabad' }, token);
      expect(response.json().profile.mobile).toBe('+919876543210');
    }
  });

  it('rejects unknown and empty task selections', async () => {
    const token = await signUp();
    const unknown = await put('/api/me/tasks', { taskIds: ['ac-repair', 'teleportation'] }, token);
    expect(unknown.statusCode).toBe(400);
    expect(unknown.json().error.fields.taskIds).toBe('Unknown task: teleportation');

    const empty = await put('/api/me/tasks', { taskIds: [] }, token);
    expect(empty.json().error.fields.taskIds).toBe('Pick at least one task.');
  });

  it('explains a wrong OTP with the attempts left', async () => {
    await post('/api/auth/register', { email: EMAIL, password: PASSWORD });
    const wrong = mail.lastCodeFor(EMAIL) === '000000' ? '111111' : '000000';
    const response = await post('/api/auth/verify-email', { email: EMAIL, code: wrong });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatchObject({ code: 'OTP_INVALID', details: { attemptsRemaining: 4 } });
  });

  it('uses the same error shape for unknown routes', async () => {
    const response = await get('/api/nope');
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });
});

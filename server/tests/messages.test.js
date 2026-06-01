const request = require('supertest');
const app = require('../index');

// ---- Mock chain (same pattern as server.test.js) ----
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockNeq = jest.fn();
const mockOr = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

const mockSupabaseChain = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
  neq: mockNeq,
  or: mockOr,
  order: mockOrder,
  single: mockSingle,
  then(resolve) { return resolve({ data: null, error: null }); }
};

const mocks = [mockSelect, mockInsert, mockUpdate, mockEq, mockNeq, mockOr, mockOrder, mockSingle];

function setupChain() {
  mocks.forEach(m => m.mockReturnValue(mockSupabaseChain));
}
setupChain();

jest.mock('../config/supabaseClient', () => ({
  supabaseAdmin: { from: jest.fn(() => mockSupabaseChain) },
  supabase: { from: jest.fn(() => mockSupabaseChain) },
}));

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  req.supabase = require('../config/supabaseClient');
  next();
});

jest.mock('../utils/auditLogger', () => ({
  logAudit: jest.fn().mockResolvedValue(),
}));

describe('Messages API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Manually reset once-stacks + re-setup chain returns
    mocks.forEach(m => { m.mockReset(); m.mockReturnValue(mockSupabaseChain); });
    mockSupabaseChain.then = (resolve) => resolve({ data: null, error: null });
  });

  describe('GET /api/messages', () => {
    it('should fetch messages', async () => {
      mockSingle.mockResolvedValueOnce({ data: { rol: 'admin' }, error: null });
      mockOrder.mockResolvedValueOnce({ data: [{ id: 1, contenido: 'Hola' }], error: null });

      const res = await request(app).get('/api/messages');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ id: 1, contenido: 'Hola' }]);
    });

    it('should return 404 if profile not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const res = await request(app).get('/api/messages');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 500 on db error', async () => {
      mockSingle.mockResolvedValueOnce({ data: { rol: 'admin' }, error: null });
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });

      const res = await request(app).get('/api/messages');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/messages/users', () => {
    it('should fetch users', async () => {
      mockOrder.mockResolvedValueOnce({ data: [{ id: 'u2', nombre: 'Carlos' }], error: null });

      const res = await request(app).get('/api/messages/users');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ id: 'u2', nombre: 'Carlos' }]);
    });

    it('should return 500 on db error', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });

      const res = await request(app).get('/api/messages/users');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/messages', () => {
    it('should send a message', async () => {
      mockSingle
        .mockResolvedValueOnce({ data: { id: 'm1', remitente_id: 'uid' }, error: null })
        .mockResolvedValueOnce({ data: { nombre: 'Dest' }, error: null });

      const res = await request(app)
        .post('/api/messages')
        .send({ destinatario_id: 'u2', cuerpo: 'Hola' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id', 'm1');
    });

    it('should return 400 if content missing', async () => {
      const res = await request(app)
        .post('/api/messages')
        .send({ destinatario_id: 'u2' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 500 on db error', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Insert Error' } });

      const res = await request(app)
        .post('/api/messages')
        .send({ destinatario_id: 'u2', cuerpo: 'Hello' });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/messages/:id/read', () => {
    it('should mark as read', async () => {
      mockSelect.mockResolvedValueOnce({ data: [{ id: 'm1', leido: true }], error: null });

      const res = await request(app).post('/api/messages/m1/read');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ id: 'm1', leido: true }]);
    });

    it('should return 500 on db error', async () => {
      mockSelect.mockResolvedValueOnce({ data: null, error: { message: 'Update Error' } });

      const res = await request(app).post('/api/messages/m1/read');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/messages/unread-count', () => {
    it('should return unread count', async () => {
      mockSupabaseChain.then = (resolve) => resolve({ count: 5, error: null, data: [] });

      const res = await request(app).get('/api/messages/unread-count');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(5);
    });

    it('should return 0 when none unread', async () => {
      mockSupabaseChain.then = (resolve) => resolve({ count: 0, error: null, data: [] });

      const res = await request(app).get('/api/messages/unread-count');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(0);
    });

    it('should return 500 on db error', async () => {
      mockSupabaseChain.then = (resolve) => resolve({ count: null, error: { message: 'DB Error' }, data: [] });

      const res = await request(app).get('/api/messages/unread-count');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});

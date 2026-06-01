const request = require('supertest');
const app = require('../index');

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockIn = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockOrder = jest.fn();

const mockSupabaseChain = {
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  in: mockIn,
  gte: mockGte,
  lte: mockLte,
  order: mockOrder,
  then(resolve) { return resolve({ data: null, error: null }); }
};

const mocks = [mockSelect, mockEq, mockSingle, mockIn, mockGte, mockLte, mockOrder];

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

describe('Reports API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks.forEach(m => { m.mockReset(); m.mockReturnValue(mockSupabaseChain); });
    mockSupabaseChain.then = (resolve) => resolve({ data: null, error: null });
  });

  describe('GET /api/reports/dashboard-stats', () => {
    it('should return stats for admin', async () => {
      mockSingle.mockResolvedValueOnce({ data: { rol: 'admin' }, error: null });
      // Count queries resolve via then
      mockSupabaseChain.then = (resolve) => resolve({ count: 10, error: null, data: [] });

      const res = await request(app).get('/api/reports/dashboard-stats');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('studentCount');
    });

    it('should return 404 if profile not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const res = await request(app).get('/api/reports/dashboard-stats');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/reports/at-risk', () => {
    it('should return at-risk students for admin', async () => {
      mockSingle.mockResolvedValueOnce({ data: { rol: 'admin' }, error: null });
      // Attendance query resolves via then
      mockSupabaseChain.then = (resolve) => resolve({ data: [], error: null });

      const res = await request(app).get('/api/reports/at-risk');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 404 if profile not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const res = await request(app).get('/api/reports/at-risk');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});

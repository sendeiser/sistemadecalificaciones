const request = require('supertest');
const app = require('../index');

// Mock the Supabase client configuration
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpsert = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockOrder = jest.fn();

// Chainable mock implementation
const mockSupabaseChain = {
    select: mockSelect,
    insert: mockInsert,
    upsert: mockUpsert,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
};

// Make methods return the chain or a resolved value
mockSelect.mockReturnValue(mockSupabaseChain);
mockInsert.mockReturnValue(mockSupabaseChain);
mockUpsert.mockReturnValue(mockSupabaseChain);
mockEq.mockReturnValue(mockSupabaseChain);
mockOrder.mockReturnValue(mockSupabaseChain);
mockSingle.mockResolvedValue({ data: {}, error: null });

jest.mock('../config/supabaseClient', () => ({
    from: jest.fn(() => mockSupabaseChain),
    auth: {
        getUser: jest.fn(),
    }
}));

// Mock the middleware to bypass auth verification and inject dependencies
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    // Inject the mocked supabase client from config
    req.supabase = require('../config/supabaseClient');
    next();
});

describe('Backend API Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/health', () => {
        it('should return status ok', async () => {
            const res = await request(app).get('/api/health');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ status: 'ok' });
        });
    });

    describe('GET /api/grades', () => {
        it('should fetch grades', async () => {
            // Setup mock return
            const mockGrades = [{ id: 1, score: 10 }];
            mockOrder.mockResolvedValueOnce({ data: mockGrades, error: null });

            const res = await request(app).get('/api/grades');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockGrades);
            expect(require('../config/supabaseClient').from).toHaveBeenCalledWith('calificaciones');
        });

        it('should handle database errors', async () => {
            mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });

            const res = await request(app).get('/api/grades');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /api/grades', () => {
        it('should upsert a grade', async () => {
            const newGrade = {
                alumno_id: '1',
                asignacion_id: '1',
                parcial_1: 8
            };

            mockSingle.mockResolvedValueOnce({ data: { id: 1, ...newGrade }, error: null });

            const res = await request(app)
                .post('/api/grades')
                .send(newGrade);

            expect(res.statusCode).toEqual(200);
            expect(require('../config/supabaseClient').from).toHaveBeenCalledWith('calificaciones');
            expect(mockUpsert).toHaveBeenCalled();
        });

        it('should return 400 if missing required fields', async () => {
            const res = await request(app)
                .post('/api/grades')
                .send({ parcial_1: 8 }); // Missing IDs

            expect(res.statusCode).toEqual(400);
        });
    });
});

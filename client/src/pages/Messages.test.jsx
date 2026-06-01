import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Messages from './Messages';

const mockNavigate = vi.fn();
let mockSessionResolve;

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve(mockSessionResolve?.())
      ),
    },
  },
}));

vi.mock('../utils/api', () => ({
  getApiEndpoint: vi.fn((path) => `http://localhost:5000/api${path}`),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const { useAuth } = await import('../context/AuthContext');

function createDefaultMocks() {
  mockSessionResolve = () => ({
    data: { session: { access_token: 'test-token', user: { id: 'user-1' } } },
    error: null,
  });
}

describe('Messages Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    createDefaultMocks();

    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', nombre: 'Test User', rol: 'admin' },
    });

    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('shows loading skeleton on mount', () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<Messages />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the page title', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<Messages />);
    expect(await screen.findByText(/Mensajería Interna/i)).toBeDefined();
  });

  it('shows empty state when no messages', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<Messages />);
    const emptyMessage = await screen.findByText(/No hay mensajes/i);
    expect(emptyMessage).toBeDefined();
  });

  it('renders received messages', async () => {
    const mockMessages = [
      {
        id: 1,
        remitente_id: 'user-2',
        remitente: { nombre: 'Carlos', rol: 'docente' },
        destinatario_id: 'user-1',
        destinatario: { nombre: 'Test User', rol: 'admin' },
        contenido: 'Hola, este es un mensaje de prueba',
        leido: false,
        tipo: 'privado',
        created_at: '2026-04-01T10:00:00Z',
      },
    ];

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<Messages />);
    expect(await screen.findByText(/Carlos/i)).toBeDefined();
    expect(await screen.findByText(/mensaje de prueba/i)).toBeDefined();
  });

  it('shows user role badge in received messages', async () => {
    const mockMessages = [
      {
        id: 1,
        remitente_id: 'user-2',
        remitente: { nombre: 'Carlos', rol: 'docente' },
        destinatario_id: 'user-1',
        destinatario: { nombre: 'Test User', rol: 'admin' },
        contenido: 'Mensaje con badge',
        leido: false,
        tipo: 'privado',
        created_at: '2026-04-01T10:00:00Z',
      },
    ];

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<Messages />);
    const roleBadge = await screen.findByText(/docente/i);
    expect(roleBadge).toBeDefined();
  });

  it('can switch between Recibidos and Enviados tabs', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<Messages />);
    const enviadosTab = await screen.findByText(/Enviados/i);
    fireEvent.click(enviadosTab);
    expect(enviadosTab.closest('button').className).toContain('bg-tech-cyan');

    const recibidosTab = screen.getByText(/Recibidos/i);
    fireEvent.click(recibidosTab);
    expect(recibidosTab.closest('button').className).toContain('bg-tech-cyan');
  });

  it('shows compose message panel', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<Messages />);
    expect(await screen.findByText(/Nuevo Mensaje/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Escribe algo importante/i)).toBeDefined();
    expect(screen.getByText(/Enviar Mensaje/i)).toBeDefined();
  });

  it('disables send button when no message or recipient', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<Messages />);
    const sendBtn = await screen.findByText(/Enviar Mensaje/i);
    expect(sendBtn.closest('button').disabled).toBe(true);
  });

  it('displays security communication note', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<Messages />);
    expect(await screen.findByText(/Comunicación Segura/i)).toBeDefined();
    expect(screen.getByText(/Los mensajes son privados/i)).toBeDefined();
  });

  it('shows user search input for recipient selection', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'user-2', nombre: 'María Preceptora', rol: 'preceptor' },
      ]),
    });

    render(<Messages />);
    const searchInput = await screen.findByPlaceholderText(/Buscar usuario/i);
    expect(searchInput).toBeDefined();
  });

  it('filters users when typing in search', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 'user-2', nombre: 'María Preceptora', rol: 'preceptor' },
          { id: 'user-3', nombre: 'Carlos Docente', rol: 'docente' },
        ]),
      });

    render(<Messages />);
    const searchInput = await screen.findByPlaceholderText(/Buscar usuario/i);
    fireEvent.change(searchInput, { target: { value: 'María' } });

    const maria = await screen.findByText(/María Preceptora/i);
    expect(maria).toBeDefined();
  });

  it('marks unread messages as read when viewing received tab', async () => {
    const mockMessages = [
      {
        id: 1,
        remitente_id: 'user-2',
        remitente: { nombre: 'Carlos', rol: 'docente' },
        destinatario_id: 'user-1',
        destinatario: { nombre: 'Test User', rol: 'admin' },
        contenido: 'Marcar como leído',
        leido: false,
        tipo: 'privado',
        created_at: '2026-04-01T10:00:00Z',
      },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    global.fetch = fetchMock;

    render(<Messages />);
    await screen.findByText(/Marcar como leído/i);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/messages/1/read'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('navigates back to dashboard when back button is clicked', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<Messages />);
    const backButton = await screen.findByTitle(/Volver al Dashboard/i);
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});

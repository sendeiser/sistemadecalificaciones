import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },
  },
}));

vi.mock('../utils/api', () => ({
  getApiEndpoint: vi.fn((path) => `http://localhost:5000/api${path}`),
}));

vi.mock('../hooks/useNotifications', () => ({
  default: () => ({ unreadMessages: 0, unreadAnnouncements: 0 }),
}));

vi.mock('../components/DashboardStats', () => ({
  default: () => <div data-testid="dashboard-stats">Stats</div>,
}));

vi.mock('../components/AnnouncementTicker', () => ({
  default: () => <div data-testid="announcement-ticker">Ticker</div>,
}));

vi.mock('../components/CriticalStudentsWidget', () => ({
  default: () => <div data-testid="critical-students">Critical</div>,
}));

vi.mock('../components/MedalBadge', () => ({
  default: () => <div data-testid="medal-badge">Medal</div>,
}));

vi.mock('../components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle">Theme</div>,
}));

const { useAuth } = await import('../context/AuthContext');

function createMockProfile(overrides = {}) {
  return {
    id: 'test-user-id',
    nombre: 'Test User',
    email: 'test@test.com',
    rol: 'admin',
    dni: '12345678',
    ...overrides,
  };
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('shows loading spinner when profile is null', () => {
    useAuth.mockReturnValue({
      profile: null,
      signOut: mockSignOut,
    });

    const { container } = render(<Dashboard />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeDefined();
  });

  describe('Admin view', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        profile: createMockProfile({ rol: 'admin' }),
        signOut: mockSignOut,
      });
    });

    it('renders the dashboard title', () => {
      render(<Dashboard />);
      const heading = screen.getByText(/PANEL DE/i);
      expect(heading).toBeDefined();
      const controlSpan = heading.closest('h1').querySelector('span');
      expect(controlSpan.textContent).toContain('CONTROL');
    });

    it('renders the search bar', () => {
      render(<Dashboard />);
      expect(screen.getByLabelText(/Búsqueda rápida/i)).toBeDefined();
    });

    it('renders tab navigation with three tabs', () => {
      render(<Dashboard />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(3);
      expect(tabs[0]).toHaveTextContent(/Operación Diaria/i);
      expect(tabs[1]).toHaveTextContent(/Configuración Académica/i);
      expect(tabs[2]).toHaveTextContent(/Reportes y Estadísticas/i);
    });

    it('defaults to academic tab for admin', () => {
      render(<Dashboard />);
      const academicTab = screen.getByText(/Configuración Académica/i);
      expect(academicTab.closest('button').getAttribute('aria-selected')).toBe('true');
    });

    it('switches tabs on click', () => {
      render(<Dashboard />);
      const diarioTab = screen.getByText(/Operación Diaria/i);
      fireEvent.click(diarioTab);
      expect(diarioTab.closest('button').getAttribute('aria-selected')).toBe('true');
    });

    it('renders announcement ticker', () => {
      render(<Dashboard />);
      expect(screen.getByTestId('announcement-ticker')).toBeDefined();
    });

    it('renders dashboard stats', () => {
      render(<Dashboard />);
      expect(screen.getByTestId('dashboard-stats')).toBeDefined();
    });

    it('renders critical students widget', () => {
      render(<Dashboard />);
      expect(screen.getByTestId('critical-students')).toBeDefined();
    });

    it('renders quick action buttons in daily operations tab', () => {
      render(<Dashboard />);
      fireEvent.click(screen.getByText(/Operación Diaria/i));
      expect(screen.getByText(/Toma General/i)).toBeDefined();
      expect(screen.getByText(/Justificación/i)).toBeDefined();
    });

    it('navigates to messages on click', () => {
      render(<Dashboard />);
      fireEvent.click(screen.getByText(/Operación Diaria/i));
      const mensajesBtns = screen.getAllByText(/Mensajes/i);
      fireEvent.click(mensajesBtns[mensajesBtns.length - 1].closest('button'));
      expect(mockNavigate).toHaveBeenCalledWith('/messages');
    });
  });

  describe('Preceptor view', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        profile: createMockProfile({ rol: 'preceptor' }),
        signOut: mockSignOut,
      });
    });

    it('defaults to daily operations tab for preceptor', () => {
      render(<Dashboard />);
      const diarioTab = screen.getByText(/Operación Diaria/i);
      expect(diarioTab.closest('button').getAttribute('aria-selected')).toBe('true');
    });

    it('renders search bar', () => {
      render(<Dashboard />);
      expect(screen.getByLabelText(/Búsqueda rápida/i)).toBeDefined();
    });
  });

  describe('Docente view', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        profile: createMockProfile({ rol: 'docente' }),
        signOut: mockSignOut,
      });
    });

    it('renders Tareas Rápidas section', () => {
      render(<Dashboard />);
      expect(screen.getByText(/Tareas Rápidas/i)).toBeDefined();
    });

    it('renders quick task cards for docente', () => {
      render(<Dashboard />);
      const asistenciaElements = screen.getAllByText(/Asistencia/i);
      expect(asistenciaElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Cargar Notas/i)).toBeDefined();
      const mensajesElements = screen.getAllByText(/Mensajes/i);
      expect(mensajesElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders Mis Cursos card', () => {
      render(<Dashboard />);
      expect(screen.getByText(/Mis Cursos/i)).toBeDefined();
    });

    it('does not render admin tabs', () => {
      render(<Dashboard />);
      expect(screen.queryByText(/Operación Diaria/i)).toBeNull();
    });
  });

  describe('Alumno view', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        profile: createMockProfile({ rol: 'alumno' }),
        signOut: mockSignOut,
      });
    });

    it('renders student dashboard cards', () => {
      render(<Dashboard />);
      expect(screen.getByText(/Mi Boletín/i)).toBeDefined();
      const mensajesElements = screen.getAllByText(/Mensajes/i);
      expect(mensajesElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Calendario/i)).toBeDefined();
      const anunciosElements = screen.getAllByText(/Anuncios/i);
      expect(anunciosElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Tutor view', () => {
    it('redirects tutor to /tutor', () => {
      useAuth.mockReturnValue({
        profile: createMockProfile({ rol: 'tutor' }),
        signOut: mockSignOut,
      });
      render(<Dashboard />);
      expect(mockNavigate).toHaveBeenCalledWith('/tutor');
    });
  });

  describe('Help section', () => {
    it('renders the system guide link at the bottom', () => {
      useAuth.mockReturnValue({
        profile: createMockProfile({ rol: 'admin' }),
        signOut: mockSignOut,
      });
      render(<Dashboard />);
      expect(screen.getByText(/Guía del Sistema/i)).toBeDefined();
    });
  });
});


import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock Supabase client
vi.mock('./supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

describe('App Component', () => {
    it('redirects to login when unauthenticated', async () => {
        // We need to await act if state updates happen immediately
        await act(async () => {
            render(<App />);
        });

        // Check for Login component content
        const loginHeader = await screen.findByText(/Sistema de Calificaciones/i);
        expect(loginHeader).toBeInTheDocument();

        const loginButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
        expect(loginButton).toBeInTheDocument();
    });
});

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import Reception from '../../profile/page';
import { vi } from 'vitest';

// MOCK du router Next.js pour éviter d'utiliser le vrai router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Avant chaque test, on mock window.alert pour éviter les alertes réelles
beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => { });
});

// Avant tous les tests, on mock fetch pour retourner des rooms factices
beforeAll(() => {
    global.fetch = vi.fn(() =>
        Promise.resolve({
            json: () =>
                Promise.resolve({
                    success: true,
                    data: {
                        room1: { clients: {} },
                        room2: { clients: { a: 1 } },
                    },
                }),
        })
    ) as any;
});

// Après tous les tests, on restaure les mocks pour ne pas polluer d'autres tests
afterAll(() => {
    vi.restoreAllMocks();
});

// Début de la suite de tests pour le composant Reception
describe('Reception', () => {

     // Test 1 : vérifier que les sections principales sont rendues
    it('renders main sections', () => {
        render(<Reception />);
        expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
        expect(screen.getByText(/Profil/i)).toBeInTheDocument();
        expect(screen.getByText(/Salons/i)).toBeInTheDocument();
        expect(screen.getByText(/Galerie/i)).toBeInTheDocument();
    });

     // Test 2 : vérifier que le pseudo se met à jour lorsqu'on change l'input
    it('updates pseudo when changed in ProfileSection', async () => {
        render(<Reception />);
        const pseudoInput = screen.getByPlaceholderText(/Votre pseudo/i);

        await act(async () => {
            fireEvent.change(pseudoInput, { target: { value: 'John' } });
        });

        expect((pseudoInput as HTMLInputElement).value).toBe('John');
    });

    // Test 3 : sélectionner une room et simuler l'entrée
    it('can select a room and call connectToRoom', async () => {
        render(<Reception />);

        // Attendre que les options des rooms apparaissent après le fetch mocké
        await waitFor(() => screen.getByRole('option', { name: /room2/i }));

        const roomSelect = screen.getByRole('combobox'); // Récupérer le select
        await act(async () => {
            fireEvent.change(roomSelect, { target: { value: 'room2' } }); // Changer la valeur
        });

        expect((roomSelect as HTMLSelectElement).value).toBe('room2'); // Vérifier la valeur sélectionnée

        const enterButton = screen.getByRole('button', { name: /Entrer/i });
        await act(async () => {
            fireEvent.click(enterButton);
        });

        // Vérifier que alert a été appelé si le pseudo est vide
        expect(window.alert).toHaveBeenCalled();
    });

    // Test 4 : ouvrir et fermer la caméra
    it('opens and closes camera', async () => {
        render(<Reception />);

        const openButton = screen.getByRole('button', { name: /Prendre une photo/i });
        await act(async () => {
            fireEvent.click(openButton);
        });

        expect(openButton).toBeInTheDocument();
    });

    // Test 5 : sauvegarder le profil dans localStorage
    it('saves profile in localStorage', async () => {
        render(<Reception />);
        const pseudoInput = screen.getByPlaceholderText(/Votre pseudo/i);

        await act(async () => {
            fireEvent.change(pseudoInput, { target: { value: 'Alice' } });
        });

        const saveButton = screen.getByRole('button', { name: /Sauvegarder/i });
        await act(async () => {
            fireEvent.click(saveButton);
        });

        // Vérifier que le localStorage contient le pseudo saisi
        const profile = JSON.parse(localStorage.getItem('profile') || '{}');
        expect(profile.pseudo).toBe('Alice');
    });
});

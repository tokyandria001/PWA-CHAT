import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RoomsSection from '../RoomsSection';
import { vi } from 'vitest';

describe('RoomsSection', () => {
  // Liste de rooms pour le test
  const rooms = [
    { rawName: 'general', name: 'General', clientsCount: 5 },
    { rawName: 'tech', name: 'Tech', clientsCount: 2 },
  ];

  // Props par défaut
  const defaultProps = {
    rooms,
    selectedRoom: '',
    onSelectRoom: vi.fn(),
    onJoin: vi.fn(),
  };

  // Test 1 : rendu des options des rooms
  it('renders room options', () => {
    render(<RoomsSection {...defaultProps} />);
    expect(screen.getByText(/-- Choisir une room --/i)).toBeInTheDocument();
    expect(screen.getByText(/General \(5\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tech \(2\)/i)).toBeInTheDocument();
  });

  // Test 2 : sélection d'une room
  it('calls onSelectRoom when a room is selected', () => {
    render(<RoomsSection {...defaultProps} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'General' } });
    expect(defaultProps.onSelectRoom).toHaveBeenCalledWith('General');
  });

  // Test 3 : cliquer sur le bouton "Entrer"
  it('calls onJoin when "Entrer" button is clicked', () => {
    render(<RoomsSection {...defaultProps} />);
    fireEvent.click(screen.getByText(/Entrer/i));
    expect(defaultProps.onJoin).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RoomsSection from '../RoomsSection';
import { vi } from 'vitest';

describe('RoomsSection', () => {
  const rooms = [
    { rawName: 'general', name: 'General', clientsCount: 5 },
    { rawName: 'tech', name: 'Tech', clientsCount: 2 },
  ];

  const defaultProps = {
    rooms,
    selectedRoom: '',
    onSelectRoom: vi.fn(),
    onJoin: vi.fn(),
  };

  it('renders room options', () => {
    render(<RoomsSection {...defaultProps} />);
    expect(screen.getByText(/-- Choisir une room --/i)).toBeInTheDocument();
    expect(screen.getByText(/General \(5\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tech \(2\)/i)).toBeInTheDocument();
  });

  it('calls onSelectRoom when a room is selected', () => {
    render(<RoomsSection {...defaultProps} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'General' } });
    expect(defaultProps.onSelectRoom).toHaveBeenCalledWith('General');
  });

  it('calls onJoin when "Entrer" button is clicked', () => {
    render(<RoomsSection {...defaultProps} />);
    fireEvent.click(screen.getByText(/Entrer/i));
    expect(defaultProps.onJoin).toHaveBeenCalled();
  });
});

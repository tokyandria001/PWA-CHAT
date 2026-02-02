import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileSection from '../ProfileSection';
import { vi } from 'vitest';

describe('ProfileSection', () => {
  const defaultProps = {
    pseudo: 'John',
    photo: 'photo.png',
    onPseudoChange: vi.fn(),
    onImportImage: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders profile section and photo', () => {
    render(<ProfileSection {...defaultProps} />);
    expect(screen.getByText(/Profil/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Avatar/i)).toBeInTheDocument();
  });

  it('calls onPseudoChange when pseudo input changes', () => {
    render(<ProfileSection {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Votre pseudo/i), { target: { value: 'Jane' } });
    expect(defaultProps.onPseudoChange).toHaveBeenCalledWith('Jane');
  });

  it('calls onImportImage when file input changes', () => {
    render(<ProfileSection {...defaultProps} />);
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });
    expect(defaultProps.onImportImage).toHaveBeenCalled();
  });

  it('calls onSave when "Sauvegarder" button clicked', () => {
    render(<ProfileSection {...defaultProps} />);
    fireEvent.click(screen.getByText(/Sauvegarder/i));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GallerySection from '../GallerySection';
import { vi } from 'vitest';

describe('GallerySection', () => {
  const defaultProps = {
    photos: ['photo1.png', 'photo2.png'],
    activePhoto: 'photo1.png',
    isCameraOpen: false,
    preview: null,
    videoRef: { current: null },
    onOpenCamera: vi.fn(),
    onCloseCamera: vi.fn(),
    onTakePhoto: vi.fn(),
    onSavePhoto: vi.fn(),
    onSelectPhoto: vi.fn(),
  };

  // Test 1 : rendu du titre et des photos
  it('renders the gallery title and photos', () => {
    render(<GallerySection {...defaultProps} />);
    expect(screen.getByText(/Galerie/i)).toBeInTheDocument();
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(defaultProps.photos.length);
  });

  // Test 2 : ouverture de la caméra
  it('calls onOpenCamera when "Prendre une photo" is clicked', () => {
    render(<GallerySection {...defaultProps} />);
    fireEvent.click(screen.getByText(/Prendre une photo/i));
    expect(defaultProps.onOpenCamera).toHaveBeenCalled();
  });

  // Test 3 : sélection d'une photo
  it('calls onSelectPhoto when a photo is clicked', () => {
    render(<GallerySection {...defaultProps} />);
    const firstPhoto = screen.getAllByRole('img')[0];
    fireEvent.click(firstPhoto);
    expect(defaultProps.onSelectPhoto).toHaveBeenCalledWith('photo1.png');
  });

  // Test 4 : rendu des contrôles caméra si caméra ouverte
  it('renders camera controls when isCameraOpen is true', () => {
    render(<GallerySection {...defaultProps} isCameraOpen={true} />);
    expect(screen.getByText(/Capturer/i)).toBeInTheDocument();
    expect(screen.getByText(/Annuler/i)).toBeInTheDocument();
  });

  // Test 5 : rendu de l'aperçu et bouton "Utiliser"
  it('renders preview and "Utiliser" button when preview is set', () => {
    render(<GallerySection {...defaultProps} isCameraOpen={true} preview="preview.png" />);
    expect(screen.getByAltText(/Aperçu/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Utiliser/i));
    expect(defaultProps.onSavePhoto).toHaveBeenCalled();
  });
});

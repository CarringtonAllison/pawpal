import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListingTypeBadge } from '../../components/results/ListingTypeBadge.js';

describe('ListingTypeBadge', () => {
  it('renders "Rescue / Adopt" for rescue listing type', () => {
    render(<ListingTypeBadge listingType="rescue" />);
    expect(screen.getByText('Rescue / Adopt')).toBeInTheDocument();
  });

  it('renders "Foster" for foster listing type', () => {
    render(<ListingTypeBadge listingType="foster" />);
    expect(screen.getByText('Foster')).toBeInTheDocument();
  });

  it('renders "Breeder" for breeder listing type', () => {
    render(<ListingTypeBadge listingType="breeder" />);
    expect(screen.getByText('Breeder')).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<ListingTypeBadge listingType="rescue" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label describing listing type', () => {
    render(<ListingTypeBadge listingType="foster" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Listing type: Foster');
  });

  it('applies teal classes for rescue', () => {
    render(<ListingTypeBadge listingType="rescue" />);
    const badge = screen.getByRole('status');
    expect(badge.className).toContain('bg-teal-100');
  });

  it('applies amber classes for foster', () => {
    render(<ListingTypeBadge listingType="foster" />);
    const badge = screen.getByRole('status');
    expect(badge.className).toContain('bg-amber-100');
  });

  it('applies indigo classes for breeder', () => {
    render(<ListingTypeBadge listingType="breeder" />);
    const badge = screen.getByRole('status');
    expect(badge.className).toContain('bg-indigo-100');
  });
});

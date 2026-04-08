import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchBadge } from '../../components/results/MatchBadge.js';

describe('MatchBadge', () => {
  it('displays the score percentage', () => {
    render(<MatchBadge score={85} />);
    expect(screen.getByText('85% Match')).toBeInTheDocument();
  });

  it('uses green color for score >= 80', () => {
    const { container } = render(<MatchBadge score={90} />);
    const bar = container.querySelector('[style*="width"]');
    expect(bar?.className).toContain('bg-green-500');
  });

  it('uses amber color for score 60-79', () => {
    const { container } = render(<MatchBadge score={70} />);
    const bar = container.querySelector('[style*="width"]');
    expect(bar?.className).toContain('bg-amber-500');
  });

  it('uses gray color for score < 60', () => {
    const { container } = render(<MatchBadge score={45} />);
    const bar = container.querySelector('[style*="width"]');
    expect(bar?.className).toContain('bg-gray-400');
  });
});

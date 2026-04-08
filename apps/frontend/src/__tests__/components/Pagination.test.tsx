import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../../components/results/Pagination.js';

describe('Pagination', () => {
  it('renders nothing for single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders page numbers for small page count', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);
    const btn = screen.getByText('2');
    expect(btn.className).toContain('bg-teal-600');
  });

  it('calls onPageChange when page button is clicked', async () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onChange} />);
    await userEvent.click(screen.getByText('2'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('disables prev button on first page', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText('← Prev')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText('Next →')).toBeDisabled();
  });

  it('calls onPageChange with next page on Next click', async () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onChange} />);
    await userEvent.click(screen.getByText('Next →'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with prev page on Prev click', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onPageChange={onChange} />);
    await userEvent.click(screen.getByText('← Prev'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

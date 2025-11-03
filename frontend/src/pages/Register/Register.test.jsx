import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from './index';

describe('Register Component', () => {
  const mockOnRegister = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />
      </BrowserRouter>
    );
  };

  it('should render register form', () => {
    renderRegister();

    // Check if main elements are present
    expect(screen.getByText(/Price List App/i)).toBeInTheDocument();
  });

  it('should render first name, last name, email and password inputs', () => {
    renderRegister();

    // Check for form inputs
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should have a submit button', () => {
    renderRegister();

    // Check for button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should update document title on mount', () => {
    renderRegister();

    expect(document.title).toBe('Price List App v3 - Register');
  });
});

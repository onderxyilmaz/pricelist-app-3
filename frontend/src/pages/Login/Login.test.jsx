import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './index';

describe('Login Component', () => {
  const mockOnLogin = vi.fn();
  const mockOnSwitchToRegister = vi.fn();

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderLogin();

    // Check if main elements are present
    expect(screen.getByText(/Price List App/i)).toBeInTheDocument();
  });

  it('should render email and password inputs', () => {
    renderLogin();

    // Check for form inputs
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should have a submit button', () => {
    renderLogin();

    // Check for button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should update document title on mount', () => {
    renderLogin();

    expect(document.title).toBe('Price List App v3 - Login');
  });
});

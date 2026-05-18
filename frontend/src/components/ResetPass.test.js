import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ResetPass, { ResetPasswordModal } from '../components/ResetPass';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockPost = jest.fn();
let mockAuthState = {
  auth: {
    user: { email: 'aya@example.com' },
  },
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (...args) => mockPost(...args),
  },
}));

jest.mock('bootstrap/dist/css/bootstrap.min.css', () => ({}));
jest.mock('../image/logo2.png', () => 'logo2.png');

jest.mock('../store/authSlice', () => ({
  logout: jest.fn(() => ({ type: 'auth/logout' })),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockAuthState),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ResetPass />
    </MemoryRouter>
  );

const renderModal = (props = {}) =>
  render(
    <MemoryRouter>
      <ResetPasswordModal isOpen={true} toggle={jest.fn()} {...props} />
    </MemoryRouter>
  );

describe('ResetPass page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.setItem('token', 'test-token');
    mockAuthState = {
      auth: {
        user: { email: 'aya@example.com' },
      },
    };
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    localStorage.clear();
  });

  it('redirects to home when there is no logged-in user', () => {
    mockAuthState = { auth: { user: null } };

    renderPage();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows required fields validation', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText(/all fields are required/i)).toBeInTheDocument();
  });

  it('shows strong password validation message', async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/current password/i), {
      target: { value: 'Current123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^new password$/i), {
      target: { value: 'weak' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: 'weak' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows mismatch error when confirmation does not match', async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/current password/i), {
      target: { value: 'Current123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^new password$/i), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: 'Different123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText(/new passwords do not match/i)).toBeInTheDocument();
  });

  it('submits valid password change and logs out user', async () => {
    const { logout } = require('../store/authSlice');
    mockPost.mockResolvedValueOnce({ data: { success: true } });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/current password/i), {
      target: { value: 'Current123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^new password$/i), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: 'NewPassword123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        'http://localhost:5000/auth/change-password',
        {
          currentPassword: 'Current123!',
          newPassword: 'NewPassword123!',
        },
        {
          headers: { Authorization: 'Bearer test-token' },
        }
      );
      expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(logout).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows server error when API request fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/current password/i), {
      target: { value: 'Current123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^new password$/i), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: 'NewPassword123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText(/server error changing password/i)).toBeInTheDocument();
  });
});

describe('ResetPasswordModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.setItem('token', 'test-token');
    mockAuthState = {
      auth: {
        user: { email: 'aya@example.com' },
      },
    };
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    localStorage.clear();
  });

  it('renders modal fields when open', () => {
    renderModal();

    expect(screen.getByText(/logged in as/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm new password/i)).toBeInTheDocument();
  });

  it('closes and redirects after successful password change', async () => {
    const { logout } = require('../store/authSlice');
    const toggle = jest.fn();
    mockPost.mockResolvedValueOnce({ data: { success: true } });

    renderModal({ toggle });

    fireEvent.change(screen.getByPlaceholderText(/current password/i), {
      target: { value: 'Current123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^new password$/i), {
      target: { value: 'NewPassword123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: 'NewPassword123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(logout).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
    expect(toggle).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});

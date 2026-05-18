import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (...args) => mockPost(...args),
  },
}));

jest.mock('bootstrap/dist/css/bootstrap.min.css', () => ({}));
jest.mock('../components/authElegant.css', () => ({}), { virtual: true });
jest.mock('./authElegant.css', () => ({}), { virtual: true });
jest.mock('../image/logo2.png', () => 'logo2.png');
jest.mock('../image/auth.png', () => 'auth.png');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import Forgetpass from '../components/Forgetpass';

const renderComponent = () =>
  render(
    <MemoryRouter>
      <Forgetpass />
    </MemoryRouter>
  );

describe('Forgetpass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders email step by default', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /forget password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your registered email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send confirmation code/i })).toBeInTheDocument();
  });

  it('moves to code step after successful email submission', async () => {
    mockPost.mockResolvedValueOnce({ data: { msg: 'Confirmation code sent.' } });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter your registered email/i), {
      target: { value: 'aya@example.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send confirmation code/i }));
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        'http://localhost:5000/auth/forgot-password',
        { email: 'aya@example.com' }
      );
    });

    expect(screen.getByRole('heading', { name: /enter confirmation code/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter confirmation code/i)).toBeInTheDocument();
    expect(screen.getByText(/we sent a confirmation code to/i)).toBeInTheDocument();
  });

  it('shows API error when sending confirmation code fails', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { msg: 'Email does not exist' } },
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter your registered email/i), {
      target: { value: 'missing@example.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send confirmation code/i }));
    });

    expect(await screen.findByText(/email does not exist/i)).toBeInTheDocument();
  });

  it('shows validation error when confirmation code is blank', async () => {
    mockPost.mockResolvedValueOnce({ data: { msg: 'Code sent.' } });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter your registered email/i), {
      target: { value: 'aya@example.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send confirmation code/i }));
    });

    await screen.findByRole('heading', { name: /enter confirmation code/i });

    fireEvent.change(screen.getByPlaceholderText(/enter confirmation code/i), {
      target: { value: '   ' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
    });

    expect(await screen.findByText(/please enter the confirmation code\./i)).toBeInTheDocument();
  });

  it('moves to password step after successful code verification', async () => {
    mockPost
      .mockResolvedValueOnce({ data: { msg: 'Code sent.' } })
      .mockResolvedValueOnce({ data: { success: true } });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter your registered email/i), {
      target: { value: 'aya@example.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send confirmation code/i }));
    });

    await screen.findByRole('heading', { name: /enter confirmation code/i });

    fireEvent.change(screen.getByPlaceholderText(/enter confirmation code/i), {
      target: { value: '123456' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
    });

    await waitFor(() => {
      expect(mockPost).toHaveBeenLastCalledWith(
        'http://localhost:5000/auth/verify-code',
        { email: 'aya@example.com', code: '123456' }
      );
    });

    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm new password/i)).toBeInTheDocument();
  });

  it('shows error when new passwords do not match', async () => {
    mockPost
      .mockResolvedValueOnce({ data: { msg: 'Code sent.' } })
      .mockResolvedValueOnce({ data: { success: true } });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter your registered email/i), {
      target: { value: 'aya@example.com' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send confirmation code/i }));
    });

    await screen.findByRole('heading', { name: /enter confirmation code/i });

    fireEvent.change(screen.getByPlaceholderText(/enter confirmation code/i), {
      target: { value: '123456' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
    });

    await screen.findByRole('heading', { name: /set new password/i });

    fireEvent.change(screen.getByPlaceholderText(/^new password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: 'Different123!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    });

    expect(await screen.findByText(/new passwords do not match\./i)).toBeInTheDocument();
  });

  it('resets password and redirects normal users to /login', async () => {
    mockPost
      .mockResolvedValueOnce({ data: { msg: 'Code sent.' } })
      .mockResolvedValueOnce({ data: { success: true } })
      .mockResolvedValueOnce({ data: { success: true, role: 'innovator' } });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter your registered email/i), {
      target: { value: 'aya@example.com' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send confirmation code/i }));
    });

    await screen.findByRole('heading', { name: /enter confirmation code/i });

    fireEvent.change(screen.getByPlaceholderText(/enter confirmation code/i), {
      target: { value: '123456' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
    });

    await screen.findByRole('heading', { name: /set new password/i });

    fireEvent.change(screen.getByPlaceholderText(/^new password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: 'Password123!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    });

    expect(await screen.findByText(/password changed successfully/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

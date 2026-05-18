
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Login from '../components/Login';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockUnwrap = jest.fn();

jest.mock('bootstrap/dist/css/bootstrap.min.css', () => ({}));
jest.mock('../components/authElegant.css', () => ({}), { virtual: true });
jest.mock('./authElegant.css', () => ({}), { virtual: true });
jest.mock('../image/logo2.png', () => 'logo2.png');
jest.mock('../image/auth.png', () => 'auth.png');

jest.mock('../store/authSlice', () => ({
  login: jest.fn((payload) => ({ type: 'auth/login', payload })),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector({ auth: { status: 'idle', error: '' } }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderComponent = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockReturnValue({ unwrap: mockUnwrap });
  });

  it('renders login form fields and links', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forget password\?/i })).toBeInTheDocument();
  });

  it('dispatches login with entered credentials', async () => {
    mockUnwrap.mockResolvedValue({ role: 'innovator' });
    const { login } = require('../store/authSlice');

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'aya@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'aya@example.com',
        password: 'Password123!',
      });
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  it('navigates admin users to admin page after successful login', async () => {
    mockUnwrap.mockResolvedValue({ role: 'admin' });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('navigates reviewer users to reviewer page after successful login', async () => {
    mockUnwrap.mockResolvedValue({ role: 'reviewer' });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'reviewer@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reviewer');
    });
  });

  it('does not navigate when login fails', async () => {
    mockUnwrap.mockRejectedValue(new Error('Invalid credentials'));

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

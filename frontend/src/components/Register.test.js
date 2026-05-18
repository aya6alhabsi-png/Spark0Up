import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Register from '../components/Register';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockUnwrap = jest.fn();
const mockValidate = jest.fn();

jest.mock('bootstrap/dist/css/bootstrap.min.css', () => ({}));
jest.mock('../components/authElegant.css', () => ({}), { virtual: true });
jest.mock('./authElegant.css', () => ({}), { virtual: true });
jest.mock('../image/logo2.png', () => 'logo2.png');
jest.mock('../image/auth.png', () => 'auth.png');

jest.mock('../validation/regFormValidationSchema', () => ({
  __esModule: true,
  default: {
    validate: (...args) => mockValidate(...args),
  },
}));

jest.mock('../store/authSlice', () => ({
  registerUser: jest.fn((payload) => ({ type: 'auth/registerUser', payload })),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector) => selector({ auth: { status: 'idle', error: null } }),
  useDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderComponent = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockReturnValue({ unwrap: mockUnwrap });
  });

  it('shows password error when password is too short', async () => {
    mockValidate.mockRejectedValueOnce({
      inner: [{ path: 'password', message: 'Password must be at least 8 characters' }],
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter your full name/i), {
      target: { value: 'Aya' },
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'aya@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), {
      target: { value: '91234567' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'Ab1@' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'Ab1@' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(
      await screen.findByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();
  });

  it('shows local error when passwords do not match', async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'Different123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('dispatches register and navigates on valid form', async () => {
    const { registerUser } = require('../store/authSlice');

    mockValidate.mockResolvedValueOnce();
    mockUnwrap.mockResolvedValueOnce({});

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter your full name/i), {
      target: { value: 'Aya Alhabsi' },
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'aya@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), {
      target: { value: '91234567' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getAllByText(/funder/i)[0]);
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith(
        {
          name: 'Aya Alhabsi',
          email: 'aya@example.com',
          phone: '91234567',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        { abortEarly: false }
      );
    });

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Aya Alhabsi',
          email: 'aya@example.com',
          password: 'Password123!',
          role: 'funder',
          phone: '91234567',
        })
      );
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
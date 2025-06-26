import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState } from '../types';
import { simulateLogin, simulateRegister, validateToken } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState & { loading: boolean }, action: AuthAction) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const user = validateToken(token);
      if (user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } else {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const result = await simulateLogin(email, password);
      if (result.success && result.user && result.token) {
        localStorage.setItem('token', result.token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: result.user, token: result.token } });
        toast.success(`Welcome back, ${result.user.fullName}!`);
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        toast.error(result.message || 'Login failed');
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error('An error occurred during login');
      return false;
    }
  };

  const register = async (fullName: string, email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const result = await simulateRegister(fullName, email, password);
      if (result.success && result.user && result.token) {
        localStorage.setItem('token', result.token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: result.user, token: result.token } });
        toast.success('Account created successfully!');
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        toast.error(result.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error('An error occurred during registration');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
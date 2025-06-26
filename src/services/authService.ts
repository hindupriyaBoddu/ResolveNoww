import { User } from '../types';

// Simulate user database
const users: Array<User & { password: string }> = [
  {
    id: '1',
    email: 'admin@resolvenow.com',
    fullName: 'Admin User',
    role: 'admin',
    password: 'admin123',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'agent@resolvenow.com',
    fullName: 'Support Agent',
    role: 'agent',
    password: 'agent123',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'user@resolvenow.com',
    fullName: 'John Doe',
    role: 'user',
    password: 'user123',
    createdAt: new Date().toISOString(),
  },
];

export const simulateLogin = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    const token = btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 24 * 60 * 60 * 1000 }));
    return {
      success: true,
      user: userWithoutPassword,
      token,
    };
  }
  
  return {
    success: false,
    message: 'Invalid email or password',
  };
};

export const simulateRegister = async (fullName: string, email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return {
      success: false,
      message: 'Email already exists',
    };
  }
  
  const newUser: User & { password: string } = {
    id: Date.now().toString(),
    email,
    fullName,
    role: 'user',
    password,
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  
  const { password: _, ...userWithoutPassword } = newUser;
  const token = btoa(JSON.stringify({ userId: newUser.id, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  
  return {
    success: true,
    user: userWithoutPassword,
    token,
  };
};

export const validateToken = (token: string): User | null => {
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.exp < Date.now()) {
      return null;
    }
    
    const user = users.find(u => u.id === decoded.userId);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    
    return null;
  } catch {
    return null;
  }
};

export const getAllUsers = (): User[] => {
  return users.map(({ password: _, ...user }) => user);
};

export const getAllAgents = (): User[] => {
  return users.filter(u => u.role === 'agent').map(({ password: _, ...user }) => user);
};
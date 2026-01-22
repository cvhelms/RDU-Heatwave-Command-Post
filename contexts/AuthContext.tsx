
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';

// In a real app, this would be hashed and come from a secure backend.
const INITIAL_USERS: User[] = [
  { id: 'user-1', username: 'super', password: 'password', role: 'super-admin' },
  { id: 'user-2', username: 'admin', password: 'password', role: 'admin' },
];

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => boolean;
  deleteUser: (userId: string) => void;
  changePassword: (userId: string, oldPassword: string, newPassword: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Initialize users from localStorage or use initial set
    const storedUsers = localStorage.getItem('rdu_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(INITIAL_USERS);
      localStorage.setItem('rdu_users', JSON.stringify(INITIAL_USERS));
    }

    // Check for active session
    const storedUser = localStorage.getItem('rdu_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (foundUser) {
      const { password, ...userToStore } = foundUser;
      setUser(userToStore);
      localStorage.setItem('rdu_current_user', JSON.stringify(userToStore));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rdu_current_user');
  };

  const addUser = (newUser: Omit<User, 'id'>): boolean => {
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      alert('Username already exists.');
      return false;
    }
    const userWithId = { ...newUser, id: `user-${Date.now()}` };
    const updatedUsers = [...users, userWithId];
    setUsers(updatedUsers);
    localStorage.setItem('rdu_users', JSON.stringify(updatedUsers));
    return true;
  };

  const deleteUser = (userId: string) => {
    if (user?.id === userId) {
      alert("You cannot delete your own account.");
      return;
    }
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('rdu_users', JSON.stringify(updatedUsers));
  };

  const changePassword = (userId: string, oldPassword: string, newPassword: string): { success: boolean; message: string } => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }

    const userToUpdate = users[userIndex];
    if (userToUpdate.password !== oldPassword) {
      return { success: false, message: 'Current password does not match.' };
    }

    const updatedUsers = [...users];
    updatedUsers[userIndex] = { ...userToUpdate, password: newPassword };
    setUsers(updatedUsers);
    localStorage.setItem('rdu_users', JSON.stringify(updatedUsers));
    return { success: true, message: 'Password updated successfully.' };
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout, addUser, deleteUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

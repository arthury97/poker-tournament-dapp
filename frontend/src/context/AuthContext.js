import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('staked_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem('staked_user');
      }
    }
    setIsLoading(false);
  }, []);

  const signUp = async (name, email, password) => {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('staked_users') || '[]');
      const userExists = existingUsers.find(u => u.email === email);
      
      if (userExists) {
        throw new Error('An account with this email already exists');
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };

      // Store user in users list (password is hashed in a real app)
      const hashedPassword = btoa(password); // Simple encoding for demo (use bcrypt in production)
      existingUsers.push({
        ...newUser,
        password: hashedPassword
      });
      localStorage.setItem('staked_users', JSON.stringify(existingUsers));

      // Set current user
      setUser(newUser);
      localStorage.setItem('staked_user', JSON.stringify(newUser));

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('staked_users') || '[]');
      const hashedPassword = btoa(password);
      const user = users.find(u => u.email === email && u.password === hashedPassword);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;
      
      setUser(userWithoutPassword);
      localStorage.setItem('staked_user', JSON.stringify(userWithoutPassword));

      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('staked_user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


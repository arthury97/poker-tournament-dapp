import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthModal = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validation
        if (!formData.name.trim()) {
          throw new Error('Name is required');
        }
        if (!formData.email.trim()) {
          throw new Error('Email is required');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        await signUp(formData.name, formData.email, formData.password);
        toast.success('Account created successfully!');
        onClose();
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        // Sign in
        if (!formData.email.trim()) {
          throw new Error('Email is required');
        }
        if (!formData.password) {
          throw new Error('Password is required');
        }

        await signIn(formData.email, formData.password);
        toast.success('Signed in successfully!');
        onClose();
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '3px solid #2563eb'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            color: '#2563eb',
            fontSize: '28px',
            fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
            letterSpacing: '1px'
          }}>
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                NAME *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              EMAIL *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              PASSWORD *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
              required
              minLength={isSignUp ? 6 : undefined}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                CONFIRM PASSWORD *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '16px',
              fontSize: '18px',
              fontWeight: '700',
              fontFamily: '"Bungee", "Impact", "Arial Black", sans-serif',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            {isLoading ? (
              <>
                <div className="loading"></div>
                {isSignUp ? 'CREATING...' : 'SIGNING IN...'}
              </>
            ) : (
              isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'
            )}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          paddingTop: '24px',
          borderTop: '2px solid #e5e7eb'
        }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFormData({ name: '', email: '', password: '', confirmPassword: '' });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;


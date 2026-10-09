import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { login, register } from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMessage('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleToggleMode = (mode) => {
    setIsRegisterMode(mode);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (isRegisterMode && !name.trim()) {
      setErrorMessage('Full name is required for registration.');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // Register flow
        const result = await register({
          name: name.trim(),
          email: trimmedEmail,
          password
        });
        resetForm();
        onAuthSuccess(result.user, 'Account created successfully! Welcome to TaskManager Pro.');
      } else {
        // Login flow
        const result = await login({
          email: trimmedEmail,
          password
        });
        resetForm();
        onAuthSuccess(result.user, 'Signed in successfully! Welcome back.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill demo student credentials for rapid testing
  const handleQuickDemo = (demoType) => {
    if (demoType === 'student') {
      setEmail('student@charusat.edu.in');
      setPassword('password123');
      setName('Demo Student');
      setErrorMessage('');
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          handleClose();
        }
      }}
    >
      <div className="modal-dialog auth-modal-card">
        <div className="modal-header auth-modal-header">
          <div className="auth-header-title">
            <div className="auth-icon-badge">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="auth-title-text">{isRegisterMode ? 'Create Account' : 'Welcome Back'}</h3>
              <p className="auth-subtitle">
                {isRegisterMode
                  ? 'Sign up to start organizing your personal tasks'
                  : 'Enter your credentials to access your dashboard'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon auth-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegisterMode ? 'active' : ''}`}
            onClick={() => handleToggleMode(false)}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegisterMode ? 'active' : ''}`}
            onClick={() => handleToggleMode(true)}
          >
            <UserPlus size={15} />
            <span>Register</span>
          </button>
        </div>

        {errorMessage && (
          <div className="auth-error-banner">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {isRegisterMode && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">
                Full Name
              </label>
              <div className="input-with-icon">
                <UserIcon size={16} className="input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Neel Patel"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="form-input"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address <span className="req">*</span>
            </label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="e.g. student@charusat.edu.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="form-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password <span className="req">*</span> (Min 6 characters)
            </label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="form-input"
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-actions">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-block auth-submit-btn"
            >
              {isLoading ? (
                <span className="spinner-inline"></span>
              ) : isRegisterMode ? (
                <>
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Helper */}
          <div className="demo-helper-box">
            <div className="demo-helper-header">
              <Sparkles size={13} />
              <span>Quick Demo</span>
            </div>
            <button
              type="button"
              className="demo-pill-btn"
              onClick={() => handleQuickDemo('student')}
            >
              Autofill Sample Account (student@charusat.edu.in)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

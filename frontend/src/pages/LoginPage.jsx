import React, { useState } from 'react';
import { CloudLightning, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please enter your email or username and password.');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setIdentifier('demo@example.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <CloudLightning size={28} />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to manage and analyze your cloud expenses</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '18px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email or Username</label>
            <div className="search-input-box" style={{ minWidth: '100%' }}>
              <Mail size={16} />
              <input
                type="text"
                placeholder="name@example.com or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="search-input-box" style={{ minWidth: '100%' }}>
              <Lock size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Account Box */}
        <div className="demo-account-box">
          <p>Want to test quickly with sample expense data?</p>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
            onClick={fillDemoAccount}
          >
            <UserCheck size={15} />
            <span>Fill Demo Credentials (demo@example.com)</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button 
            type="button" 
            style={{ background: 'none', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
            onClick={onSwitchToRegister}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}

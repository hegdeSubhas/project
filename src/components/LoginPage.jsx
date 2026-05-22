import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bg from '../assets/background.png';
import { apiLogin, saveSession } from '../lib/api';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.email)
      errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errs.email = 'Enter a valid email';
    if (!formData.password)
      errs.password = 'Password is required';
    else if (formData.password.length < 6)
      errs.password = 'Minimum 6 characters required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      const data = await apiLogin({ email: formData.email, password: formData.password });
      if (data.success) {
        saveSession(data.token, data.user);
        navigate('/dashboard');
      } else {
        setApiError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setApiError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{
      background: `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(240, 248, 255, 0.95) 100%), url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div className="text-center mb-4 d-flex flex-column align-items-center">
          <div className="d-flex align-items-center gap-2 mb-2 logo-anim">
            <svg viewBox="0 0 100 100" style={{ width: '34px', height: '34px' }} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="50" cy="50" r="46" stroke="#000" strokeWidth="4" />
              <path d="M 32 32 L 32 68" stroke="#00b4d8" strokeWidth="18" />
              <path d="M 32 32 L 68 68 L 68 32" stroke="#121a2f" strokeWidth="18" />
            </svg>
            <h2 className="fw-bold m-0 logo-text" style={{ fontSize: '2.2rem', letterSpacing: '-1px' }}>
              <span style={{ color: '#121a2f' }}>Next</span>
              <span style={{ color: '#00b4d8' }}>Hire</span>
            </h2>
          </div>
          <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>Automated Virtual Interviewer</p>
        </div>

        {/* API-level error banner */}
        {apiError && (
          <div className="mb-3 px-3 py-2 rounded-3" style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#dc2626',
            fontSize: '0.85rem'
          }}>
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="animate-fade-in animate-delay-1">
          <div className="mb-4">
            <label className="form-label small fw-bold" style={{ color: 'var(--text-primary)' }}>Email Address</label>
            <input
              type="email"
              name="email"
              id="login-email"
              value={formData.email}
              onChange={handleChange}
              className="input-premium"
              placeholder="Enter your email"
              disabled={loading}
            />
            {errors.email && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.8rem' }}>{errors.email}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold" style={{ color: 'var(--text-primary)' }}>Password</label>
            <div className="position-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="login-password"
                value={formData.password}
                onChange={handleChange}
                className="input-premium"
                placeholder="Enter your password"
                style={{ paddingRight: '50px' }}
                disabled={loading}
              />
              <button
                type="button"
                className="position-absolute"
                style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.8rem' }}>{errors.password}</div>}
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn-premium mt-2"
            disabled={loading}
            style={{ opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>

          <div className="text-center mt-4 pt-4 border-top" style={{ borderColor: 'var(--border-color) !important' }}>
            <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>
              New to NextHire?{' '}
              <Link to="/signup" className="fw-bold text-decoration-none" style={{ color: 'var(--accent-primary)' }}>
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
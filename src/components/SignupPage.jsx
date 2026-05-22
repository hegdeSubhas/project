import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bg from '../assets/background.png';
import { apiRegister, saveSession } from '../lib/api';

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    role:      '',    // Target job role (optional)
    skills:    '',    // Technical skills (optional)
  });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);

  const validateEmail    = (email)    => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim())  newErrors.lastName  = 'Last name is required';
    if (!formData.email)            newErrors.email     = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password)         newErrors.password  = 'Password is required';
    else if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 8 characters';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      const data = await apiRegister({
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
        email:     formData.email,
        password:  formData.password,
        role:      formData.role.trim(),
        skills:    formData.skills.trim(),
      });

      if (data.success) {
        saveSession(data.token, data.user);
        navigate('/dashboard');
      } else {
        setApiError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setApiError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...(errors[field] ? { borderColor: 'var(--accent-danger)' } : {})
  });

  return (
    <div className="auth-wrapper" style={{
      background: `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(240, 248, 255, 0.95) 100%), url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      overflowY: 'auto',
      paddingTop: '2rem',
      paddingBottom: '2rem',
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
        {/* Logo */}
        <div className="mb-4 text-center d-flex flex-column align-items-center">
          <div className="d-flex align-items-center gap-2 mb-2 logo-anim">
            <svg viewBox="0 0 100 100" style={{ width: '28px', height: '28px' }} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="50" cy="50" r="46" stroke="#000" strokeWidth="4" />
              <path d="M 32 32 L 32 68" stroke="#00b4d8" strokeWidth="18" />
              <path d="M 32 32 L 68 68 L 68 32" stroke="#121a2f" strokeWidth="18" />
            </svg>
            <h3 className="fw-bold m-0 logo-text" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
              <span style={{ color: '#121a2f' }}>Next</span>
              <span style={{ color: '#00b4d8' }}>Hire</span>
            </h3>
          </div>
          <p className="small mt-1 mb-0" style={{ color: 'var(--text-secondary)' }}>Create your account to get started.</p>
        </div>

        {/* API error banner */}
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

          {/* ── Row 1: Names ── */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>First Name <span style={{color:'#dc2626'}}>*</span></label>
              <input
                type="text"
                className="input-premium py-2"
                style={inputStyle('firstName')}
                name="firstName"
                id="signup-firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.firstName && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{errors.firstName}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Last Name <span style={{color:'#dc2626'}}>*</span></label>
              <input
                type="text"
                className="input-premium py-2"
                style={inputStyle('lastName')}
                name="lastName"
                id="signup-lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.lastName && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{errors.lastName}</div>}
            </div>
          </div>

          {/* ── Email ── */}
          <div className="mb-3">
            <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Work Email <span style={{color:'#dc2626'}}>*</span></label>
            <input
              type="email"
              className="input-premium py-2"
              style={inputStyle('email')}
              name="email"
              id="signup-email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
            {errors.email && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{errors.email}</div>}
          </div>

          {/* ── Password ── */}
          <div className="mb-3">
            <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Password <span style={{color:'#dc2626'}}>*</span></label>
            <input
              type="password"
              className="input-premium py-2"
              style={inputStyle('password')}
              name="password"
              id="signup-password"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
            {errors.password && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{errors.password}</div>}
          </div>

          {/* ── Divider ── */}
          <div className="d-flex align-items-center gap-2 my-3">
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>OPTIONAL DETAILS</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          {/* ── Target Role ── */}
          <div className="mb-3">
            <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Target Role</label>
            <input
              type="text"
              className="input-premium py-2"
              name="role"
              id="signup-role"
              placeholder="e.g. Full Stack Developer"
              value={formData.role}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* ── Skills ── */}
          <div className="mb-4">
            <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Technical Skills</label>
            <input
              type="text"
              className="input-premium py-2"
              name="skills"
              id="signup-skills"
              placeholder="e.g. React, Node.js, MongoDB, Java"
              value={formData.skills}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* ── Submit ── */}
          <button
            className="btn-premium py-2 mt-1"
            id="signup-submit"
            type="submit"
            disabled={loading}
            style={{ opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Creating account…
              </span>
            ) : 'Create My Account'}
          </button>
        </form>

        <p className="text-center small mt-3 mb-0" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="fw-bold text-decoration-none" style={{ color: 'var(--accent-primary)' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
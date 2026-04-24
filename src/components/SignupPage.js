import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import bg from '../assets/background.png';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
      //signup logic
    }
  };

  return (
    <div className="auth-wrapper" style={{
      background: `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(240, 248, 255, 0.95) 100%), url(${bg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
        <div className="mb-4 text-center d-flex flex-column align-items-center">
          <div className="d-flex align-items-center gap-2 mb-2 logo-anim">
            <div className="rounded-circle" style={{ width: '24px', height: '24px', backgroundColor: '#121a2f' }}></div>
            <h3 className="fw-bold m-0 logo-text" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
              <span style={{ color: '#121a2f' }}>Next</span>
              <span style={{ color: '#00b4d8' }}>Hire</span>
            </h3>
          </div>
          <p className="small mt-1 mb-0" style={{ color: 'var(--text-secondary)' }}>Create your account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-in animate-delay-1">
          <div className="row g-3 mb-2">
            <div className="col-md-6">
              <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>First Name</label>
              <input
                type="text"
                className="input-premium py-2"
                style={errors.firstName ? { borderColor: 'var(--accent-danger)' } : {}}
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              {errors.firstName && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{errors.firstName}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Last Name</label>
              <input
                type="text"
                className="input-premium py-2"
                style={errors.lastName ? { borderColor: 'var(--accent-danger)' } : {}}
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
              {errors.lastName && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{errors.lastName}</div>}
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Work Email</label>
            <input
              type="email"
              className="input-premium py-2"
              style={errors.email ? { borderColor: 'var(--accent-danger)' } : {}}
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            {errors.email && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{errors.email}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Password</label>
            <input
              type="password"
              className="input-premium py-2"
              style={errors.password ? { borderColor: 'var(--accent-danger)' } : {}}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
            />
            {errors.password && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>{errors.password}</div>}
          </div>

          <button className="btn-premium py-2 mt-1" type="submit">
            Create My Account
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
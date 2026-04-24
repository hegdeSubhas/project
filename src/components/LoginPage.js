import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import bg from '../assets/background.png';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      console.log("Form Submitted", formData);
      // API call 
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
            <div className="rounded-circle" style={{ width: '30px', height: '30px', backgroundColor: '#121a2f' }}></div>
            <h2 className="fw-bold m-0 logo-text" style={{ fontSize: '2.2rem', letterSpacing: '-1px' }}>
              <span style={{ color: '#121a2f' }}>Next</span>
              <span style={{ color: '#00b4d8' }}>Hire</span>
            </h2>
          </div>
          <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>Automated Virtual Interviewer</p>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-in animate-delay-1">
          <div className="mb-4">
            <label className="form-label small fw-bold" style={{ color: 'var(--text-primary)' }}>Email Address</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-premium"
              placeholder="Enter your work email"
            />
            {errors.email && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.8rem' }}>{errors.email}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold" style={{ color: 'var(--text-primary)' }}>Password</label>
            <div className="position-relative">
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-premium"
                placeholder="Enter your password"
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                className="position-absolute"
                style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <div className="mt-1" style={{ color: 'var(--accent-danger)', fontSize: '0.8rem' }}>{errors.password}</div>}
          </div>

          <button type="submit" className="btn-premium mt-2">
            Sign In
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
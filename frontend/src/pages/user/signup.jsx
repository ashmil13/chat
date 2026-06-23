import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import UserService from '../../services/user-services/User-Service';
import '../../css/userstyle/sighup.css';

function Signup() {
  const { postRegister } = UserService();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('User'); // default role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await postRegister({ name, email, password, role });
      const data = response.data;
      
      if (data && data.success) {
        setSuccess("Registration successful! You can now log in.");
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('User');
      } else {
        throw new Error(data.error || "Registration failed.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page-wrapper">
      <div className="signup-container">
        <h2 className="signup-title">Create Account</h2>
        {error && <p className="signup-error">{error}</p>}
        {success && <p className="signup-success">{success}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="signup-form-group">
            <label className="signup-label">Full Name</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)} 
              className="signup-input"
              placeholder="John Doe"
            />
          </div>

          <div className="signup-form-group">
            <label className="signup-label">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              className="signup-input"
              placeholder="name@example.com"
            />
          </div>
          
          <div className="signup-form-group">
            <label className="signup-label">Account Category</label>
            <div className="role-selector-container">
              <button 
                type="button" 
                onClick={() => setRole('User')} 
                className={`role-select-btn ${role === 'User' ? 'active' : ''}`}
              >
                User
              </button>
              <button 
                type="button" 
                onClick={() => setRole('Admin')} 
                className={`role-select-btn ${role === 'Admin' ? 'active' : ''}`}
              >
                Admin
              </button>
              <button 
                type="button" 
                onClick={() => setRole('SuperAdmin')} 
                className={`role-select-btn ${role === 'SuperAdmin' ? 'active' : ''}`}
              >
                SuperAdmin
              </button>
            </div>
          </div>

          <div className="signup-form-group">
            <label className="signup-label">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              className="signup-input"
              placeholder="••••••••"
            />
          </div>

          <div className="signup-form-group">
            <label className="signup-label">Confirm Password</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="signup-input"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="signup-btn"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="signup-redirect-text">
          Already have an account?{' '}
          <Link to="/login" className="signup-link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;

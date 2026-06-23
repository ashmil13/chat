import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserService from '../../services/user-services/User-Service';
import useAuth from '../../hooks/useAuth';
import '../../css/userstyle/login.css';

function Login() {
  const { postLogin } = UserService();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await postLogin({ email, password });
      const data = response.data;

      if (data && data.success) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("role", data.role || "User");
        localStorage.setItem("userId", data.userId || "");
        localStorage.setItem("name", data.name || "");
        localStorage.setItem("profileImage", data.profileImage || "");
        
        setAuth({
          accessToken: data.accessToken,
          role: data.role || "User",
          id: data.userId,
          name: data.name,
          image: data.profileImage
        });
        
        navigate('/user/dashboard');
      } else {
        throw new Error(data.error || "Invalid credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <h2 className="login-title">Sign In</h2>
        {error && <p className="login-error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label className="login-label">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              className="login-input"
              placeholder="name@example.com"
            />
          </div>
          
          <div className="login-form-group">
            <label className="login-label">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              className="login-input"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="login-btn"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="login-redirect-text">
          Don't have an account?{' '}
          <Link to="/signup" className="login-link">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

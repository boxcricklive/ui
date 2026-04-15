import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }

    // Check for signup success state
    if (location.state?.signupSuccess) {
      toast.success('Account created successfully!', {
        description: 'You can now sign in with your credentials.',
        duration: 5000,
      });
      // Clear state to prevent toast on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [navigate, location]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Special character validation
    const specialCharRegex = /[^a-zA-Z0-9._]/;
    if (specialCharRegex.test(username)) {
      setError('Username should only contain letters, numbers, dots, and underscores.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/Auth/Login', {
        playerUsername: username,
        password: password
      });
      // Assuming response contains token and refreshToken
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('username', username);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 md:p-6">
      <div className="auth-card">
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">SIGN IN</h2>
        <p className="text-gray-500 text-sm mb-8">
          Enter your credentials to access the analytics terminal.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Username</label>
            <input 
              type="text" 
              placeholder="j.smith@proleague" 
              className={`input-field ${error && username.length > 0 && /[^a-zA-Z0-9._]/.test(username) ? 'ring-2 ring-red-500' : ''}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Password</label>
              <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-bold text-brand-dark hover:underline">Forgot Password?</Link>
            </div>
            <input 
              type="password" 
              placeholder="........" 
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-red-700 text-[11px] font-bold leading-tight">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary uppercase tracking-widest text-sm"
          >
            {loading ? 'Signing In...' : 'Sign In'} <LogIn size={18} />
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            New to the platform? <Link to="/signup" className="font-bold text-brand-dark hover:underline">Join the Elite</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function SignupPage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    playerAlias: '',
    countryCode: 'IN',
    skill: 'All-Rounder'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Special character validation
    const specialCharRegex = /[^a-zA-Z0-9._]/;
    const nameRegex = /[^a-zA-Z\s]/;

    if (nameRegex.test(formData.fullName)) {
      setError('Full Name should only contain letters and spaces.');
      return;
    }

    if (specialCharRegex.test(formData.username)) {
      setError('Username should only contain letters, numbers, dots, and underscores.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/api/Auth/Signup', {
        playerUsername: formData.username,
        email: formData.email || null,
        password: formData.password,
        playerAlias: formData.playerAlias || formData.fullName,
        countryCode: formData.countryCode,
        skill: formData.skill
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 md:p-6 py-12">
      <div className="auth-card">
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">CREATE ACCOUNT</h2>
        <p className="text-gray-500 text-sm mb-8">
          Join the elite community of data-driven athletes and coaches.
        </p>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Enter your full name" 
                className={`input-field pl-12 ${error && formData.fullName.length > 0 && /[^a-zA-Z\s]/.test(formData.fullName) ? 'ring-2 ring-red-500' : ''}`}
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Choose a username" 
                className={`input-field pl-12 ${error && formData.username.length > 0 && /[^a-zA-Z0-9._]/.test(formData.username) ? 'ring-2 ring-red-500' : ''}`}
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300 italic">Optional</span>
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="email" 
                placeholder="name@example.com" 
                className="input-field pl-12"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="password" 
                placeholder="........" 
                className="input-field pl-12"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Confirm Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="password" 
                placeholder="........" 
                className={`input-field pl-12 ${error === 'Passwords do not match' ? 'ring-2 ring-red-500' : ''}`}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-red-700 text-[11px] font-bold leading-tight">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary uppercase tracking-widest text-sm mt-4"
          >
            {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={18} className="text-brand-primary" />
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Already have an account? <Link to="/login" className="font-bold text-brand-dark hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

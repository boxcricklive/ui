import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.post('/api/Auth/ForgotPassword', { username });
      setMessage('If an account exists, a reset link has been sent.');
    } catch (err: any) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
      <div className="auth-card">
        <h2 className="text-4xl font-black tracking-tighter mb-2 uppercase">Forgot Password</h2>
        <p className="text-gray-500 text-sm mb-8">
          Enter the email associated with your professional account and we'll send a high-priority reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Mail size={12} /> Registered Email Address
            </label>
            <input 
              type="text" 
              placeholder="name@organization.com" 
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {message && <p className="text-green-600 text-xs font-bold">{message}</p>}
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary uppercase tracking-widest text-sm"
          >
            {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-bold text-brand-dark uppercase tracking-widest hover:underline">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
            Experiencing technical difficulties? <br />
            <button className="text-brand-primary font-bold hover:underline mt-1">Contact System Support</button>
          </p>
        </div>
      </div>
    </div>
  );
}

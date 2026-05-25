import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart } from 'lucide-react';
import API_BASE from '../api';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus]     = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await axios.post(`${API_BASE}/api/users/register`, { email, password });
      localStorage.setItem('user', JSON.stringify({ email, name }));
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(msg);
      setStatus('');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cream">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-burgundy-100 rounded-2xl mb-4">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 font-serif">Create Account</h2>
          <p className="mt-2 text-sm text-gray-500">Join the Happy Paws family</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-burgundy-100">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text" required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" required minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl shadow hover-lift transition disabled:opacity-70">
              {status === 'loading' ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

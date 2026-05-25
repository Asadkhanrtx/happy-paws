import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart } from 'lucide-react';
import API_BASE from '../api';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus]     = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/users/login`, { email, password });
      localStorage.setItem('user', JSON.stringify({ email: res.data.email || email, role: res.data.role }));
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please try again.';
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
          <h2 className="text-3xl font-bold text-gray-900 font-serif">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-500">Sign in to your Happy Paws account</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-burgundy-100">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
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
                type="password" required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="h-4 w-4 text-primary rounded border-gray-300" />
                Remember me
              </label>
              <a href="#" className="text-primary hover:text-primary-hover font-medium">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl shadow hover-lift transition disabled:opacity-70">
              {status === 'loading' ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

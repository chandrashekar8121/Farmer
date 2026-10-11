import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password });
      login(res);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins for easy evaluation
  const handleDemoFarmer = async () => {
    setEmail('farmer.demo@krishisaathi.in');
    setPassword('farmer1234');
    setError(null);
    setLoading(true);
    try {
      // Try signup if not exists, else login
      try {
        const reg = await api.auth.signup({
          email: 'farmer.demo@krishisaathi.in',
          password: 'farmer1234',
          full_name: 'వెంకట రావు (Venkata Rao)',
          role: 'farmer',
          language_preference: 'te',
          phone_number: '9848012345'
        });
        login(reg);
        navigate('/dashboard');
        return;
      } catch {
        // Already exists, proceed to login
      }
      const res = await api.auth.login({ email: 'farmer.demo@krishisaathi.in', password: 'farmer1234' });
      login(res);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="farmer-card p-8 bg-white space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <LogIn className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">{t.navLogin}</h1>
          <p className="text-gray-600 text-lg">Enter your email and password to access your farm.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-base flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Email Address / ఈమెయిల్
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. farmer@example.com"
              className="w-full px-4 py-3.5 text-lg rounded-xl border-2 border-gray-300 focus:border-emerald-600 focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Password / పాస్‌వర్డ్
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 text-lg rounded-xl border-2 border-gray-300 focus:border-emerald-600 focus:ring-0"
            />
          </div>

          <BigButton
            type="submit"
            disabled={loading}
            className="w-full"
            icon={<LogIn className="w-6 h-6" />}
          >
            {loading ? t.loading : t.navLogin}
          </BigButton>
        </form>

        {/* 1-Click Demo Login */}
        <div className="pt-4 border-t border-gray-200 text-center space-y-3">
          <p className="text-sm font-semibold text-gray-500">Quick Test / డెమో లాగిన్:</p>
          <button
            type="button"
            onClick={handleDemoFarmer}
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>1-Click Farmer Demo Login</span>
          </button>
        </div>

        <div className="text-center text-base text-gray-600 pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-emerald-700 hover:underline">
            {t.navRegister}
          </Link>
        </div>
      </div>
    </div>
  );
};

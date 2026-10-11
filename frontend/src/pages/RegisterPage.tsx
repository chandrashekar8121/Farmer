import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, Sprout, Users } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'farmer' | 'family_helper'>('farmer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.signup({
        email,
        password,
        full_name: fullName,
        phone_number: phone || undefined,
        role,
        language_preference: language,
      });
      login(res);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="farmer-card p-8 bg-white space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <UserPlus className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">{t.navRegister}</h1>
          <p className="text-gray-600 text-lg">Create a new account for personalized agricultural advice.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-base flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection Toggle */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Who are you? / మీరు ఎవరు?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                  role === 'farmer'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-black shadow-sm'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Sprout className="w-8 h-8 text-emerald-700" />
                <span className="text-lg">రైతు (Farmer)</span>
                <span className="text-xs text-gray-500">I cultivate fields</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('family_helper')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all ${
                  role === 'family_helper'
                    ? 'border-amber-700 bg-amber-50 text-amber-950 font-black shadow-sm'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-8 h-8 text-amber-700" />
                <span className="text-lg">కుటుంబ సహాయకుడు (Helper)</span>
                <span className="text-xs text-gray-500">I help an elder farmer</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Full Name / పూర్తి పేరు *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Venkata Rao / వెంకట రావు"
              className="w-full px-4 py-3.5 text-lg rounded-xl border-2 border-gray-300 focus:border-emerald-600 focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Mobile Phone / ఫోన్ నంబర్ (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9848012345"
              className="w-full px-4 py-3.5 text-lg rounded-xl border-2 border-gray-300 focus:border-emerald-600 focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">
              Email Address / ఈమెయిల్ *
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
              Create Password / పాస్‌వర్డ్ (Min 6 chars) *
            </label>
            <input
              type="password"
              required
              minLength={6}
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
            icon={<UserPlus className="w-6 h-6" />}
          >
            {loading ? t.loading : t.navRegister}
          </BigButton>
        </form>

        <div className="text-center text-base text-gray-600 pt-2">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-emerald-700 hover:underline">
            {t.navLogin}
          </Link>
        </div>
      </div>
    </div>
  );
};

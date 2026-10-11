import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  CloudSun,
  History as HistoryIcon,
  CalendarCheck,
  FlaskConical,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const Navbar: React.FC = () => {
  const { isAuthenticated, userName, role, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = isAuthenticated
    ? [
        { path: '/dashboard', label: t.navDashboard, icon: <Sprout className="w-5 h-5" /> },
        { path: '/soil-input', label: t.navSoilTest, icon: <FlaskConical className="w-5 h-5" /> },
        { path: '/upload-report', label: t.navUploadReport, icon: <FlaskConical className="w-5 h-5" /> },
        { path: '/crop-recommendation', label: t.navCropRec, icon: <Sparkles className="w-5 h-5" /> },
        { path: '/fertilizer-recommendation', label: t.navFertilizer, icon: <Sprout className="w-5 h-5" /> },
        { path: '/schedules', label: t.navSchedule, icon: <CalendarCheck className="w-5 h-5" /> },
        { path: '/weather', label: t.navWeather, icon: <CloudSun className="w-5 h-5" /> },
        { path: '/history', label: t.navHistory, icon: <HistoryIcon className="w-5 h-5" /> },
        { path: '/family', label: t.navFamily, icon: <Users className="w-5 h-5" /> },
      ]
    : [
        { path: '/', label: t.navHome, icon: <Sprout className="w-5 h-5" /> },
        { path: '/soil-input', label: t.navSoilTest, icon: <FlaskConical className="w-5 h-5" /> },
        { path: '/weather', label: t.navWeather, icon: <CloudSun className="w-5 h-5" /> },
      ];

  return (
    <header className="sticky top-0 z-50 bg-emerald-800 text-white shadow-md border-b-2 border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-emerald-950 shadow-inner group-hover:bg-emerald-400 transition-colors">
              <Sprout className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white block leading-tight">
                {t.appName}
              </span>
              <span className="text-xs text-emerald-200 hidden sm:block font-medium">
                {t.appTagline}
              </span>
            </div>
          </Link>

          {/* Desktop Right Controls: Language & Auth */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSelector />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-900/60 text-emerald-100 px-3 py-1.5 rounded-xl text-base font-semibold flex items-center gap-2 border border-emerald-700">
                  <UserIcon className="w-5 h-5" />
                  {userName || (role === 'farmer' ? 'Farmer' : 'Helper')}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-700/80 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-base font-bold flex items-center gap-1.5 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">{t.navLogout}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-base font-bold transition-colors"
                >
                  {t.navLogin}
                </Link>
                <Link
                  to="/register"
                  className="bg-amber-500 hover:bg-amber-400 text-emerald-950 px-4 py-2 rounded-xl text-base font-black transition-colors"
                >
                  {t.navRegister}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-600"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Sub-bar */}
        <nav className="hidden lg:flex items-center gap-1 pb-3 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-base transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-inner'
                    : 'text-emerald-100 hover:bg-emerald-700/70 hover:text-white'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-emerald-900 border-t border-emerald-950 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-lg text-emerald-100 hover:bg-emerald-800"
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}

          <div className="pt-4 border-t border-emerald-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-700 text-white py-3 rounded-xl font-bold text-lg"
              >
                <LogOut className="w-6 h-6" />
                <span>{t.navLogout}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center bg-emerald-700 text-white py-3 rounded-xl font-bold text-lg"
                >
                  {t.navLogin}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center bg-amber-500 text-emerald-950 py-3 rounded-xl font-bold text-lg"
                >
                  {t.navRegister}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

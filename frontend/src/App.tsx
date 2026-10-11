import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SoilInputPage } from './pages/SoilInputPage';
import { ReportUploadPage } from './pages/ReportUploadPage';
import { CropRecommendationPage } from './pages/CropRecommendationPage';
import { FertilizerRecommendationPage } from './pages/FertilizerRecommendationPage';
import { SchedulePage } from './pages/SchedulePage';
import { WeatherPage } from './pages/WeatherPage';
import { HistoryPage } from './pages/HistoryPage';
import { FamilyDashboardPage } from './pages/FamilyDashboardPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-amber-50/40 text-gray-900">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Core Farmer Workflow */}
                <Route path="/soil-input" element={<SoilInputPage />} />
                <Route path="/upload-report" element={<ReportUploadPage />} />
                <Route path="/crop-recommendation" element={<CropRecommendationPage />} />
                <Route path="/fertilizer-recommendation" element={<FertilizerRecommendationPage />} />
                <Route path="/weather" element={<WeatherPage />} />

                {/* Protected Routes requiring Authentication */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedules"
                  element={
                    <ProtectedRoute>
                      <SchedulePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/family"
                  element={
                    <ProtectedRoute>
                      <FamilyDashboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;

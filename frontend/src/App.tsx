import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedLayout } from './components/ProtectedLayout';

import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { UploadPage } from './pages/UploadPage';
import { MLRunningPage } from './pages/MLRunningPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected App Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/ml-running" element={<MLRunningPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

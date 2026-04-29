import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NewAnalysis from './pages/NewAnalysis';
import AnalysisDetail from './pages/AnalysisDetail';
import BattleMode from './pages/BattleMode';
import History from './pages/History';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Landing from './pages/Landing';
import GoogleOAuthCallback from './pages/GoogleOAuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useTranslation } from 'react-i18next';
import { useSettings } from './hooks/useSettings';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  const { data: settings } = useSettings();
  const { i18n } = useTranslation();

  const theme = settings?.theme;
  const language = settings?.language;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (language && i18n.resolvedLanguage !== language) {
      document.documentElement.lang = language;
      i18n.changeLanguage(language);
    }
  }, [theme, language, i18n]);

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
  
          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/new-analysis" element={<ProtectedRoute><RoleGuard role="researcher"><NewAnalysis /></RoleGuard></ProtectedRoute>} />
          <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisDetail /></ProtectedRoute>} />
          <Route path="/analysis-detail" element={<ProtectedRoute><AnalysisDetail /></ProtectedRoute>} />
          <Route path="/battle-mode" element={<ProtectedRoute><RoleGuard role="researcher"><BattleMode /></RoleGuard></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Admin-only routes */}
          <Route path="/admin" element={<ProtectedRoute><RoleGuard role="admin"><AdminPanel /></RoleGuard></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;

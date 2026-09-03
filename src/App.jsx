import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import PWAInstallPrompt from './components/PWAInstallPrompt';

export default function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot_password'

  if (loading) {
    return (
      <div className="auth-container" style={{ gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Carregando NutriCris...</p>
      </div>
    );
  }

  return (
    <>
      <PWAInstallPrompt />
      {user ? (
        <Dashboard />
      ) : view === 'register' ? (
        <Register 
          onSwitchToLogin={() => setView('login')} 
          onForgotPassword={() => setView('forgot_password')} 
        />
      ) : view === 'forgot_password' ? (
        <ForgotPassword 
          onBackToLogin={() => setView('login')} 
        />
      ) : (
        <Login 
          onSwitchToRegister={() => setView('register')} 
          onForgotPassword={() => setView('forgot_password')} 
        />
      )}
    </>
  );
}


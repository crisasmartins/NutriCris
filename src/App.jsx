import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

export default function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div className="auth-container" style={{ gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Carregando NutriCris...</p>
      </div>
    );
  }

  // Se já estiver logada e tentar acessar a tela de login/cadastro, redirecionar direto para o dashboard
  if (user) {
    return <Dashboard />;
  }

  if (view === 'register') {
    return <Register onSwitchToLogin={() => setView('login')} />;
  }

  return <Login onSwitchToRegister={() => setView('register')} />;
}

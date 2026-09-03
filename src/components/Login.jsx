import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login({ onSwitchToRegister, onForgotPassword }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    if (!password) {
      setError('Por favor, informe sua senha.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      let message = err.message || 'Erro ao realizar login.';
      if (message.includes('INVALID_EMAIL_OR_PASSWORD') || message.includes('Invalid credentials')) {
        message = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="ambient-glow ambient-top"></div>
      
      <div className="auth-card">
        <Logo />

        <div className="form-header">
          <h2 className="form-title">Acessar Conta</h2>
          <p className="form-description">Entre com suas credenciais de nutricionista</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu.email@nutricris.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="input-icon" />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="input-label" htmlFor="password" style={{ marginBottom: 0 }}>
                Senha
              </label>
              {onForgotPassword && (
                <button
                  type="button"
                  className="auth-link"
                  onClick={onForgotPassword}
                  style={{ fontSize: '0.8rem', fontWeight: '500' }}
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <Lock className="input-icon" />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Não tem conta?</span>
          <button type="button" className="auth-link" onClick={onSwitchToRegister}>
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}

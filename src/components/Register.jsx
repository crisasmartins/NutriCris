import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register({ onSwitchToLogin, onForgotPassword }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique a confirmação de senha.');
      return;
    }

    setLoading(true);

    try {
      await signUp(name, email, password);
    } catch (err) {
      console.error(err);
      let message = err.message || 'Erro ao criar conta.';
      if (message.includes('USER_ALREADY_EXISTS') || message.includes('already exists')) {
        message = 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.';
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
          <h2 className="form-title">Criar Conta</h2>
          <p className="form-description">Cadastre-se para gerenciar seus pacientes</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="name">Nome completo</label>
            <div className="input-wrapper">
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Dra. Cristina Martins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User className="input-icon" />
            </div>
          </div>

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
            <label className="input-label" htmlFor="password">
              <span>Senha</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Min. 6 caracteres</span>
            </label>
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

          <div className="input-group">
            <label className="input-label" htmlFor="confirmPassword">Confirmar senha</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="•••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
              <Lock className="input-icon" />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <span>Criar conta</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
          <div>
            <span>Já tem conta?</span>{' '}
            <button type="button" className="auth-link" onClick={onSwitchToLogin}>
              Faça login
            </button>
          </div>
          {onForgotPassword && (
            <div>
              <button type="button" className="auth-link" onClick={onForgotPassword} style={{ fontSize: '0.85rem' }}>
                Esqueci minha senha
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

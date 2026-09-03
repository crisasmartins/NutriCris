import React, { useState } from 'react';
import Logo from './Logo';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import { neonResetPassword } from '../lib/neon';

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      const res = await neonResetPassword(email);
      setSuccessMessage(res?.message || `E-mail de redefinição enviado com sucesso para ${email}! Check sua caixa de entrada.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao solicitar troca de senha. Tente novamente.');
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
          <h2 className="form-title">Recuperar Senha</h2>
          <p className="form-description">Digite seu e-mail cadastrado para receber o link de troca de senha.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div className="alert alert-success" style={{ marginBottom: '20px', flexDirection: 'column', textAlign: 'center', padding: '20px', gap: '12px' }}>
              <CheckCircle size={40} style={{ color: '#10b981', margin: '0 auto' }} />
              <span style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{successMessage}</span>
            </div>
            <button type="button" className="btn-primary" onClick={onBackToLogin}>
              <ArrowLeft size={18} />
              <span>Voltar para o Login</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label" htmlFor="reset-email">E-mail cadastrado</label>
              <div className="input-wrapper">
                <input
                  id="reset-email"
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

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <span>Enviar Link de Recuperação</span>
                  <Send size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '24px' }}>
          <button type="button" className="auth-link" onClick={onBackToLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} />
            <span>Voltar ao Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent automatic browser mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] Aplicativo NutriCris instalado com sucesso!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Resposta de instalação do usuário:', outcome);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt || installed) return null;

  return (
    <div className="pwa-install-banner animate-fade-in">
      <div className="pwa-banner-left">
        <div className="pwa-icon-box">
          <Smartphone size={22} className="pwa-icon" />
        </div>
        <div className="pwa-banner-text">
          <h4>Instalar App NutriCris</h4>
          <p>Instale na sua tela inicial para acesso rápido e modo offline.</p>
        </div>
      </div>

      <div className="pwa-banner-actions">
        <button className="btn-secondary btn-sm" onClick={() => setShowPrompt(false)}>
          Agora não
        </button>
        <button className="btn-primary btn-sm pwa-btn-install" onClick={handleInstallClick}>
          <Download size={16} />
          <span>Instalar App</span>
        </button>
      </div>
    </div>
  );
}

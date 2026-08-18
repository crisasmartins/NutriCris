import React from 'react';
import { Apple } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  return (
    <div className="logo-wrapper">
      <div className="logo-badge">
        <Apple className="logo-icon-svg" />
      </div>
      <h1 className="logo-text">
        Nutri<span>Cris</span>
      </h1>
      <p className="logo-subtitle">Gestão para Nutricionistas</p>
    </div>
  );
}

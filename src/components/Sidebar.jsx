import React from 'react';
import Logo from './Logo';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'NC';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <aside className="sidebar-container">
      {/* Sidebar Header with Logo */}
      <div className="sidebar-header">
        <Logo />
      </div>

      {/* Main Navigation Menu */}
      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          title="Ver Dashboard"
        >
          <LayoutDashboard size={20} className="nav-icon" />
          <span>Dashboard</span>
        </button>

        <button
          className={`sidebar-nav-item ${activeTab === 'pacientes' ? 'active' : ''}`}
          onClick={() => setActiveTab('pacientes')}
          title="Gerenciar Pacientes"
        >
          <Users size={20} className="nav-icon" />
          <span>Pacientes</span>
        </button>
      </nav>

      {/* Sidebar Footer with User Profile and Logout */}
      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar-circle">
            {getInitials(user?.name)}
          </div>
          <div className="user-info-text">
            <span className="user-name-label">{user?.name || 'Nutricionista'}</span>
            <span className="user-email-label">{user?.email}</span>
          </div>
        </div>

        <button 
          className="btn-logout" 
          onClick={logout} 
          title="Encerrar sessão"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

import React, { useState, useEffect } from 'react';
import { sql } from '../lib/neon';
import { useAuth } from '../context/AuthContext';
import PatientForm from './PatientForm';
import PatientProfile from './PatientProfile';
import { 
  Users, UserPlus, Search, X, Calendar, Phone, Mail, 
  Target, ArrowLeft, Plus, Clock, AlertCircle
} from 'lucide-react';

export default function Patients({ selectedPatientId, onSelectPatient }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Navigation View State inside Patients section
  const [isRegistering, setIsRegistering] = useState(false);

  // Load Patients List from Neon DB in real time
  const fetchPatients = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await sql`
        SELECT 
          p.*,
          MAX(c.data_consulta) AS ultima_consulta,
          MAX(c.proximo_retorno) AS proximo_retorno
        FROM pacientes p
        LEFT JOIN consultas c ON p.id = c.paciente_id
        WHERE p.nutricionista_id = ${user.id}
        GROUP BY p.id
        ORDER BY p.created_at DESC;
      `;
      setPatients(res);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  // When selectedPatientId changes, reset registration view state
  useEffect(() => {
    if (selectedPatientId) {
      setIsRegistering(false);
    }
  }, [selectedPatientId]);

  // Filtered List by search term
  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
      return dateStr;
    }
  };

  // Format Patient Objectives for list card display
  const getPatientObjectivesDisplay = (p) => {
    const list = Array.isArray(p.objetivos) ? p.objetivos.filter(Boolean) : [];
    if (list.length > 0) {
      return list.join(', ');
    }
    if (p.objetivo_texto) {
      return p.objetivo_texto;
    }
    return 'Sem objetivo informado';
  };

  // RENDER 1: PERFIL DO PACIENTE (PROMPT 5 — DADOS, CONSULTAS E PLANOS)
  if (selectedPatientId) {
    return (
      <PatientProfile 
        patientId={selectedPatientId} 
        onBack={() => {
          onSelectPatient(null);
          fetchPatients();
        }} 
      />
    );
  }

  // RENDER 2: FORMULÁRIO DE CADASTRO DE NOVO PACIENTE (3 ABAS)
  if (isRegistering) {
    return (
      <PatientForm 
        onCancel={() => setIsRegistering(false)} 
        onSaveSuccess={(newId) => {
          setIsRegistering(false);
          fetchPatients();
          onSelectPatient(newId);
        }} 
      />
    );
  }

  // RENDER 3: LISTAGEM DE PACIENTES
  return (
    <div className="patients-page-wrapper">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1>Gestão de Pacientes</h1>
          <p>Consulte, cadastre e acompanhe o histórico dos seus pacientes.</p>
        </div>

        <button className="btn-primary" onClick={() => setIsRegistering(true)}>
          <UserPlus size={18} />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar paciente por nome ou e-mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Patients Cards List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando pacientes...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="empty-card">
          <Users size={44} style={{ color: 'var(--pink-light)', opacity: 0.8 }} />
          <h3>{searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado ainda'}</h3>
          <p>{searchTerm ? 'Tente buscar com outros termos de pesquisa.' : 'Cadastre o seu primeiro paciente no sistema para começar.'}</p>
          {!searchTerm && (
            <button className="btn-primary" onClick={() => setIsRegistering(true)} style={{ marginTop: '16px' }}>
              <UserPlus size={18} />
              <span>Cadastrar Primeiro Paciente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="patients-grid">
          {filteredPatients.map((p) => {
            const ultimaConsultaFmt = formatDate(p.ultima_consulta);
            const objetivoFmt = getPatientObjectivesDisplay(p);

            return (
              <div 
                key={p.id} 
                className="patient-card clickable"
                onClick={() => onSelectPatient(p.id)}
              >
                <div className="patient-card-header">
                  <div className="patient-avatar-circle">
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="patient-card-name">{p.nome}</h3>
                    <span className="patient-card-email">{p.email || 'Sem e-mail cadastrado'}</span>
                  </div>
                </div>

                <div className="patient-card-details">
                  {/* Objetivo */}
                  <div className="detail-row">
                    <Target size={14} style={{ color: 'var(--pink-light)', flexShrink: 0 }} />
                    <span className="text-truncate" title={objetivoFmt}>
                      <strong>Objetivo:</strong> {objetivoFmt}
                    </span>
                  </div>

                  {/* Data da Última Consulta */}
                  <div className="detail-row">
                    <Calendar size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Última consulta:</strong> {ultimaConsultaFmt || 'Sem consultas anteriores'}
                    </span>
                  </div>
                </div>

                <div className="patient-card-footer">
                  <span className="view-profile-btn">Ver Perfil Completo →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

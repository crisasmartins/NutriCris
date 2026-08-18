import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sql, ensureDatabaseSchema } from '../lib/neon';
import Sidebar from './Sidebar';
import Patients from './Patients';
import { 
  Users, Calendar, Clock, ChevronRight, CheckCircle2, AlertCircle, ShieldCheck, User 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'pacientes'
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Stats States
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [consultasSemana, setConsultasSemana] = useState(0);
  const [pacientesSemRetorno, setPacientesSemRetorno] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Real-time Data from Neon DB
  const loadDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      await ensureDatabaseSchema();

      // Card 1: Total de pacientes ativos da nutricionista logada
      const totalRes = await sql`
        SELECT COUNT(*)::int AS total
        FROM pacientes
        WHERE nutricionista_id = ${user.id};
      `;
      setTotalPacientes(totalRes[0]?.total || 0);

      // Card 2: Consultas da semana (segunda a domingo da semana atual)
      const consultasRes = await sql`
        SELECT COUNT(c.*)::int AS total
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${user.id}
          AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
          AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date;
      `;
      setConsultasSemana(consultasRes[0]?.total || 0);

      // Card 3: Pacientes sem retorno
      // Última consulta há mais de 30 dias (ou nenhuma consulta) E sem próximo retorno agendado (ou retorno já vencido)
      const semRetornoRes = await sql`
        SELECT 
          p.id,
          p.nome,
          MAX(c.data_consulta) AS ultima_consulta,
          MAX(c.proximo_retorno) AS proximo_retorno
        FROM pacientes p
        LEFT JOIN consultas c ON p.id = c.paciente_id
        WHERE p.nutricionista_id = ${user.id}
        GROUP BY p.id, p.nome
        HAVING 
          (MAX(c.data_consulta) IS NULL OR MAX(c.data_consulta) < CURRENT_DATE - INTERVAL '30 days')
          AND (MAX(c.proximo_retorno) IS NULL OR MAX(c.proximo_retorno) < CURRENT_DATE)
        ORDER BY MAX(c.data_consulta) ASC NULLS FIRST;
      `;
      setPacientesSemRetorno(semRetornoRes);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle click on patient in Card 3 -> redirect to patient profile
  const handleOpenPatientProfile = (patientId) => {
    setSelectedPatientId(patientId);
    setActiveTab('pacientes');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sem consultas anteriores';
    try {
      const d = new Date(dateStr);
      return `Última: ${d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="app-layout">
      {/* Menu Lateral Fixo */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'dashboard') setSelectedPatientId(null);
        }} 
      />

      {/* Área Principal */}
      <main className="main-content">
        <div className="ambient-glow ambient-top"></div>

        {activeTab === 'pacientes' ? (
          <Patients 
            selectedPatientId={selectedPatientId} 
            onSelectPatient={(id) => setSelectedPatientId(id)} 
          />
        ) : (
          <div className="dashboard-content">
            {/* Header Greeting Banner */}
            <div className="welcome-banner">
              <div className="banner-text">
                <h1>Bem-vinda, {user?.name ? user.name.split(' ')[0] : 'Nutricionista'}! 👋</h1>
                <p>
                  Aqui está o resumo da sua clínica em tempo real.
                </p>
              </div>

              <div className="db-status-chip">
                <span className="status-dot"></span>
                <ShieldCheck size={14} />
                <span>Dados sincronizados via Neon DB</span>
              </div>
            </div>

            {/* Grid dos 3 Cards de Informação */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Carregando métricas em tempo real...</p>
              </div>
            ) : (
              <div className="dashboard-cards-grid">
                {/* Card 1 — Total de pacientes ativos */}
                <div className="info-card-stat">
                  <div className="card-top">
                    <div className="card-icon-box pink">
                      <Users size={22} />
                    </div>
                    <span className="card-badge">Total</span>
                  </div>
                  <div className="card-body">
                    <span className="card-label">Total de pacientes ativos</span>
                    <h2 className="card-number">{totalPacientes}</h2>
                  </div>
                  <div className="card-footer-text">
                    Pacientes cadastrados sob sua gestão
                  </div>
                </div>

                {/* Card 2 — Consultas da semana */}
                <div className="info-card-stat">
                  <div className="card-top">
                    <div className="card-icon-box blue">
                      <Calendar size={22} />
                    </div>
                    <span className="card-badge">Semana Atual</span>
                  </div>
                  <div className="card-body">
                    <span className="card-label">Consultas da semana</span>
                    <h2 className="card-number">{consultasSemana}</h2>
                  </div>
                  <div className="card-footer-text">
                    Consultas agendadas / realizadas nesta semana
                  </div>
                </div>

                {/* Card 3 — Pacientes sem retorno */}
                <div className="info-card-stat card-sem-retorno">
                  <div className="card-top">
                    <div className="card-icon-box orange">
                      <Clock size={22} />
                    </div>
                    <span className="card-badge alert">Atenção</span>
                  </div>

                  <div className="card-body">
                    <span className="card-label">Pacientes sem retorno</span>
                    <p className="card-desc">Sem consulta há +30 dias e sem retorno agendado</p>

                    {pacientesSemRetorno.length === 0 ? (
                      <div className="empty-retorno-msg">
                        <CheckCircle2 size={20} className="icon-success" />
                        <span>Nenhum paciente sem retorno no momento</span>
                      </div>
                    ) : (
                      <div className="sem-retorno-list">
                        {pacientesSemRetorno.map((patient) => (
                          <div 
                            key={patient.id} 
                            className="sem-retorno-item"
                            onClick={() => handleOpenPatientProfile(patient.id)}
                            title="Clique para ver o perfil do paciente"
                          >
                            <div className="item-left">
                              <User size={16} className="item-icon" />
                              <span className="patient-name-link">{patient.nome}</span>
                            </div>
                            <div className="item-right">
                              <span className="last-date">{formatDate(patient.ultima_consulta)}</span>
                              <ChevronRight size={16} className="arrow-icon" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

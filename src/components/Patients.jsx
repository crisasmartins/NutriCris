import React, { useState, useEffect } from 'react';
import { sql } from '../lib/neon';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, Search, X, Calendar, Phone, Mail, 
  Activity, ArrowLeft, Plus, CheckCircle2, Clock, FileText, AlertCircle 
} from 'lucide-react';

export default function Patients({ selectedPatientId, onSelectPatient }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConsultaModal, setShowConsultaModal] = useState(false);

  // Selected Patient Details
  const [patientDetail, setPatientDetail] = useState(null);
  const [patientConsultas, setPatientConsultas] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    data_nascimento: '',
    sexo: 'Feminino',
    peso_inicial: '',
    altura: '',
    objetivo_texto: '',
    patologias: '',
    restricoes_alimentares: '',
    observacoes: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // New Consultation Form State
  const [newConsulta, setNewConsulta] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState('');

  // Load Patients List
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

  // Load selected patient details
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientProfile(selectedPatientId);
    } else {
      setPatientDetail(null);
      setPatientConsultas([]);
    }
  }, [selectedPatientId]);

  const loadPatientProfile = async (id) => {
    setLoadingDetail(true);
    try {
      const [patRes, conRes] = await Promise.all([
        sql`SELECT * FROM pacientes WHERE id = ${id} AND nutricionista_id = ${user.id}`,
        sql`SELECT * FROM consultas WHERE paciente_id = ${id} ORDER BY data_consulta DESC`
      ]);

      if (patRes.length > 0) {
        setPatientDetail(patRes[0]);
        setPatientConsultas(conRes);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil do paciente:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Create Patient Submit
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!newPatient.nome.trim()) {
      setAddError('O nome do paciente é obrigatório.');
      return;
    }

    setAddLoading(true);
    try {
      await sql`
        INSERT INTO pacientes (
          nutricionista_id, nome, email, telefone, whatsapp, 
          data_nascimento, sexo, peso_inicial, altura, 
          objetivo_texto, observacoes
        ) VALUES (
          ${user.id}, 
          ${newPatient.nome.trim()}, 
          ${newPatient.email.trim() || null}, 
          ${newPatient.telefone.trim() || null}, 
          ${newPatient.whatsapp.trim() || null}, 
          ${newPatient.data_nascimento || null}, 
          ${newPatient.sexo}, 
          ${newPatient.peso_inicial ? parseFloat(newPatient.peso_inicial) : null}, 
          ${newPatient.altura ? parseFloat(newPatient.altura) : null}, 
          ${newPatient.objetivo_texto.trim() || null}, 
          ${newPatient.observacoes.trim() || null}
        )
      `;

      setShowAddModal(false);
      setNewPatient({
        nome: '', email: '', telefone: '', whatsapp: '',
        data_nascimento: '', sexo: 'Feminino', peso_inicial: '',
        altura: '', objetivo_texto: '', patologias: '',
        restricoes_alimentares: '', observacoes: ''
      });
      fetchPatients();
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      setAddError('Erro ao cadastrar paciente. Verifique os dados inseridos.');
    } finally {
      setAddLoading(false);
    }
  };

  // Create Consultation Submit
  const handleCreateConsulta = async (e) => {
    e.preventDefault();
    setConsultaError('');
    if (!selectedPatientId) return;

    setConsultaLoading(true);
    try {
      await sql`
        INSERT INTO consultas (
          paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
        ) VALUES (
          ${selectedPatientId},
          ${newConsulta.data_consulta || new Date().toISOString().split('T')[0]},
          ${newConsulta.peso ? parseFloat(newConsulta.peso) : null},
          ${newConsulta.cintura ? parseFloat(newConsulta.cintura) : null},
          ${newConsulta.quadril ? parseFloat(newConsulta.quadril) : null},
          ${newConsulta.percentual_gordura ? parseFloat(newConsulta.percentual_gordura) : null},
          ${newConsulta.observacoes.trim() || null},
          ${newConsulta.proximo_retorno || null}
        )
      `;

      setShowConsultaModal(false);
      setNewConsulta({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '', cintura: '', quadril: '', percentual_gordura: '', observacoes: '', proximo_retorno: ''
      });
      loadPatientProfile(selectedPatientId);
      fetchPatients();
    } catch (err) {
      console.error('Erro ao registrar consulta:', err);
      setConsultaError('Erro ao registrar consulta.');
    } finally {
      setConsultaLoading(false);
    }
  };

  // Filtered List
  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informada';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
      return dateStr;
    }
  };

  // RENDER PATIENT PROFILE VIEW
  if (selectedPatientId && patientDetail) {
    return (
      <div className="patient-profile-wrapper">
        <button className="btn-back" onClick={() => onSelectPatient(null)}>
          <ArrowLeft size={18} />
          <span>Voltar para Lista de Pacientes</span>
        </button>

        {loadingDetail ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando perfil do paciente...</p>
          </div>
        ) : (
          <div className="profile-container">
            {/* Header Card */}
            <div className="profile-header-card">
              <div className="profile-main-info">
                <div className="profile-avatar">
                  {patientDetail.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="profile-name">{patientDetail.nome}</h1>
                  <p className="profile-subtitle">
                    {patientDetail.sexo || 'Paciente'} 
                    {calculateAge(patientDetail.data_nascimento) ? ` • ${calculateAge(patientDetail.data_nascimento)} anos` : ''}
                  </p>
                </div>
              </div>

              <button className="btn-primary" onClick={() => setShowConsultaModal(true)}>
                <Plus size={18} />
                <span>Nova Consulta</span>
              </button>
            </div>

            {/* Grid Layout: Contact & Bio Metrics */}
            <div className="profile-details-grid">
              <div className="info-card">
                <h3>Informações Pessoais</h3>
                <div className="info-list">
                  <div className="info-item">
                    <Mail size={16} className="info-icon" />
                    <div>
                      <span className="info-label">E-mail</span>
                      <span className="info-val">{patientDetail.email || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <Phone size={16} className="info-icon" />
                    <div>
                      <span className="info-label">Telefone / WhatsApp</span>
                      <span className="info-val">{patientDetail.whatsapp || patientDetail.telefone || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <Calendar size={16} className="info-icon" />
                    <div>
                      <span className="info-label">Data de Nascimento</span>
                      <span className="info-val">{formatDate(patientDetail.data_nascimento)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Medidas Iniciais</h3>
                <div className="metrics-row">
                  <div className="metric-box">
                    <span className="metric-label">Peso Inicial</span>
                    <span className="metric-val">{patientDetail.peso_inicial ? `${patientDetail.peso_inicial} kg` : '--'}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Altura</span>
                    <span className="metric-val">{patientDetail.altura ? `${patientDetail.altura} m` : '--'}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Objetivo</span>
                    <span className="metric-val text-truncate">{patientDetail.objetivo_texto || 'Sem objetivo'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Consultations History Section */}
            <div className="consultations-section">
              <div className="section-header">
                <h2>Histórico de Consultas ({patientConsultas.length})</h2>
              </div>

              {patientConsultas.length === 0 ? (
                <div className="empty-card">
                  <Clock size={32} style={{ color: 'var(--text-dim)' }} />
                  <p>Nenhuma consulta registrada para este paciente ainda.</p>
                  <button className="btn-secondary" onClick={() => setShowConsultaModal(true)} style={{ marginTop: '12px' }}>
                    <Plus size={16} />
                    <span>Registrar Primeira Consulta</span>
                  </button>
                </div>
              ) : (
                <div className="consultations-list">
                  {patientConsultas.map((c) => (
                    <div key={c.id} className="consulta-item-card">
                      <div className="consulta-date-badge">
                        <Calendar size={16} />
                        <span>{formatDate(c.data_consulta)}</span>
                      </div>

                      <div className="consulta-metrics">
                        {c.peso && <div><span>Peso:</span> <strong>{c.peso} kg</strong></div>}
                        {c.cintura && <div><span>Cintura:</span> <strong>{c.cintura} cm</strong></div>}
                        {c.quadril && <div><span>Quadril:</span> <strong>{c.quadril} cm</strong></div>}
                        {c.percentual_gordura && <div><span>% Gordura:</span> <strong>{c.percentual_gordura}%</strong></div>}
                      </div>

                      {c.proximo_retorno && (
                        <div className="consulta-return">
                          <Clock size={14} />
                          <span>Próximo Retorno: <strong>{formatDate(c.proximo_retorno)}</strong></span>
                        </div>
                      )}

                      {c.observacoes && (
                        <p className="consulta-notes">{c.observacoes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: NOVA CONSULTA */}
        {showConsultaModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>Nova Consulta</h3>
                <button className="modal-close" onClick={() => setShowConsultaModal(false)}>
                  <X size={20} />
                </button>
              </div>

              {consultaError && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{consultaError}</span>
                </div>
              )}

              <form onSubmit={handleCreateConsulta} className="modal-form">
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Data da Consulta *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newConsulta.data_consulta}
                      onChange={e => setNewConsulta({...newConsulta, data_consulta: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Próximo Retorno</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newConsulta.proximo_retorno}
                      onChange={e => setNewConsulta({...newConsulta, proximo_retorno: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 65.5"
                      className="form-input"
                      value={newConsulta.peso}
                      onChange={e => setNewConsulta({...newConsulta, peso: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">% Gordura</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 22.4"
                      className="form-input"
                      value={newConsulta.percentual_gordura}
                      onChange={e => setNewConsulta({...newConsulta, percentual_gordura: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Cintura (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 75.0"
                      className="form-input"
                      value={newConsulta.cintura}
                      onChange={e => setNewConsulta({...newConsulta, cintura: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Quadril (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 98.0"
                      className="form-input"
                      value={newConsulta.quadril}
                      onChange={e => setNewConsulta({...newConsulta, quadril: e.target.value})}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Observações da Consulta</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Evolução do paciente, orientações fornecidas..."
                    value={newConsulta.observacoes}
                    onChange={e => setNewConsulta({...newConsulta, observacoes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowConsultaModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={consultaLoading}>
                    {consultaLoading ? 'Salvando...' : 'Salvar Consulta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER PATIENTS LIST VIEW
  return (
    <div className="patients-page-wrapper">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1>Gestão de Pacientes</h1>
          <p>Consulte, cadastre e acompanhe o histórico dos seus pacientes.</p>
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nome ou e-mail..."
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

      {/* Patients Table / List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando pacientes...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="empty-card">
          <Users size={40} style={{ color: 'var(--pink-light)', opacity: 0.8 }} />
          <h3>{searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}</h3>
          <p>{searchTerm ? 'Tente buscar com outros termos.' : 'Comece cadastrando seu primeiro paciente no sistema.'}</p>
          {!searchTerm && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: '16px' }}>
              <UserPlus size={18} />
              <span>Cadastrar Primeiro Paciente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="patients-grid">
          {filteredPatients.map((p) => (
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
                  <span className="patient-card-email">{p.email || 'Sem e-mail'}</span>
                </div>
              </div>

              <div className="patient-card-details">
                {p.whatsapp || p.telefone ? (
                  <div className="detail-row">
                    <Phone size={14} />
                    <span>{p.whatsapp || p.telefone}</span>
                  </div>
                ) : null}

                <div className="detail-row">
                  <Calendar size={14} />
                  <span>Última Consulta: {formatDate(p.ultima_consulta)}</span>
                </div>
              </div>

              <div className="patient-card-footer">
                <span className="view-profile-btn">Ver Perfil Completo →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NOVO PACIENTE */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Novo Cadastro de Paciente</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="modal-form">
              <div className="input-group">
                <label className="input-label">Nome Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome do paciente"
                  value={newPatient.nome}
                  onChange={e => setNewPatient({...newPatient, nome: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">E-mail</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="paciente@email.com"
                    value={newPatient.email}
                    onChange={e => setNewPatient({...newPatient, email: e.target.value})}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="(00) 90000-0000"
                    value={newPatient.whatsapp}
                    onChange={e => setNewPatient({...newPatient, whatsapp: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Data de Nascimento</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newPatient.data_nascimento}
                    onChange={e => setNewPatient({...newPatient, data_nascimento: e.target.value})}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Sexo</label>
                  <select
                    className="form-input"
                    value={newPatient.sexo}
                    onChange={e => setNewPatient({...newPatient, sexo: e.target.value})}
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Peso Inicial (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="Ex: 70.0"
                    value={newPatient.peso_inicial}
                    onChange={e => setNewPatient({...newPatient, peso_inicial: e.target.value})}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Ex: 1.65"
                    value={newPatient.altura}
                    onChange={e => setNewPatient({...newPatient, altura: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Objetivo Principal</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ex: Emagrecimento, reeducação alimentar, ganho de massa..."
                  value={newPatient.objetivo_texto}
                  onChange={e => setNewPatient({...newPatient, objetivo_texto: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={addLoading}>
                  {addLoading ? 'Cadastrando...' : 'Cadastrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

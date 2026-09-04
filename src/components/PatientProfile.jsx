import React, { useState, useEffect } from 'react';
import { sql } from '../lib/neon';
import { useAuth } from '../context/AuthContext';
import WeightChart from './WeightChart';
import ManualMealPlanManager from './ManualMealPlanManager';
import { 
  ArrowLeft, User, Stethoscope, Clock, FileText, Plus, X, 
  Calendar, Check, AlertCircle, CheckCircle2, Sparkles, HeartPulse, 
  Scale, Droplet, Activity, Mail, Phone, Edit3, Save, Eye, ChevronRight
} from 'lucide-react';

const PRESET_OBJETIVOS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar'
];

const PRESET_NIVEL_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo'
];

const PRESET_PATOLOGIAS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto'
];

const PRESET_RESTRICOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar'
];

const PRESET_ALERGIAS = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar'
];

export default function PatientProfile({ patientId, onBack }) {
  const { user } = useAuth();
  
  // Main Page Section State ('dados' | 'consultas' | 'planos')
  const [activeSection, setActiveSection] = useState('dados');
  
  // Sub-tab state for Section 1 ('pessoal' | 'clinico' | 'habitos')
  const [editTab, setEditTab] = useState('pessoal');

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Patient Record & Consultation & Plan States from DB
  const [patientData, setPatientData] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [planos, setPlanos] = useState([]);

  // Selected Meal Plan for Modal View
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);

  // New Consultation Modal State
  const [showConsultaModal, setShowConsultaModal] = useState(false);
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

  // Custom Tag Input States for Patologias, Restrições, Alergias
  const [customPatologia, setCustomPatologia] = useState('');
  const [customRestricao, setCustomRestricao] = useState('');
  const [customAlergia, setCustomAlergia] = useState('');

  // Load Real-time Patient Data from Neon DB
  const loadPatientProfileData = async () => {
    if (!patientId || !user?.id) return;
    setLoading(true);
    try {
      const [patRes, conRes, plaRes] = await Promise.all([
        sql`SELECT * FROM pacientes WHERE id = ${patientId}`,
        sql`SELECT * FROM consultas WHERE paciente_id = ${patientId} ORDER BY data_consulta DESC`,
        sql`SELECT * FROM planos_alimentares WHERE paciente_id = ${patientId} ORDER BY created_at DESC`
      ]);

      if (patRes.length > 0) {
        const p = patRes[0];
        setPatientData({
          ...p,
          objetivos: Array.isArray(p.objetivos) ? p.objetivos : [],
          patologias: Array.isArray(p.patologias) ? p.patologias : [],
          restricoes_alimentares: Array.isArray(p.restricoes_alimentares) ? p.restricoes_alimentares : [],
          alergias: Array.isArray(p.alergias) ? p.alergias : [],
          nome: p.nome || '',
          email: p.email || '',
          telefone: p.telefone || '',
          whatsapp: p.whatsapp || '',
          data_nascimento: p.data_nascimento || '',
          sexo: p.sexo || 'Feminino',
          peso_inicial: p.peso_inicial || '',
          altura: p.altura || '',
          objetivo_texto: p.objetivo_texto || '',
          nivel_atividade: p.nivel_atividade || 'Levemente ativo',
          medicamentos: p.medicamentos || '',
          suplementos: p.suplementos || '',
          refeicoes_por_dia: p.refeicoes_por_dia || '',
          horario_acorda: p.horario_acorda || '',
          horario_dorme: p.horario_dorme || '',
          litros_agua: p.litros_agua || '',
          atividade_fisica: Boolean(p.atividade_fisica),
          atividade_fisica_descricao: p.atividade_fisica_descricao || '',
          observacoes: p.observacoes || ''
        });
        setConsultas(conRes);
        setPlanos(plaRes);
      }
    } catch (err) {
      console.error('Erro ao carregar dados em tempo real do paciente:', err);
      setErrorMsg('Erro ao carregar perfil do paciente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientProfileData();
  }, [patientId, user]);

  // Helpers
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const formatPhone = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15);
  };

  const handleTimeBlur = (field) => {
    const raw = patientData[field];
    if (!raw) return;
    const clean = String(raw).trim().replace(/\D/g, '');
    if (!clean) return;

    let formatted = raw;
    if (clean.length === 1 || clean.length === 2) {
      let h = parseInt(clean, 10);
      if (h > 23) h = 23;
      formatted = `${h.toString().padStart(2, '0')}:00`;
    } else if (clean.length === 3) {
      let h = parseInt(clean.substring(0, 1), 10);
      let m = parseInt(clean.substring(1, 3), 10);
      if (m > 59) m = 59;
      formatted = `0${h}:${m.toString().padStart(2, '0')}`;
    } else if (clean.length >= 4) {
      let h = parseInt(clean.substring(0, 2), 10);
      let m = parseInt(clean.substring(2, 4), 10);
      if (h > 23) h = 23;
      if (m > 59) m = 59;
      formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    setPatientData(prev => ({ ...prev, [field]: formatted }));
  };

  // IMC Calculator
  const getIMC = () => {
    if (!patientData) return null;
    const peso = parseFloat(patientData.peso_inicial);
    const alturaCm = parseFloat(patientData.altura);
    if (!peso || !alturaCm || peso <= 0 || alturaCm <= 0) return null;

    const alturaM = alturaCm / 100;
    const imc = peso / (alturaM * alturaM);
    let classif = '';
    if (imc < 18.5) classif = 'Abaixo do peso';
    else if (imc < 25) classif = 'Peso normal';
    else if (imc < 30) classif = 'Sobrepeso';
    else if (imc < 35) classif = 'Obesidade Grau 1';
    else if (imc < 40) classif = 'Obesidade Grau 2';
    else classif = 'Obesidade Grau 3';

    return { value: imc.toFixed(1), classif };
  };

  const imcData = getIMC();

  // Multi-select Toggles
  const toggleArrayItem = (field, item) => {
    setPatientData(prev => {
      const list = prev[field] || [];
      if (list.includes(item)) {
        return { ...prev, [field]: list.filter(i => i !== item) };
      } else {
        const filtered = list.filter(i => i !== 'Nenhum');
        return { ...prev, [field]: [...filtered, item] };
      }
    });
  };

  const toggleNenhum = (field) => {
    setPatientData(prev => {
      const list = prev[field] || [];
      if (list.includes('Nenhum')) {
        return { ...prev, [field]: [] };
      } else {
        return { ...prev, [field]: ['Nenhum'] };
      }
    });
  };

  const addCustomTag = (field, tagValue, setTagValue) => {
    if (!tagValue.trim()) return;
    const cleanTag = tagValue.trim();
    setPatientData(prev => {
      const list = (prev[field] || []).filter(i => i !== 'Nenhum');
      if (!list.includes(cleanTag)) {
        return { ...prev, [field]: [...list, cleanTag] };
      }
      return prev;
    });
    setTagValue('');
  };

  const removeTag = (field, item) => {
    setPatientData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(i => i !== item)
    }));
  };

  // SAVE PATIENT EDITS (SEÇÃO 1)
  const handleSavePatientEdits = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!patientData.nome.trim()) {
      setErrorMsg('O nome completo é obrigatório.');
      return;
    }

    setSaveLoading(true);
    try {
      await sql`
        UPDATE pacientes SET
          nome = ${patientData.nome.trim()},
          data_nascimento = ${patientData.data_nascimento || null},
          sexo = ${patientData.sexo},
          telefone = ${patientData.telefone ? patientData.telefone.trim() : null},
          whatsapp = ${patientData.whatsapp ? patientData.whatsapp.trim() : null},
          email = ${patientData.email ? patientData.email.trim() : null},
          peso_inicial = ${patientData.peso_inicial ? parseFloat(patientData.peso_inicial) : null},
          altura = ${patientData.altura ? parseFloat(patientData.altura) : null},
          objetivos = ${patientData.objetivos},
          objetivo_texto = ${patientData.objetivo_texto ? patientData.objetivo_texto.trim() : null},
          nivel_atividade = ${patientData.nivel_atividade},
          patologias = ${patientData.patologias},
          restricoes_alimentares = ${patientData.restricoes_alimentares},
          alergias = ${patientData.alergias},
          medicamentos = ${patientData.medicamentos ? patientData.medicamentos.trim() : null},
          suplementos = ${patientData.suplementos ? patientData.suplementos.trim() : null},
          refeicoes_por_dia = ${patientData.refeicoes_por_dia ? parseInt(patientData.refeicoes_por_dia, 10) : null},
          horario_acorda = ${patientData.horario_acorda ? String(patientData.horario_acorda).trim() : null},
          horario_dorme = ${patientData.horario_dorme ? String(patientData.horario_dorme).trim() : null},
          litros_agua = ${patientData.litros_agua ? parseFloat(patientData.litros_agua) : null},
          atividade_fisica = ${patientData.atividade_fisica},
          atividade_fisica_descricao = ${patientData.atividade_fisica_descricao ? patientData.atividade_fisica_descricao.trim() : null},
          observacoes = ${patientData.observacoes ? patientData.observacoes.trim() : null}
        WHERE id = ${patientId} AND nutricionista_id = ${user.id};
      `;

      setSuccessMsg('Alterações salvas com sucesso no Neon DB!');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadPatientProfileData();
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
      setErrorMsg('Erro ao salvar alterações no Neon DB.');
    } finally {
      setSaveLoading(false);
    }
  };

  // SAVE NEW CONSULTATION (SEÇÃO 2)
  const handleSaveConsulta = async (e) => {
    e.preventDefault();
    setConsultaError('');

    setConsultaLoading(true);
    try {
      await sql`
        INSERT INTO consultas (
          paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
        ) VALUES (
          ${patientId},
          ${newConsulta.data_consulta || new Date().toISOString().split('T')[0]},
          ${newConsulta.peso ? parseFloat(newConsulta.peso) : null},
          ${newConsulta.cintura ? parseFloat(newConsulta.cintura) : null},
          ${newConsulta.quadril ? parseFloat(newConsulta.quadril) : null},
          ${newConsulta.percentual_gordura ? parseFloat(newConsulta.percentual_gordura) : null},
          ${newConsulta.observacoes.trim() || null},
          ${newConsulta.proximo_retorno || null}
        );
      `;

      setShowConsultaModal(false);
      setNewConsulta({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '', cintura: '', quadril: '', percentual_gordura: '', observacoes: '', proximo_retorno: ''
      });

      setSuccessMsg('Nova consulta registrada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadPatientProfileData();
    } catch (err) {
      console.error('Erro ao registrar consulta:', err);
      setConsultaError('Erro ao registrar consulta.');
    } finally {
      setConsultaLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
      return dateStr;
    }
  };

  // Prepare Chart Data
  // Combine creation/initial weight + consultas (chronological ASC)
  const getWeightHistory = () => {
    const history = [];

    // Reverse consultas to get chronological order (ASC)
    const sortedConsultas = [...consultas].sort((a, b) => new Date(a.data_consulta) - new Date(b.data_consulta));

    sortedConsultas.forEach(c => {
      if (c.peso && !isNaN(c.peso)) {
        history.push({
          date: formatDate(c.data_consulta),
          weight: parseFloat(c.peso),
          rawDate: new Date(c.data_consulta)
        });
      }
    });

    // If no consultation weights exist but patientData has peso_inicial, display initial weight
    if (history.length === 0 && patientData?.peso_inicial) {
      history.push({
        date: 'Inicial',
        weight: parseFloat(patientData.peso_inicial),
        rawDate: new Date()
      });
    }

    return history;
  };

  const weightChartData = getWeightHistory();

  if (loading) {
    return (
      <div className="patient-profile-wrapper">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Voltar para Lista de Pacientes</span>
        </button>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando perfil do paciente em tempo real...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="patient-profile-wrapper">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Voltar para Lista de Pacientes</span>
        </button>
        <div className="empty-card">
          <AlertCircle size={40} style={{ color: '#ef4444' }} />
          <h3>Paciente não encontrado</h3>
          <p>O paciente solicitado não foi localizado no Neon DB.</p>
        </div>
      </div>
    );
  }

  const age = calculateAge(patientData.data_nascimento);

  return (
    <div className="patient-profile-wrapper">
      {/* Top Back Action */}
      <button className="btn-back" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>Voltar para Lista de Pacientes</span>
      </button>

      {/* Global Success / Error Toast Banners */}
      {successMsg && (
        <div className="alert alert-success animate-fade-in">
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error animate-fade-in">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-main-info">
          <div className="profile-avatar">
            {patientData.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="profile-name">{patientData.nome}</h1>
            <p className="profile-subtitle">
              {patientData.sexo || 'Paciente'} 
              {age !== null ? ` • ${age} anos` : ''} 
              {patientData.email ? ` • ${patientData.email}` : ''}
            </p>
          </div>
        </div>

        <div className="header-quick-actions">
          <button className="btn-secondary" onClick={() => setShowConsultaModal(true)}>
            <Plus size={18} />
            <span>Nova Consulta</span>
          </button>
        </div>
      </div>

      {/* ==========================================================================
         SEÇÕES PRINCIPAIS (1. Dados do Paciente | 2. Consultas | 3. Planos Alimentares)
         ========================================================================== */}
      <div className="profile-sections-bar">
        <button 
          className={`section-tab-btn ${activeSection === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveSection('dados')}
        >
          <User size={18} />
          <span>1. Dados do Paciente</span>
        </button>

        <button 
          className={`section-tab-btn ${activeSection === 'consultas' ? 'active' : ''}`}
          onClick={() => setActiveSection('consultas')}
        >
          <Scale size={18} />
          <span>2. Consultas ({consultas.length})</span>
        </button>

        <button 
          className={`section-tab-btn ${activeSection === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveSection('planos')}
        >
          <FileText size={18} />
          <span>3. Planos Alimentares ({planos.length})</span>
        </button>
      </div>

      {/* ==========================================================================
         SEÇÃO 1 — DADOS DO PACIENTE (COM EDIÇÃO DIRETA NAS 3 ABAS)
         ========================================================================== */}
      {activeSection === 'dados' && (
        <div className="profile-section-card animate-fade-in">
          {/* Sub-tab navigation for the 3 edit tabs */}
          <div className="edit-subtabs-bar">
            <button 
              type="button" 
              className={`edit-subtab ${editTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setEditTab('pessoal')}
            >
              <User size={16} />
              <span>Pessoal</span>
            </button>
            <button 
              type="button" 
              className={`edit-subtab ${editTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setEditTab('clinico')}
            >
              <Stethoscope size={16} />
              <span>Clínico</span>
            </button>
            <button 
              type="button" 
              className={`edit-subtab ${editTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setEditTab('habitos')}
            >
              <Clock size={16} />
              <span>Hábitos</span>
            </button>
          </div>

          <form onSubmit={handleSavePatientEdits} className="edit-patient-form">
            {/* SUB-ABA: PESSOAL */}
            {editTab === 'pessoal' && (
              <div className="tab-pane animate-fade-in">
                <div className="form-grid">
                  <div className="input-group full-width">
                    <label className="input-label">Nome Completo *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={patientData.nome}
                      onChange={e => setPatientData({ ...patientData, nome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Data de Nascimento</label>
                    <input
                      type="date"
                      className="form-input"
                      value={patientData.data_nascimento}
                      onChange={e => setPatientData({ ...patientData, data_nascimento: e.target.value })}
                    />
                    {age !== null && (
                      <span className="field-hint-badge">
                        <Sparkles size={12} /> Idade atual: {age} anos
                      </span>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">Sexo</label>
                    <select
                      className="form-input"
                      value={patientData.sexo}
                      onChange={e => setPatientData({ ...patientData, sexo: e.target.value })}
                    >
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Telefone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={patientData.telefone}
                      onChange={e => setPatientData({ ...patientData, telefone: formatPhone(e.target.value) })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">WhatsApp</label>
                    <input
                      type="text"
                      className="form-input"
                      value={patientData.whatsapp}
                      onChange={e => setPatientData({ ...patientData, whatsapp: formatPhone(e.target.value) })}
                    />
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">E-mail</label>
                    <input
                      type="email"
                      className="form-input"
                      value={patientData.email}
                      onChange={e => setPatientData({ ...patientData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA: CLÍNICO */}
            {editTab === 'clinico' && (
              <div className="tab-pane animate-fade-in">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Peso Atual</label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={patientData.peso_inicial}
                        onChange={e => setPatientData({ ...patientData, peso_inicial: e.target.value })}
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Altura</label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        step="1"
                        className="form-input"
                        value={patientData.altura}
                        onChange={e => setPatientData({ ...patientData, altura: e.target.value })}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  {/* IMC Box */}
                  <div className="input-group full-width imc-card-display">
                    <div className="imc-header">
                      <span className="input-label">IMC (Índice de Massa Corporal)</span>
                      <span className="imc-badge-read">Calculado automaticamente</span>
                    </div>
                    <div className="imc-value-box">
                      {imcData ? (
                        <>
                          <span className="imc-number">{imcData.value}</span>
                          <span className="imc-unit">kg/m²</span>
                          <span className="imc-classification">— {imcData.classif}</span>
                        </>
                      ) : (
                        <span className="imc-placeholder">Preencha peso e altura para calcular o IMC.</span>
                      )}
                    </div>
                  </div>

                  {/* Objetivos */}
                  <div className="input-group full-width">
                    <label className="input-label">Objetivo Nutricional (Múltipla escolha)</label>
                    <div className="chips-grid">
                      {PRESET_OBJETIVOS.map(obj => {
                        const selected = (patientData.objetivos || []).includes(obj);
                        return (
                          <button
                            key={obj}
                            type="button"
                            className={`chip-button ${selected ? 'active' : ''}`}
                            onClick={() => toggleArrayItem('objetivos', obj)}
                          >
                            {selected && <Check size={14} />}
                            <span>{obj}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">Detalhes Adicionais do Objetivo</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={patientData.objetivo_texto}
                      onChange={e => setPatientData({ ...patientData, objetivo_texto: e.target.value })}
                    />
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">Nível de Atividade Física</label>
                    <select
                      className="form-input"
                      value={patientData.nivel_atividade}
                      onChange={e => setPatientData({ ...patientData, nivel_atividade: e.target.value })}
                    >
                      {PRESET_NIVEL_ATIVIDADE.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Patologias */}
                  <div className="input-group full-width">
                    <label className="input-label">Patologias ou Condições de Saúde</label>
                    <div className="chips-grid">
                      <button
                        type="button"
                        className={`chip-button chip-nenhum ${(patientData.patologias || []).includes('Nenhum') ? 'active' : ''}`}
                        onClick={() => toggleNenhum('patologias')}
                      >
                        {(patientData.patologias || []).includes('Nenhum') && <Check size={14} />}
                        <span>Nenhum</span>
                      </button>

                      {PRESET_PATOLOGIAS.map(pat => {
                        const selected = (patientData.patologias || []).includes(pat);
                        return (
                          <button
                            key={pat}
                            type="button"
                            className={`chip-button ${selected ? 'active' : ''}`}
                            onClick={() => toggleArrayItem('patologias', pat)}
                          >
                            {selected && <Check size={14} />}
                            <span>{pat}</span>
                          </button>
                        );
                      })}

                      {(patientData.patologias || [])
                        .filter(p => !PRESET_PATOLOGIAS.includes(p) && p !== 'Nenhum')
                        .map(p => (
                          <span key={p} className="chip-button active custom-chip">
                            <span>{p}</span>
                            <X size={14} onClick={() => removeTag('patologias', p)} className="chip-remove" />
                          </span>
                        ))}
                    </div>

                    <div className="add-tag-row">
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="Adicionar patologia customizada..."
                        value={customPatologia}
                        onChange={e => setCustomPatologia(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomTag('patologias', customPatologia, setCustomPatologia);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => addCustomTag('patologias', customPatologia, setCustomPatologia)}
                      >
                        <Plus size={14} />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  {/* Restrições Alimentares */}
                  <div className="input-group full-width">
                    <label className="input-label">Restrições Alimentares</label>
                    <div className="chips-grid">
                      <button
                        type="button"
                        className={`chip-button chip-nenhum ${(patientData.restricoes_alimentares || []).includes('Nenhum') ? 'active' : ''}`}
                        onClick={() => toggleNenhum('restricoes_alimentares')}
                      >
                        {(patientData.restricoes_alimentares || []).includes('Nenhum') && <Check size={14} />}
                        <span>Nenhum</span>
                      </button>

                      {PRESET_RESTRICOES.map(res => {
                        const selected = (patientData.restricoes_alimentares || []).includes(res);
                        return (
                          <button
                            key={res}
                            type="button"
                            className={`chip-button ${selected ? 'active' : ''}`}
                            onClick={() => toggleArrayItem('restricoes_alimentares', res)}
                          >
                            {selected && <Check size={14} />}
                            <span>{res}</span>
                          </button>
                        );
                      })}

                      {(patientData.restricoes_alimentares || [])
                        .filter(r => !PRESET_RESTRICOES.includes(r) && r !== 'Nenhum')
                        .map(r => (
                          <span key={r} className="chip-button active custom-chip">
                            <span>{r}</span>
                            <X size={14} onClick={() => removeTag('restricoes_alimentares', r)} className="chip-remove" />
                          </span>
                        ))}
                    </div>

                    <div className="add-tag-row">
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="Adicionar restrição customizada..."
                        value={customRestricao}
                        onChange={e => setCustomRestricao(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomTag('restricoes_alimentares', customRestricao, setCustomRestricao);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => addCustomTag('restricoes_alimentares', customRestricao, setCustomRestricao)}
                      >
                        <Plus size={14} />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  {/* Alergias Alimentares */}
                  <div className="input-group full-width">
                    <label className="input-label">Alergias Alimentares</label>
                    <div className="chips-grid">
                      <button
                        type="button"
                        className={`chip-button chip-nenhum ${(patientData.alergias || []).includes('Nenhum') ? 'active' : ''}`}
                        onClick={() => toggleNenhum('alergias')}
                      >
                        {(patientData.alergias || []).includes('Nenhum') && <Check size={14} />}
                        <span>Nenhum</span>
                      </button>

                      {PRESET_ALERGIAS.map(alg => {
                        const selected = (patientData.alergias || []).includes(alg);
                        return (
                          <button
                            key={alg}
                            type="button"
                            className={`chip-button ${selected ? 'active' : ''}`}
                            onClick={() => toggleArrayItem('alergias', alg)}
                          >
                            {selected && <Check size={14} />}
                            <span>{alg}</span>
                          </button>
                        );
                      })}

                      {(patientData.alergias || [])
                        .filter(a => !PRESET_ALERGIAS.includes(a) && a !== 'Nenhum')
                        .map(a => (
                          <span key={a} className="chip-button active custom-chip">
                            <span>{a}</span>
                            <X size={14} onClick={() => removeTag('alergias', a)} className="chip-remove" />
                          </span>
                        ))}
                    </div>

                    <div className="add-tag-row">
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="Adicionar alergia customizada..."
                        value={customAlergia}
                        onChange={e => setCustomAlergia(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomTag('alergias', customAlergia, setCustomAlergia);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => addCustomTag('alergias', customAlergia, setCustomAlergia)}
                      >
                        <Plus size={14} />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">Medicamentos Contínuos</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={patientData.medicamentos}
                      onChange={e => setPatientData({ ...patientData, medicamentos: e.target.value })}
                    />
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">Suplementos em Uso</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={patientData.suplementos}
                      onChange={e => setPatientData({ ...patientData, suplementos: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA: HÁBITOS */}
            {editTab === 'habitos' && (
              <div className="tab-pane animate-fade-in">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Refeições por Dia</label>
                    <input
                      type="number"
                      className="form-input"
                      value={patientData.refeicoes_por_dia}
                      onChange={e => setPatientData({ ...patientData, refeicoes_por_dia: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Quantidade de Água por Dia</label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={patientData.litros_agua}
                        onChange={e => setPatientData({ ...patientData, litros_agua: e.target.value })}
                      />
                      <span className="input-suffix">litros</span>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Horário que Acorda</label>
                    <input
                      type="text"
                      className="form-input"
                      value={patientData.horario_acorda}
                      onChange={e => setPatientData({ ...patientData, horario_acorda: e.target.value })}
                      onBlur={() => handleTimeBlur('horario_acorda')}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Horário que Dorme</label>
                    <input
                      type="text"
                      className="form-input"
                      value={patientData.horario_dorme}
                      onChange={e => setPatientData({ ...patientData, horario_dorme: e.target.value })}
                      onBlur={() => handleTimeBlur('horario_dorme')}
                    />
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">Pratica Atividade Física?</label>
                    <div className="toggle-buttons-group">
                      <button
                        type="button"
                        className={`toggle-btn ${patientData.atividade_fisica ? 'active' : ''}`}
                        onClick={() => setPatientData({ ...patientData, atividade_fisica: true })}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${!patientData.atividade_fisica ? 'active' : ''}`}
                        onClick={() => setPatientData({ ...patientData, atividade_fisica: false })}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {patientData.atividade_fisica && (
                    <div className="input-group full-width animate-fade-in">
                      <label className="input-label">Qual atividade e frequência semanal?</label>
                      <input
                        type="text"
                        className="form-input"
                        value={patientData.atividade_fisica_descricao}
                        onChange={e => setPatientData({ ...patientData, atividade_fisica_descricao: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="input-group full-width">
                    <label className="input-label">Observações Gerais</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={patientData.observacoes}
                      onChange={e => setPatientData({ ...patientData, observacoes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Alterations Action */}
            <div className="save-bar-footer">
              <button 
                type="submit" 
                className="btn-primary btn-save-patient"
                disabled={saveLoading}
              >
                <Save size={18} />
                <span>{saveLoading ? 'Salvar Alterações...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================================================
         SEÇÃO 2 — CONSULTAS (GRÁFICO DE EVOLUÇÃO DE PESO + HISTÓRICO DE CONSULTAS)
         ========================================================================== */}
      {activeSection === 'consultas' && (
        <div className="profile-section-card animate-fade-in">
          {/* Gráfico de Evolução de Peso Sempre Visível */}
          <WeightChart data={weightChartData} />

          {/* Section Header with Nova Consulta Button */}
          <div className="consultas-section-header">
            <div>
              <h2>Histórico de Consultas ({consultas.length})</h2>
              <p>Consultas registradas em ordem cronológica decrescente.</p>
            </div>

            <button className="btn-primary" onClick={() => setShowConsultaModal(true)}>
              <Plus size={18} />
              <span>Nova Consulta</span>
            </button>
          </div>

          {/* Consultations List */}
          {consultas.length === 0 ? (
            <div className="empty-card">
              <Clock size={36} style={{ color: 'var(--pink-light)', opacity: 0.8 }} />
              <h3>Nenhuma consulta registrada ainda</h3>
              <p>Clique no botão abaixo para registrar a primeira consulta deste paciente.</p>
              <button className="btn-primary" onClick={() => setShowConsultaModal(true)} style={{ marginTop: '14px' }}>
                <Plus size={16} />
                <span>Registrar Primeira Consulta</span>
              </button>
            </div>
          ) : (
            <div className="consultations-list">
              {consultas.map((c) => (
                <div key={c.id} className="consulta-item-card">
                  <div className="consulta-card-top">
                    <div className="consulta-date-badge">
                      <Calendar size={16} />
                      <span>{formatDate(c.data_consulta)}</span>
                    </div>

                    {c.proximo_retorno && (
                      <div className="consulta-return">
                        <Clock size={14} />
                        <span>Próximo Retorno: <strong>{formatDate(c.proximo_retorno)}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="consulta-metrics">
                    {c.peso && <div><span>Peso:</span> <strong>{c.peso} kg</strong></div>}
                    {c.cintura && <div><span>Cintura:</span> <strong>{c.cintura} cm</strong></div>}
                    {c.quadril && <div><span>Quadril:</span> <strong>{c.quadril} cm</strong></div>}
                    {c.percentual_gordura && <div><span>% Gordura:</span> <strong>{c.percentual_gordura}%</strong></div>}
                  </div>

                  {c.observacoes && (
                    <p className="consulta-notes">{c.observacoes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================================================
         SEÇÃO 3 — PLANOS ALIMENTARES (MÓDULO MANUAL COMPLETO)
         ========================================================================== */}
      {activeSection === 'planos' && (
        <div className="profile-section-card animate-fade-in">
          <ManualMealPlanManager 
            pacienteId={patientId} 
            patientName={patientData?.nome}
            onUpdateCount={(count) => {
              if (planos.length !== count) {
                setPlanos(new Array(count).fill({}));
              }
            }}
          />
        </div>
      )}

      {/* ==========================================================================
         MODAL: NOVA CONSULTA
         ========================================================================== */}
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

            <form onSubmit={handleSaveConsulta} className="modal-form">
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
                  <label className="input-label">Peso Atual (kg)</label>
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
                  <label className="input-label">% de Gordura</label>
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

      {/* ==========================================================================
         MODAL: VISUALIZAR PLANO ALIMENTAR SELECIONADO
         ========================================================================== */}
      {selectedPlanModal && (
        <div className="modal-backdrop">
          <div className="modal-card modal-large">
            <div className="modal-header">
              <div>
                <h3>{selectedPlanModal.conteudo?.titulo || `Plano Alimentar — ${formatDate(selectedPlanModal.created_at)}`}</h3>
                <p className="profile-subtitle" style={{ fontSize: '0.85rem' }}>
                  Gerado em: {formatDate(selectedPlanModal.created_at)} • {selectedPlanModal.conteudo?.paciente || patientData.nome}
                </p>
              </div>
              <button className="modal-close" onClick={() => setSelectedPlanModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="plano-content-preview">
              {typeof selectedPlanModal.conteudo === 'object' && selectedPlanModal.conteudo !== null ? (
                <div className="plano-formatted-body">
                  {/* General Info */}
                  <div className="plano-meta-box">
                    {selectedPlanModal.conteudo.meta && (
                      <div><strong>Objetivo:</strong> {selectedPlanModal.conteudo.meta}</div>
                    )}
                    {selectedPlanModal.conteudo.restricoes && (
                      <div><strong>Restrições:</strong> {Array.isArray(selectedPlanModal.conteudo.restricoes) ? selectedPlanModal.conteudo.restricoes.join(', ') : selectedPlanModal.conteudo.restricoes}</div>
                    )}
                    {selectedPlanModal.conteudo.refeicoes_por_dia && (
                      <div><strong>Frequência:</strong> {selectedPlanModal.conteudo.refeicoes_por_dia} refeições por dia</div>
                    )}
                  </div>

                  {/* Orientações Gerais */}
                  {Array.isArray(selectedPlanModal.conteudo.orientacoes) && selectedPlanModal.conteudo.orientacoes.length > 0 && (
                    <div className="plano-orientacoes-box">
                      <h4>💡 Orientações Gerais</h4>
                      <ul>
                        {selectedPlanModal.conteudo.orientacoes.map((ori, i) => (
                          <li key={i}>{ori}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 7 Dias da Semana */}
                  {Array.isArray(selectedPlanModal.conteudo.dias) ? (
                    <div className="plano-dias-grid">
                      {selectedPlanModal.conteudo.dias.map((d, index) => (
                        <div key={index} className="plano-dia-card">
                          <h4 className="plano-dia-header">{d.dia}</h4>
                          <div className="plano-refeicoes-list">
                            {Array.isArray(d.refeicoes) && d.refeicoes.map((ref, rIdx) => (
                              <div key={rIdx} className="plano-refeicao-item">
                                <span className="ref-nome">{ref.nome}</span>
                                <p className="ref-alimento">{ref.alimento}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedPlanModal.conteudo.cardapio ? (
                    <div className="plano-dias-grid">
                      {Object.values(selectedPlanModal.conteudo.cardapio).map((cDay, index) => (
                        <div key={index} className="plano-dia-card">
                          <h4 className="plano-dia-header">{cDay.dia}</h4>
                          <div className="plano-refeicoes-list">
                            {cDay.cafe_da_manha && (
                              <div className="plano-refeicao-item">
                                <span className="ref-nome">Café da Manhã</span>
                                <p className="ref-alimento">{cDay.cafe_da_manha}</p>
                              </div>
                            )}
                            {cDay.almoco && (
                              <div className="plano-refeicao-item">
                                <span className="ref-nome">Almoço</span>
                                <p className="ref-alimento">{cDay.almoco}</p>
                              </div>
                            )}
                            {cDay.lanche_da_tarde && (
                              <div className="plano-refeicao-item">
                                <span className="ref-nome">Lanche da Tarde</span>
                                <p className="ref-alimento">{cDay.lanche_da_tarde}</p>
                              </div>
                            )}
                            {cDay.jantar && (
                              <div className="plano-refeicao-item">
                                <span className="ref-nome">Jantar</span>
                                <p className="ref-alimento">{cDay.jantar}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="plano-json-pretty">
                      {JSON.stringify(selectedPlanModal.conteudo, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <pre className="plano-json-pretty">
                  {selectedPlanModal.conteudo}
                </pre>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={() => setSelectedPlanModal(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

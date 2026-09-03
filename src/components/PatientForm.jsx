import React, { useState } from 'react';
import { sql } from '../lib/neon';
import { ensureNutricionistaExists } from '../lib/neon';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, User, Stethoscope, Clock, Check, Plus, X, 
  AlertCircle, Sparkles, CheckCircle2 
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

export default function PatientForm({ onCancel, onSaveSuccess }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'

  // Success & Error Toast State
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    // Aba 1 — Pessoal
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    telefone: '',
    whatsapp: '',
    email: '',

    // Aba 2 — Clínico
    peso_inicial: '',
    altura: '', // em cm
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: 'Levemente ativo',
    patologias: [],
    restricoes_alimentares: [],
    alergias: [],
    medicamentos: '',
    suplementos: '',

    // Aba 3 — Hábitos
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  // Custom Input States for Tag lists
  const [customPatologia, setCustomPatologia] = useState('');
  const [customRestricao, setCustomRestricao] = useState('');
  const [customAlergia, setCustomAlergia] = useState('');

  // Auto Age Calculation
  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return '';
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} anos` : '';
  };

  // Phone / WhatsApp Formatter
  const formatPhone = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15);
  };

  // Time Formatter for Horário Acorda / Dorme
  const handleTimeBlur = (field) => {
    const raw = formData[field];
    if (!raw) return;
    const clean = raw.trim().replace(/\D/g, '');
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

    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // Automatic IMC Calculation
  const getIMC = () => {
    const peso = parseFloat(formData.peso_inicial);
    const alturaCm = parseFloat(formData.altura);
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
    setFormData(prev => {
      const list = prev[field] || [];
      if (list.includes(item)) {
        return { ...prev, [field]: list.filter(i => i !== item) };
      } else {
        // If adding an item, ensure 'Nenhum' is removed if present
        const filtered = list.filter(i => i !== 'Nenhum');
        return { ...prev, [field]: [...filtered, item] };
      }
    });
  };

  const toggleNenhum = (field) => {
    setFormData(prev => {
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
    setFormData(prev => {
      const list = (prev[field] || []).filter(i => i !== 'Nenhum');
      if (!list.includes(cleanTag)) {
        return { ...prev, [field]: [...list, cleanTag] };
      }
      return prev;
    });
    setTagValue('');
  };

  const removeTag = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(i => i !== item)
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Rule: Nome completo is mandatory
    if (!formData.nome.trim()) {
      setErrorMsg('O nome completo é obrigatório.');
      setActiveTab('pessoal');
      return;
    }

    setLoading(true);
    try {
      const result = await sql`
        INSERT INTO pacientes (
          nutricionista_id, nome, data_nascimento, sexo, telefone, whatsapp, email,
          peso_inicial, altura, objetivos, objetivo_texto, nivel_atividade,
          patologias, restricoes_alimentares, alergias, medicamentos, suplementos,
          refeicoes_por_dia, horario_acorda, horario_dorme, litros_agua,
          atividade_fisica, atividade_fisica_descricao, observacoes
        ) VALUES (
          ${user.id},
          ${formData.nome.trim()},
          ${formData.data_nascimento || null},
          ${formData.sexo},
          ${formData.telefone.trim() || null},
          ${formData.whatsapp.trim() || null},
          ${formData.email.trim() || null},
          ${formData.peso_inicial ? parseFloat(formData.peso_inicial) : null},
          ${formData.altura ? parseFloat(formData.altura) : null},
          ${formData.objetivos},
          ${formData.objetivo_texto.trim() || null},
          ${formData.nivel_atividade},
          ${formData.patologias},
          ${formData.restricoes_alimentares},
          ${formData.alergias},
          ${formData.medicamentos.trim() || null},
          ${formData.suplementos.trim() || null},
          ${formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia, 10) : null},
          ${formData.horario_acorda.trim() || null},
          ${formData.horario_dorme.trim() || null},
          ${formData.litros_agua ? parseFloat(formData.litros_agua) : null},
          ${formData.atividade_fisica},
          ${formData.atividade_fisica_descricao.trim() || null},
          ${formData.observacoes.trim() || null}
        )
        RETURNING id;
      `;

      const newPatientId = result[0]?.id;

      setSuccessMsg('Paciente cadastrado com sucesso!');

      setTimeout(() => {
        if (onSaveSuccess && newPatientId) {
          onSaveSuccess(newPatientId);
        }
      }, 1000);

    } catch (err) {
      console.error('Erro ao salvar paciente:', err);
      setErrorMsg('Ocorreu um erro ao salvar o paciente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-patient-page-container">
      {/* Header with Navigation */}
      <div className="new-patient-header">
        <button className="btn-back" onClick={onCancel}>
          <ArrowLeft size={18} />
          <span>Voltar para Lista de Pacientes</span>
        </button>

        <div className="header-title-box">
          <h1>Cadastrar Novo Paciente</h1>
          <p>Preencha os dados organizados em 3 abas para um acompanhamento nutricional completo.</p>
        </div>
      </div>

      {/* Toast Alerts */}
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

      {/* Main Tabbed Card Form */}
      <div className="patient-form-card">
        {/* Navigation Tabs */}
        <div className="form-tabs-bar">
          <button 
            type="button"
            className={`tab-item ${activeTab === 'pessoal' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoal')}
          >
            <User size={18} />
            <span>1. Pessoal</span>
            {formData.nome.trim() && <span className="tab-dot-valid"></span>}
          </button>

          <button 
            type="button"
            className={`tab-item ${activeTab === 'clinico' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinico')}
          >
            <Stethoscope size={18} />
            <span>2. Clínico</span>
          </button>

          <button 
            type="button"
            className={`tab-item ${activeTab === 'habitos' ? 'active' : ''}`}
            onClick={() => setActiveTab('habitos')}
          >
            <Clock size={18} />
            <span>3. Hábitos</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="patient-form-content">
          
          {/* ================= ABA 1: PESSOAL ================= */}
          {activeTab === 'pessoal' && (
            <div className="tab-pane animate-fade-in">
              <div className="tab-pane-title">
                <h2>Dados Pessoais e Contato</h2>
                <p>Informações básicas de identificação e contato do paciente.</p>
              </div>

              <div className="form-grid">
                {/* Nome completo */}
                <div className="input-group full-width">
                  <label className="input-label">
                    Nome Completo <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Maria Clara Silva"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="input-group">
                  <label className="input-label">Data de Nascimento</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.data_nascimento}
                    onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                  {formData.data_nascimento && calculateAge(formData.data_nascimento) && (
                    <span className="field-hint-badge">
                      <Sparkles size={12} /> Idade: {calculateAge(formData.data_nascimento)}
                    </span>
                  )}
                </div>

                {/* Sexo */}
                <div className="input-group">
                  <label className="input-label">Sexo</label>
                  <select
                    className="form-input"
                    value={formData.sexo}
                    onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* Telefone */}
                <div className="input-group">
                  <label className="input-label">Telefone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="(00) 0000-0000"
                    value={formData.telefone}
                    onChange={e => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  />
                </div>

                {/* WhatsApp */}
                <div className="input-group">
                  <label className="input-label">WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="(00) 90000-0000"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                  />
                </div>

                {/* E-mail */}
                <div className="input-group full-width">
                  <label className="input-label">E-mail</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="exemplo@email.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="tab-footer-actions">
                <div></div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActiveTab('clinico')}
                >
                  <span>Próximo: Clínico →</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= ABA 2: CLÍNICO ================= */}
          {activeTab === 'clinico' && (
            <div className="tab-pane animate-fade-in">
              <div className="tab-pane-title">
                <h2>Histórico Clínico e Antropometria</h2>
                <p>Medidas corporais, objetivos nutricionais e saúde em geral.</p>
              </div>

              <div className="form-grid">
                {/* Peso atual */}
                <div className="input-group">
                  <label className="input-label">Peso Atual</label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
                      placeholder="Ex: 68.5"
                      value={formData.peso_inicial}
                      onChange={e => setFormData({ ...formData, peso_inicial: e.target.value })}
                    />
                    <span className="input-suffix">kg</span>
                  </div>
                </div>

                {/* Altura */}
                <div className="input-group">
                  <label className="input-label">Altura</label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="form-input"
                      placeholder="Ex: 168"
                      value={formData.altura}
                      onChange={e => setFormData({ ...formData, altura: e.target.value })}
                    />
                    <span className="input-suffix">cm</span>
                  </div>
                </div>

                {/* IMC Calculado (somente leitura) */}
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
                      <span className="imc-placeholder">Informe peso e altura acima para calcular o IMC.</span>
                    )}
                  </div>
                </div>

                {/* Objetivo (Múltipla escolha) */}
                <div className="input-group full-width">
                  <label className="input-label">Objetivo Nutricional (Múltipla escolha)</label>
                  <div className="chips-grid">
                    {PRESET_OBJETIVOS.map(obj => {
                      const selected = (formData.objetivos || []).includes(obj);
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

                {/* Objetivo Texto Livre Adicional */}
                <div className="input-group full-width">
                  <label className="input-label">Detalhes Adicionais do Objetivo</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Descreva detalhes específicos do objetivo do paciente..."
                    rows={2}
                    value={formData.objetivo_texto}
                    onChange={e => setFormData({ ...formData, objetivo_texto: e.target.value })}
                  />
                </div>

                {/* Nível de Atividade Física */}
                <div className="input-group full-width">
                  <label className="input-label">Nível de Atividade Física</label>
                  <select
                    className="form-input"
                    value={formData.nivel_atividade}
                    onChange={e => setFormData({ ...formData, nivel_atividade: e.target.value })}
                  >
                    {PRESET_NIVEL_ATIVIDADE.map(nivel => (
                      <option key={nivel} value={nivel}>{nivel}</option>
                    ))}
                  </select>
                </div>

                {/* Patologias ou Condições de Saúde */}
                <div className="input-group full-width">
                  <label className="input-label">Patologias ou Condições de Saúde</label>
                  <div className="chips-grid">
                    <button
                      type="button"
                      className={`chip-button chip-nenhum ${(formData.patologias || []).includes('Nenhum') ? 'active' : ''}`}
                      onClick={() => toggleNenhum('patologias')}
                    >
                      {(formData.patologias || []).includes('Nenhum') && <Check size={14} />}
                      <span>Nenhum</span>
                    </button>

                    {PRESET_PATOLOGIAS.map(pat => {
                      const selected = (formData.patologias || []).includes(pat);
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

                    {/* Custom tags created by user */}
                    {(formData.patologias || [])
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
                      className={`chip-button chip-nenhum ${(formData.restricoes_alimentares || []).includes('Nenhum') ? 'active' : ''}`}
                      onClick={() => toggleNenhum('restricoes_alimentares')}
                    >
                      {(formData.restricoes_alimentares || []).includes('Nenhum') && <Check size={14} />}
                      <span>Nenhum</span>
                    </button>

                    {PRESET_RESTRICOES.map(res => {
                      const selected = (formData.restricoes_alimentares || []).includes(res);
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

                    {(formData.restricoes_alimentares || [])
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
                      className={`chip-button chip-nenhum ${(formData.alergias || []).includes('Nenhum') ? 'active' : ''}`}
                      onClick={() => toggleNenhum('alergias')}
                    >
                      {(formData.alergias || []).includes('Nenhum') && <Check size={14} />}
                      <span>Nenhum</span>
                    </button>

                    {PRESET_ALERGIAS.map(alg => {
                      const selected = (formData.alergias || []).includes(alg);
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

                    {(formData.alergias || [])
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

                {/* Medicamentos contínuos */}
                <div className="input-group full-width">
                  <label className="input-label">Medicamentos Contínuos</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Descreva medicamentos de uso contínuo, se houver..."
                    rows={2}
                    value={formData.medicamentos}
                    onChange={e => setFormData({ ...formData, medicamentos: e.target.value })}
                  />
                </div>

                {/* Suplementos em uso */}
                <div className="input-group full-width">
                  <label className="input-label">Suplementos em Uso</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Descreva suplementos e dosagens em uso..."
                    rows={2}
                    value={formData.suplementos}
                    onChange={e => setFormData({ ...formData, suplementos: e.target.value })}
                  />
                </div>
              </div>

              <div className="tab-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveTab('pessoal')}
                >
                  <span>← Anterior: Pessoal</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActiveTab('habitos')}
                >
                  <span>Próximo: Hábitos →</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= ABA 3: HÁBITOS ================= */}
          {activeTab === 'habitos' && (
            <div className="tab-pane animate-fade-in">
              <div className="tab-pane-title">
                <h2>Hábitos de Vida e Rotina</h2>
                <p>Estilo de vida, rotina de sono, hidratação e atividades do paciente.</p>
              </div>

              <div className="form-grid">
                {/* Refeições por dia */}
                <div className="input-group">
                  <label className="input-label">Refeições por Dia</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className="form-input"
                    placeholder="Ex: 4"
                    value={formData.refeicoes_por_dia}
                    onChange={e => setFormData({ ...formData, refeicoes_por_dia: e.target.value })}
                  />
                </div>

                {/* Quantidade de água por dia */}
                <div className="input-group">
                  <label className="input-label">Quantidade de Água por Dia</label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
                      placeholder="Ex: 2.5"
                      value={formData.litros_agua}
                      onChange={e => setFormData({ ...formData, litros_agua: e.target.value })}
                    />
                    <span className="input-suffix">litros</span>
                  </div>
                </div>

                {/* Horário que acorda */}
                <div className="input-group">
                  <label className="input-label">Horário que Acorda</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 6 ou 06:30"
                    value={formData.horario_acorda}
                    onChange={e => setFormData({ ...formData, horario_acorda: e.target.value })}
                    onBlur={() => handleTimeBlur('horario_acorda')}
                  />
                  <span className="field-hint">Digitar "6" converte para "06:00" ou "630" para "06:30"</span>
                </div>

                {/* Horário que dorme */}
                <div className="input-group">
                  <label className="input-label">Horário que Dorme</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 23 ou 22:30"
                    value={formData.horario_dorme}
                    onChange={e => setFormData({ ...formData, horario_dorme: e.target.value })}
                    onBlur={() => handleTimeBlur('horario_dorme')}
                  />
                  <span className="field-hint">Digitar "23" converte para "23:00" ou "2230" para "22:30"</span>
                </div>

                {/* Pratica atividade física */}
                <div className="input-group full-width">
                  <label className="input-label">Pratica Atividade Física?</label>
                  <div className="toggle-buttons-group">
                    <button
                      type="button"
                      className={`toggle-btn ${formData.atividade_fisica ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, atividade_fisica: true })}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${!formData.atividade_fisica ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, atividade_fisica: false })}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Se Sim -> Qual atividade e frequência semanal */}
                {formData.atividade_fisica && (
                  <div className="input-group full-width animate-fade-in">
                    <label className="input-label">Qual atividade e frequência semanal?</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Musculação 4x na semana, Corrida 2x na semana"
                      value={formData.atividade_fisica_descricao}
                      onChange={e => setFormData({ ...formData, atividade_fisica_descricao: e.target.value })}
                    />
                  </div>
                )}

                {/* Observações Gerais */}
                <div className="input-group full-width">
                  <label className="input-label">Observações Gerais</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Anotações gerais sobre o paciente, preferências alimentares..."
                    rows={3}
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
              </div>

              <div className="tab-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveTab('clinico')}
                >
                  <span>← Anterior: Clínico</span>
                </button>

                <button
                  type="submit"
                  className="btn-primary btn-save-patient"
                  disabled={loading}
                >
                  {loading ? 'Salvando Paciente...' : 'Salvar e Ver Perfil'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

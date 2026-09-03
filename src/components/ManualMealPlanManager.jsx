import React, { useState, useEffect } from 'react';
import { sql } from '../lib/neon';
import { 
  Plus, Edit3, Eye, Calendar, Clock, ArrowLeft, Save, X, AlertCircle, CheckCircle2,
  Sun, Coffee, Utensils, Sunset, Moon, Copy, RefreshCw, Sparkles
} from 'lucide-react';
import { INITIAL_PLANO_CONTEUDO } from '../types/mealPlan';
import { gerarPlanoAlimentarComIA } from '../lib/geminiService';

const DIAS_CONFIG = [
  { key: 'segunda', label: 'Segunda-feira', short: 'Seg' },
  { key: 'terca', label: 'Terça-feira', short: 'Ter' },
  { key: 'quarta', label: 'Quarta-feira', short: 'Qua' },
  { key: 'quinta', label: 'Quinta-feira', short: 'Qui' },
  { key: 'sexta', label: 'Sexta-feira', short: 'Sex' },
  { key: 'sabado', label: 'Sábado', short: 'Sáb' },
  { key: 'domingo', label: 'Domingo', short: 'Dom' }
];

const REFEICOES_CONFIG = [
  { key: 'cafe_manha', label: 'Café da Manhã', icon: Coffee, color: '#f59e0b', gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))' },
  { key: 'lanche_manha', label: 'Lanche da Manhã', icon: Sun, color: '#eab308', gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05))' },
  { key: 'almoco', label: 'Almoço', icon: Utensils, color: '#10b981', gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))' },
  { key: 'lanche_tarde', label: 'Lanche da Tarde', icon: Sunset, color: '#f97316', gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))' },
  { key: 'jantar', label: 'Jantar', icon: Moon, color: '#8b5cf6', gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))' }
];

// Funções de integração com o Neon Database
export async function fetchPlanosAlimentares(pacienteId) {
  if (!pacienteId) throw new Error('paciente_id é obrigatório para buscar planos alimentares.');
  return await sql`
    SELECT * FROM planos_alimentares 
    WHERE paciente_id = ${pacienteId} 
    ORDER BY created_at DESC
  `;
}

export async function createPlanoAlimentar(pacienteId, conteudo) {
  if (!pacienteId) throw new Error('paciente_id é obrigatório para criar um plano alimentar.');
  return await sql`
    INSERT INTO planos_alimentares (paciente_id, conteudo)
    VALUES (${pacienteId}, ${JSON.stringify(conteudo)})
    RETURNING *
  `;
}

export async function updatePlanoAlimentar(planoId, pacienteId, conteudo) {
  if (!planoId) throw new Error('ID do plano é obrigatório para atualização.');
  if (!pacienteId) throw new Error('paciente_id é obrigatório para atualização.');
  return await sql`
    UPDATE planos_alimentares
    SET conteudo = ${JSON.stringify(conteudo)}
    WHERE id = ${planoId} AND paciente_id = ${pacienteId}
    RETURNING *
  `;
}

export default function ManualMealPlanManager({ pacienteId, patientName, onUpdateCount }) {
  // Navigation & View Mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState('list');
  const [editingPlanId, setEditingPlanId] = useState(null);

  // Active Day Tab for Form
  const [activeDay, setActiveDay] = useState('segunda');

  // Form State matching strict JSON schema
  const [formData, setFormData] = useState(INITIAL_PLANO_CONTEUDO);

  // Data List & Async States
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal View for Plan Details
  const [viewModalPlan, setViewModalPlan] = useState(null);

  // Load history on mount or pacienteId change
  const loadPlanosHistory = async () => {
    if (!pacienteId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchPlanosAlimentares(pacienteId);
      setPlanos(data);
      if (onUpdateCount) onUpdateCount(data.length);
    } catch (err) {
      console.error('Erro ao carregar planos alimentares:', err);
      setError('Erro ao carregar histórico de planos alimentares.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanosHistory();
  }, [pacienteId]);

  // Deep helper to construct clean structural copy of schema
  const getCleanSchema = () => JSON.parse(JSON.stringify(INITIAL_PLANO_CONTEUDO));

  // Handle entering creation mode
  const handleStartCreate = () => {
    setFormData(getCleanSchema());
    setEditingPlanId(null);
    setActiveDay('segunda');
    setViewMode('create');
    setError('');
    setSuccess('');
  };

  // Gerar Plano com IA via Gemini SDK
  const handleGenerateWithAI = async () => {
    if (!pacienteId) {
      setError('Erro: Paciente não identificado.');
      return;
    }

    setAiLoading(true);
    setError('');
    setSuccess('');
    setAiStatusMsg('🔍 Buscando dados do paciente...');

    try {
      // 1. Buscar dados do paciente para enviar à IA
      const patRes = await sql`SELECT * FROM pacientes WHERE id = ${pacienteId}`;
      const patient = patRes[0] || {};

      setAiStatusMsg('🧠 IA calculando cardápio personalizado...');

      // 2. Chamar o serviço do Gemini AI
      const aiResult = await gerarPlanoAlimentarComIA(patient);

      setAiStatusMsg('✨ Estruturando 7 dias de refeições...');

      // 3. Normalizar o resultado para garantir o schema exato com 5 opções por refeição
      const cleanSchema = getCleanSchema();
      const merged = { dias: {} };

      DIAS_CONFIG.forEach(d => {
        merged.dias[d.key] = {};
        REFEICOES_CONFIG.forEach(r => {
          let aiItems = aiResult?.dias?.[d.key]?.[r.key];
          
          if (!aiItems && aiResult?.plano_semanal) {
            const dayObj = aiResult.plano_semanal.find(p => p.dia?.toLowerCase().includes(d.key) || p.dia?.toLowerCase().includes(d.short.toLowerCase()));
            if (dayObj && dayObj.refeicoes) {
              // Suporta variações de nomenclatura (cafe_da_manha vs cafe_manha)
              aiItems = dayObj.refeicoes[r.key] || 
                        dayObj.refeicoes[r.key === 'cafe_manha' ? 'cafe_da_manha' : r.key] || 
                        dayObj.refeicoes[r.key === 'lanche_tarde' ? 'lanche_da_tarde' : r.key];
            }
          }

          const arr = Array.isArray(aiItems) ? [...aiItems] : [];
          while (arr.length < 5) arr.push('');
          merged.dias[d.key][r.key] = arr.slice(0, 5);
        });
      });

      setFormData(merged);
      setEditingPlanId(null);
      setActiveDay('segunda');
      setViewMode('create');
      setSuccess('✨ Plano Alimentar gerado com sucesso pela IA! Você pode editar as opções antes de salvar.');
    } catch (err) {
      console.error('Erro detalhado ao gerar plano com IA:', err);
      const detail = err.message ? ` (${err.message})` : '';
      setError(`Não foi possível gerar o plano com IA no momento${detail}. Deseja tentar novamente ou criar um Plano Manual?`);
    } finally {
      setAiLoading(false);
      setAiStatusMsg('');
    }
  };

  // Handle entering edit mode
  const handleStartEdit = (plano) => {
    setEditingPlanId(plano.id);
    // Parse contents safely
    let parsedConteudo = plano.conteudo;
    if (typeof parsedConteudo === 'string') {
      try {
        parsedConteudo = JSON.parse(parsedConteudo);
      } catch (e) {
        parsedConteudo = getCleanSchema();
      }
    }
    
    // Ensure all days and meals exist with 5 inputs each
    const cleanSchema = getCleanSchema();
    const merged = { dias: {} };
    
    DIAS_CONFIG.forEach(d => {
      merged.dias[d.key] = {};
      REFEICOES_CONFIG.forEach(r => {
        const existing = parsedConteudo?.dias?.[d.key]?.[r.key];
        const arr = Array.isArray(existing) ? [...existing] : [];
        while (arr.length < 5) arr.push('');
        merged.dias[d.key][r.key] = arr.slice(0, 5);
      });
    });

    setFormData(merged);
    setActiveDay('segunda');
    setViewMode('edit');
    setError('');
    setSuccess('');
  };

  // Input change handler for a specific day, meal, and index
  const handleInputChange = (dayKey, mealKey, index, value) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.dias[dayKey]) updated.dias[dayKey] = {};
      if (!updated.dias[dayKey][mealKey]) updated.dias[dayKey][mealKey] = ['', '', '', '', ''];
      updated.dias[dayKey][mealKey][index] = value;
      return updated;
    });
  };

  // Copy active day contents to all other days
  const handleCopyDayToAll = (sourceDayKey) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const sourceData = updated.dias[sourceDayKey];
      DIAS_CONFIG.forEach(d => {
        if (d.key !== sourceDayKey) {
          updated.dias[d.key] = JSON.parse(JSON.stringify(sourceData));
        }
      });
      return updated;
    });
    setSuccess(`Cardápio de ${DIAS_CONFIG.find(d => d.key === sourceDayKey)?.label} copiado para todos os dias!`);
    setTimeout(() => setSuccess(''), 4000);
  };

  // Save / Update Handler
  const handleSave = async (e) => {
    e.preventDefault();
    if (!pacienteId) {
      setError('Erro: paciente_id ausente.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (viewMode === 'create') {
        await createPlanoAlimentar(pacienteId, formData);
        setSuccess('Plano alimentar manual criado com sucesso!');
      } else if (viewMode === 'edit' && editingPlanId) {
        await updatePlanoAlimentar(editingPlanId, pacienteId, formData);
        setSuccess('Plano alimentar atualizado com sucesso!');
      }
      await loadPlanosHistory();
      setTimeout(() => {
        setViewMode('list');
        setSuccess('');
      }, 1200);
    } catch (err) {
      console.error('Erro ao salvar plano alimentar:', err);
      setError('Erro ao salvar plano alimentar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Render loading state for list view initial fetch
  if (loading && viewMode === 'list' && planos.length === 0) {
    return (
      <div className="meal-plan-loading">
        <RefreshCw className="spin-icon" size={24} />
        <span>Carregando planos alimentares...</span>
      </div>
    );
  }

  return (
    <div className="meal-plan-container">
      {/* Toast Notifications */}
      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '16px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* ==========================================================================
         MODE 1: LIST / HISTÓRICO DE PLANOS ALIMENTARES
         ========================================================================== */}
      {viewMode === 'list' && (
        <div className="meal-plan-list-view">
          <div className="planos-section-header">
            <div>
              <h2>Planos Alimentares</h2>
              <p>Gerencie, edite e gere planos alimentares semanais para {patientName || 'o paciente'}.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn-primary btn-generate-plan" 
                onClick={handleGenerateWithAI}
                disabled={aiLoading}
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', border: 'none' }}
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="spin-icon" size={18} />
                    <span>{aiStatusMsg || 'Gerando com IA...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>🤖 Gerar Plano com IA</span>
                  </>
                )}
              </button>

              <button className="btn-secondary" onClick={handleStartCreate} disabled={aiLoading}>
                <Plus size={18} />
                <span>➕ Criar Manualmente</span>
              </button>
            </div>
          </div>

          {aiLoading && (
            <div className="alert alert-info animate-fade-in" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
              <RefreshCw className="spin-icon" size={20} style={{ color: '#a78bfa' }} />
              <div>
                <strong>Processando IA:</strong> {aiStatusMsg}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>O Gemini está analisando restrições, alergias e preferências alimentares do paciente.</p>
              </div>
            </div>
          )}

          {planos.length === 0 ? (
            <div className="empty-card" style={{ marginTop: '20px' }}>
              <Sparkles size={44} style={{ color: '#a78bfa', opacity: 0.9 }} />
              <h3>Nenhum plano alimentar cadastrado ainda</h3>
              <p>Gere um plano alimentar inteligente com IA baseado no perfil do paciente ou crie um plano manual do zero.</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleGenerateWithAI} 
                  disabled={aiLoading}
                  style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', border: 'none' }}
                >
                  <Sparkles size={16} />
                  <span>Gerar Plano com IA</span>
                </button>
                <button className="btn-secondary" onClick={handleStartCreate} disabled={aiLoading}>
                  <Plus size={16} />
                  <span>Criar Manualmente</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="planos-history-list" style={{ marginTop: '20px' }}>
              {planos.map((plano) => (
                <div key={plano.id} className="plano-item-card">
                  <div className="plano-info-left">
                    <div className="plano-icon-badge">
                      <Utensils size={20} className="plano-icon" />
                    </div>
                    <div>
                      <h4 className="plano-title">
                        Plano Alimentar — {formatDate(plano.created_at)}
                      </h4>
                      <span className="plano-date">
                        Criado em: {formatDate(plano.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="plano-actions-right" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-secondary btn-sm"
                      onClick={() => setViewModalPlan(plano)}
                      title="Visualizar Detalhes"
                    >
                      <Eye size={15} />
                      <span>Visualizar</span>
                    </button>
                    <button 
                      className="btn-primary btn-sm"
                      onClick={() => handleStartEdit(plano)}
                      title="Editar Plano"
                    >
                      <Edit3 size={15} />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================================================
         MODE 2 & 3: FORMULÁRIO DE CRIAÇÃO / EDIÇÃO DE PLANO ALIMENTAR
         ========================================================================== */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <form onSubmit={handleSave} className="meal-plan-form-view animate-fade-in">
          {/* Header Action Bar */}
          <div className="meal-plan-form-header">
            <div>
              <button 
                type="button" 
                className="btn-back-link" 
                onClick={() => setViewMode('list')}
                disabled={saving}
              >
                <ArrowLeft size={16} />
                <span>Voltar ao Histórico</span>
              </button>
              <h2 className="meal-plan-form-title">
                {viewMode === 'create' ? '➕ Criar Novo Plano Alimentar Manual' : '✏️ Editar Plano Alimentar'}
              </h2>
              <p className="meal-plan-form-subtitle">
                Preencha as 5 refeições com 5 opções para cada dia da semana.
              </p>
            </div>

            <div className="meal-plan-form-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setViewMode('list')}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="spin-icon" size={16} />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{viewMode === 'create' ? 'Salvar Plano' : 'Atualizar Plano'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation for 7 Days of the Week */}
          <div className="days-tabs-wrapper">
            <div className="days-tabs-bar">
              {DIAS_CONFIG.map(day => (
                <button
                  key={day.key}
                  type="button"
                  className={`day-tab-btn ${activeDay === day.key ? 'active' : ''}`}
                  onClick={() => setActiveDay(day.key)}
                >
                  <Calendar size={15} />
                  <span className="day-tab-full">{day.label}</span>
                  <span className="day-tab-short">{day.short}</span>
                </button>
              ))}
            </div>

            <button 
              type="button" 
              className="btn-copy-day"
              onClick={() => handleCopyDayToAll(activeDay)}
              title="Copiar este cardápio para todos os outros dias da semana"
            >
              <Copy size={14} />
              <span>Replicar dia para toda semana</span>
            </button>
          </div>

          {/* Active Day Content: Render 5 Meal Cards */}
          <div className="active-day-meals-grid animate-fade-in">
            <div className="active-day-banner">
              <h3>🗓️ Cardápio de {DIAS_CONFIG.find(d => d.key === activeDay)?.label}</h3>
              <span>Insira até 5 linhas/opções de alimentos por refeição.</span>
            </div>

            <div className="meals-cards-container">
              {REFEICOES_CONFIG.map(meal => {
                const IconComponent = meal.icon;
                const mealInputs = formData?.dias?.[activeDay]?.[meal.key] || ['', '', '', '', ''];

                return (
                  <div 
                    key={meal.key} 
                    className="meal-card"
                    style={{ borderTop: `3px solid ${meal.color}` }}
                  >
                    <div className="meal-card-header" style={{ background: meal.gradient }}>
                      <div className="meal-card-title-box">
                        <IconComponent size={20} style={{ color: meal.color }} />
                        <h4>{meal.label}</h4>
                      </div>
                      <span className="meal-badge">5 opções</span>
                    </div>

                    <div className="meal-card-inputs-list">
                      {mealInputs.map((val, idx) => (
                        <div key={idx} className="meal-input-row">
                          <span className="input-row-number">{idx + 1}</span>
                          <input
                            type="text"
                            className="form-input meal-input-field"
                            placeholder={`Opção/Alimento ${idx + 1} (ex: 2 fatias de pão integral)`}
                            value={val}
                            onChange={(e) => handleInputChange(activeDay, meal.key, idx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="meal-plan-bottom-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setViewMode('list')}
              disabled={saving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Salvando...' : (viewMode === 'create' ? 'Salvar Plano Alimentar' : 'Atualizar Plano Alimentar')}
            </button>
          </div>
        </form>
      )}

      {/* ==========================================================================
         MODAL: VISUALIZAÇÃO DETALHADA DO PLANO ALIMENTAR
         ========================================================================== */}
      {viewModalPlan && (
        <div className="modal-backdrop">
          <div className="modal-card modal-large animate-fade-in">
            <div className="modal-header">
              <div>
                <h3>📋 Plano Alimentar — {formatDate(viewModalPlan.created_at)}</h3>
                <p className="profile-subtitle" style={{ fontSize: '0.85rem' }}>
                  Paciente: {patientName || 'Cadastrado'} • Data: {formatDate(viewModalPlan.created_at)}
                </p>
              </div>
              <button className="modal-close" onClick={() => setViewModalPlan(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="plano-content-preview" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
              {/* Structured JSON Renderer for 7 Days */}
              {viewModalPlan.conteudo?.dias ? (
                <div className="view-modal-dias-container">
                  {DIAS_CONFIG.map(d => {
                    const dayData = viewModalPlan.conteudo.dias[d.key];
                    if (!dayData) return null;

                    return (
                      <div key={d.key} className="view-modal-day-section" style={{ marginBottom: '24px' }}>
                        <h4 className="view-modal-day-title">
                          <Calendar size={16} style={{ color: 'var(--pink-light)' }} />
                          <span>{d.label}</span>
                        </h4>

                        <div className="view-modal-meals-grid">
                          {REFEICOES_CONFIG.map(r => {
                            const items = dayData[r.key] || [];
                            const nonEmp = items.filter(i => i && i.trim() !== '');

                            return (
                              <div key={r.key} className="view-modal-meal-box">
                                <h5 className="view-modal-meal-name" style={{ color: r.color }}>
                                  {r.label}
                                </h5>
                                {nonEmp.length > 0 ? (
                                  <ul className="view-modal-items-list">
                                    {nonEmp.map((item, iIdx) => (
                                      <li key={iIdx}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="view-modal-empty-text">Nenhum item cadastrado</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <pre className="plano-json-pretty">
                  {JSON.stringify(viewModalPlan.conteudo, null, 2)}
                </pre>
              )}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  const target = viewModalPlan;
                  setViewModalPlan(null);
                  handleStartEdit(target);
                }}
              >
                <Edit3 size={15} />
                <span>Editar este Plano</span>
              </button>
              <button type="button" className="btn-primary" onClick={() => setViewModalPlan(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

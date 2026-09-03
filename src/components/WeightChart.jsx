import React from 'react';
import { TrendingDown, TrendingUp, Minus, Calendar, Scale } from 'lucide-react';

export default function WeightChart({ data = [] }) {
  // data expected: array of { date: 'DD/MM/YYYY', weight: 70.5, rawDate: Date }
  // Filter out entries without valid numeric weight
  const validPoints = data.filter(d => d.weight !== null && d.weight !== undefined && !isNaN(d.weight) && d.weight > 0);

  if (validPoints.length === 0) {
    return (
      <div className="weight-chart-card empty">
        <div className="chart-header">
          <div className="chart-title">
            <Scale size={20} className="chart-icon" />
            <h3>Evolução de Peso</h3>
          </div>
        </div>

        <div className="empty-chart-body">
          <Scale size={44} style={{ color: 'var(--text-dim)', opacity: 0.6 }} />
          <p className="empty-chart-msg">Nenhuma consulta registrada ainda</p>
          <span className="empty-chart-sub">Registre consultas com o peso do paciente para acompanhar o gráfico de evolução.</span>
        </div>
      </div>
    );
  }

  // Calculate Metrics (Initial, Current, Difference)
  const firstWeight = validPoints[0].weight;
  const latestWeight = validPoints[validPoints.length - 1].weight;
  const weightDiff = (latestWeight - firstWeight).toFixed(1);

  // SVG dimensions
  const width = 650;
  const height = 240;
  const paddingX = 50;
  const paddingTop = 45;
  const paddingBottom = 45;

  const weights = validPoints.map(p => p.weight);
  let minW = Math.min(...weights);
  let maxW = Math.max(...weights);

  // Padding min and max so chart doesn't touch top/bottom bounds
  if (minW === maxW) {
    minW = Math.max(0, minW - 5);
    maxW = maxW + 5;
  } else {
    const margin = (maxW - minW) * 0.15;
    minW = Math.max(0, minW - margin);
    maxW = maxW + margin;
  }

  // Map points to SVG coordinates
  const svgPoints = validPoints.map((pt, idx) => {
    const x = validPoints.length === 1 
      ? width / 2 
      : paddingX + (idx / (validPoints.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingBottom - ((pt.weight - minW) / (maxW - minW)) * (height - paddingTop - paddingBottom);
    return { ...pt, x, y };
  });

  // Construct SVG Path
  const pointsString = svgPoints.map(p => `${p.x},${p.y}`).join(' ');
  
  // Area path for gradient below curve
  const areaString = svgPoints.length > 1
    ? `${svgPoints[0].x},${height - paddingBottom} ${pointsString} ${svgPoints[svgPoints.length - 1].x},${height - paddingBottom}`
    : '';

  return (
    <div className="weight-chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Scale size={20} className="chart-icon" />
          <div>
            <h3>Evolução de Peso</h3>
            <span className="chart-subtitle">{validPoints.length} registro(s) de peso</span>
          </div>
        </div>

        <div className="chart-stats-summary">
          <div className="chart-stat-item">
            <span className="stat-label">Inicial</span>
            <span className="stat-value">{firstWeight} kg</span>
          </div>
          <div className="chart-stat-item">
            <span className="stat-label">Atual</span>
            <span className="stat-value highlight">{latestWeight} kg</span>
          </div>
          <div className="chart-stat-item">
            <span className="stat-label">Variação</span>
            <span className={`stat-value badge ${weightDiff < 0 ? 'good' : weightDiff > 0 ? 'warn' : 'neutral'}`}>
              {weightDiff < 0 ? <TrendingDown size={14} /> : weightDiff > 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
              {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg
            </span>
          </div>
        </div>
      </div>

      <div className="svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="weight-svg">
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--pink-light)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--pink-primary)" stopOpacity="0.0" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          <line x1={paddingX} y1={paddingTop} x2={width - paddingX} y2={paddingTop} stroke="rgba(255, 255, 255, 0.07)" strokeDasharray="4 4" />
          <line x1={paddingX} y1={(height - paddingBottom + paddingTop) / 2} x2={width - paddingX} y2={(height - paddingBottom + paddingTop) / 2} stroke="rgba(255, 255, 255, 0.07)" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height - paddingBottom} x2={width - paddingX} y2={height - paddingBottom} stroke="rgba(255, 255, 255, 0.12)" />

          {/* Area Fill */}
          {areaString && (
            <polygon points={areaString} fill="url(#weightGrad)" />
          )}

          {/* Line Curve */}
          {svgPoints.length > 1 ? (
            <polyline
              fill="none"
              stroke="var(--pink-light)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
              filter="url(#glow)"
            />
          ) : null}

          {/* Data Points */}
          {svgPoints.map((pt, i) => (
            <g key={i} className="chart-data-node">
              {/* Outer halo circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill="var(--bg-dark)"
                stroke="var(--pink-light)"
                strokeWidth="3"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill="#ffffff"
              />

              {/* Weight Value Text Label above point */}
              <text
                x={pt.x}
                y={pt.y - 12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-heading)"
              >
                {pt.weight} kg
              </text>

              {/* Date Text Label below X axis */}
              <text
                x={pt.x}
                y={height - paddingBottom + 22}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="10"
                fontWeight="600"
              >
                {pt.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

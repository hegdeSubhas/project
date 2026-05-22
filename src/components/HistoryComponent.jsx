import React from 'react';
import { ArrowLeft, Download, Zap, MessageCircle, Code, BrainCircuit, TrendingUp, Target, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const HistoryComponent = ({ report, onBack }) => {
  if (!report) return null;

  const getScoreColor = (val) => {
    if (val >= 90) return '#10b981';
    if (val >= 80) return '#00b4d8';
    if (val >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const scoreNum = parseInt(report.score);

  return (
    <div className="vh-100 d-flex flex-column" style={{ background: 'linear-gradient(180deg, #f0f6fa 0%, #fff 100%)', fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <header className="px-4 d-flex justify-content-between align-items-center" style={{ height: '65px', background: 'linear-gradient(90deg, rgba(255,255,255,0.98), rgba(240,248,255,0.98))', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div className="d-flex align-items-center gap-3">
          <button onClick={onBack} className="btn rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#121a2f', width: '38px', height: '38px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h6 className="fw-bold mb-0" style={{ color: '#121a2f' }}>{report.role}</h6>
            <div className="d-flex align-items-center gap-1">
              <Clock size={11} style={{ color: '#94a3b8' }} />
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{report.date}</span>
            </div>
          </div>
        </div>
        <button onClick={() => window.print()} className="btn rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-bold border-0" style={{ background: '#121a2f', color: '#fff', fontSize: '0.8rem' }}>
          <Download size={15} /> Export PDF
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow-1 overflow-auto px-3 py-4">
        <div className="mx-auto" style={{ maxWidth: '900px' }}>

          {/* TOP ROW: Score + AI Feedback */}
          <div className="d-flex flex-column flex-md-row gap-3 mb-3">

            {/* Score Card */}
            <div className="rounded-4 p-3 d-flex flex-column align-items-center justify-content-center text-center" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', minWidth: '160px', flexShrink: 0 }}>
              <span className="text-uppercase fw-bold" style={{ fontSize: '0.6rem', letterSpacing: '2px', color: '#94a3b8', marginBottom: '8px' }}>Overall Score</span>
              <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px' }}>
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={getScoreColor(scoreNum)} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${scoreNum * 2.64} 264`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1s ease' }} />
                </svg>
                <span className="position-absolute fw-bold" style={{ fontSize: '1.4rem', color: getScoreColor(scoreNum) }}>{report.score}</span>
              </div>
              <span className="fw-bold mt-2" style={{ fontSize: '0.75rem', color: scoreNum >= 85 ? '#10b981' : scoreNum >= 70 ? '#f59e0b' : '#ef4444' }}>
                {scoreNum >= 90 ? 'Excellent' : scoreNum >= 80 ? 'Very Good' : scoreNum >= 70 ? 'Good' : 'Needs Work'}
              </span>
            </div>

            {/* AI Feedback */}
            <div className="flex-grow-1 rounded-4 p-3 d-flex flex-column" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg, #00b4d8, #0096b4)' }}>
                  <BrainCircuit size={14} style={{ color: '#fff' }} />
                </div>
                <h6 className="fw-bold mb-0" style={{ color: '#121a2f', fontSize: '0.85rem' }}>AI Feedback</h6>
              </div>
              <div className="flex-grow-1 overflow-auto custom-scrollbar pe-2" style={{ maxHeight: '110px' }}>
                <p className="mb-0" style={{ color: '#475569', fontSize: '0.8rem', lineHeight: '1.6' }}>{report.analytics.feedback}</p>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Metrics & Improvements */}
          <div className="d-flex flex-column flex-md-row gap-3">
            
            {/* PERFORMANCE METRICS */}
            <div className="rounded-4 p-3 flex-grow-1 d-flex flex-column" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', flexBasis: '50%' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '26px', height: '26px', background: 'rgba(0,180,216,0.1)' }}>
                  <TrendingUp size={14} style={{ color: '#00b4d8' }} />
                </div>
                <h6 className="fw-bold mb-0" style={{ color: '#121a2f', fontSize: '0.85rem' }}>Performance Breakdown</h6>
              </div>
              <div className="d-flex flex-column gap-3 justify-content-center flex-grow-1">
                {[
                  { label: 'Technical Skills', val: report.analytics.technical, icon: <Code size={14} />, color: '#00b4d8', desc: 'Problem-solving, coding' },
                  { label: 'Communication', val: report.analytics.nonTechnical, icon: <MessageCircle size={14} />, color: '#8b5cf6', desc: 'Clarity, articulation' },
                  { label: 'Confidence', val: report.analytics.confidence, icon: <Zap size={14} />, color: '#f59e0b', desc: 'Composure, assertiveness' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '26px', height: '26px', background: `${stat.color}12` }}>
                          <span style={{ color: stat.color }}>{stat.icon}</span>
                        </div>
                        <div>
                          <span className="fw-bold" style={{ fontSize: '0.75rem', color: '#121a2f' }}>{stat.label}</span>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{stat.desc}</div>
                        </div>
                      </div>
                      <span className="fw-bold" style={{ fontSize: '0.85rem', color: stat.color }}>{stat.val}%</span>
                    </div>
                    <div className="rounded-pill overflow-hidden" style={{ height: '5px', background: 'rgba(0,0,0,0.04)' }}>
                      <div className="rounded-pill h-100" style={{ width: `${stat.val}%`, background: `linear-gradient(90deg, ${stat.color}, ${stat.color}cc)`, transition: 'width 1s ease' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="d-flex flex-column gap-3 flex-grow-1" style={{ flexBasis: '50%' }}>
              {/* AREAS OF IMPROVEMENT */}
              {report.analytics.improvements && report.analytics.improvements.length > 0 && (
                <div className="rounded-4 p-3 flex-grow-1 d-flex flex-column" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: '26px', height: '26px', background: 'rgba(249,115,22,0.1)' }}>
                      <Target size={14} style={{ color: '#f97316' }} />
                    </div>
                    <h6 className="fw-bold mb-0" style={{ color: '#121a2f', fontSize: '0.85rem' }}>Areas of Improvement</h6>
                  </div>
                  <div className="d-flex flex-column gap-2 overflow-auto custom-scrollbar pe-2 flex-grow-1" style={{ maxHeight: '130px' }}>
                    {report.analytics.improvements.map((item, i) => (
                      <div key={i} className="d-flex align-items-start gap-2 rounded-3 p-2" style={{ background: 'rgba(249,115,22,0.03)', border: '1px solid rgba(249,115,22,0.08)' }}>
                        <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '18px', height: '18px', background: 'rgba(249,115,22,0.1)', marginTop: '2px' }}>
                          <AlertTriangle size={10} style={{ color: '#f97316' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#475569', lineHeight: '1.4' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUICK SUMMARY BADGES */}
              <div className="rounded-4 p-2 px-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {[
                    { label: `Role: ${report.role}`, bg: 'rgba(0,180,216,0.08)', color: '#00b4d8' },
                    { label: `Score: ${report.score}`, bg: `${getScoreColor(scoreNum)}15`, color: getScoreColor(scoreNum) },
                    { label: `${report.analytics.improvements?.length || 0} alerts`, bg: 'rgba(249,115,22,0.08)', color: '#f97316' },
                  ].map((badge, i) => (
                    <span key={i} className="rounded-pill px-2 py-1 fw-bold" style={{ fontSize: '0.65rem', background: badge.bg, color: badge.color, border: `1px solid ${badge.color}20` }}>
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default HistoryComponent;
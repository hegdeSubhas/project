import React from 'react';
import { ArrowLeft, Download, Zap, MessageCircle, Code, Star, BrainCircuit } from 'lucide-react';

const HistoryComponent = ({ report, onBack }) => {
  if (!report) return null;

  return (
    <div className="vh-100 d-flex flex-column animate-fade-in" style={{ backgroundColor: '#F8F9FA' }}>
      <header className="px-4 bg-white border-bottom d-flex justify-content-between align-items-center shadow-sm" style={{ height: '70px' }}>
        <div className="d-flex align-items-center gap-3">
          <button onClick={onBack} className="btn btn-light rounded-circle p-2 border shadow-sm"><ArrowLeft size={20} /></button>
          <div><h5 className="fw-bold mb-0 text-dark">{report.role}</h5><p className="text-muted small mb-0">{report.date}</p></div>
        </div>
        <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" style={{ backgroundColor: '#2D6BEF', border: 'none' }}><Download size={18} className="me-2" /> Export PDF</button>
      </header>

      <main className="flex-grow-1 p-4 overflow-auto">
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card p-4 text-center border-0 shadow-sm h-100 rounded-4">
                <p className="small fw-bold text-muted text-uppercase mb-2">Analysis Grade</p>
                <h1 className="display-4 fw-bold" style={{ color: '#2D6BEF' }}>{report.score}</h1>
              </div>
            </div>
            <div className="col-md-8">
              <div className="card p-4 border-0 shadow-sm h-100 rounded-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark"><BrainCircuit size={18} className="text-primary"/> AI Feedback</h6>
                <p className="text-muted small" style={{ lineHeight: '1.6' }}>{report.analytics.feedback}</p>
              </div>
            </div>
          </div>
          <div className="row g-4">
            {[
              { label: "Technical", val: report.analytics.technical, icon: <Code />, color: "#2D6BEF" },
              { label: "Communication", val: report.analytics.nonTechnical, icon: <MessageCircle />, color: "#0EA5E9" },
              { label: "Confidence", val: report.analytics.confidence, icon: <Zap />, color: "#F59E0B" }
            ].map((stat, i) => (
              <div className="col-md-4" key={i}>
                <div className="card p-4 border-0 shadow-sm text-center rounded-4">
                  <div className="bg-light rounded-circle d-inline-flex p-3 mb-3 mx-auto text-dark">{stat.icon}</div>
                  <h6 className="fw-bold text-muted small mb-1">{stat.label}</h6>
                  <h3 className="fw-bold mb-3">{stat.val}%</h3>
                  <div className="progress" style={{ height: '8px', borderRadius: '10px' }}>
                    <div className="progress-bar" style={{ width: `${stat.val}%`, backgroundColor: stat.color }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HistoryComponent;
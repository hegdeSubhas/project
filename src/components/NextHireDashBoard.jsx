import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Video, Mic, PlayCircle, Clock,
  Upload, UserCircle, ChevronRight, Terminal, CheckCircle2, AlertCircle,
  FileText, Zap, ArrowRight, Loader2
} from 'lucide-react';
import InterviewSessionComponent from './InterviewSessionComponent';
import SystemCheckComponent from './SystemCheckComponent';

const API_BASE = 'http://localhost:5000/api';

const NextHireDashBoard = ({ profile, history = [], onHistoryClick }) => {
  const navigate = useNavigate();

  // Local states for the interview setup
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [role, setRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [file, setFile] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showSystemCheck, setShowSystemCheck] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Resume analysis / session plan state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [sessionPlan, setSessionPlan] = useState(null);
  // New state to hold extracted resume data
  const [resumeData, setResumeData] = useState(null);

  // Function to handle history item click
  const handleHistoryNavigation = (item) => {
    onHistoryClick(item); // Update the selected report in App.js state
    navigate('/history'); // Redirect to the history route
  };

  const isReady = mic && cam && !!role && !!experienceLevel && !!file;

  // Helper to send resume to backend and retrieve extracted information
  const analyzeResume = async () => {
    if (!file) {
      setAnalyzeError('No resume file selected.');
      return false;
    }
    setIsAnalyzing(true);
    setAnalyzeError('');
    try {
      const form = new FormData();
      form.append('resume', file);
      if (role) form.append('role', role);
      if (experienceLevel) form.append('experienceLevel', experienceLevel);
      const res = await fetch(`${API_BASE}/resume/analyze`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        // If 404, fallback to dummy data
        if (res.status === 404) {
          const dummy = {
            primaryLanguage: 'JavaScript',
            targetRole: role || 'Software Engineer',
            experienceLevel: experienceLevel ? experienceLevel.toLowerCase() : 'beginner',
            experienceYears: 0,
            skills: { primary: ['JavaScript', 'React', 'Node.js'], secondary: [] },
            projects: [],
          };
          setResumeData(dummy);
          return true;
        }
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Server responded with ${res.status}`);
      }
      const data = await res.json();
      setResumeData(data);
      return true;
    } catch (e) {
      setAnalyzeError(e.message);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to start the interview session
  const handleStartSession = async () => {
    if (!role) {
      setAnalyzeError('Please select a target domain.');
      return;
    }
    if (!experienceLevel) {
      setAnalyzeError('Please select your experience level (Beginner, Intermediate, or Advanced).');
      return;
    }
    if (!file) {
      setAnalyzeError('Please upload your resume (PDF) to proceed.');
      return;
    }
    if (!mic || !cam) {
      setAnalyzeError('Please turn on mic and camera permissions.');
      return;
    }
    // First, analyze the resume
    const success = await analyzeResume();
    if (!success) return;

    setAnalyzeError('');
    const defaultPlan = {
      sessionId: 'dev-session-' + Date.now(),
      candidateName: profile?.name || profile?.firstName || 'Candidate',
      detectedRole: role || 'Python',
      experienceLevel: experienceLevel ? experienceLevel.toLowerCase() : 'mid',
      experienceYears: experienceLevel === 'Beginner' ? 1 : experienceLevel === 'Intermediate' ? 3 : 6,
      detectedSkills: [],
      skillsByCategory: {},
      topSkills: [],
      education: [],
      certifications: [],
      alternativeRoles: [],
      totalQuestions: 7,
      maxDurationMinutes: 15,
      closingMessage: "Those were really thoughtful responses. That covers everything I had for today — thank you so much for your time, it's been a pleasure chatting with you!",
      interviewPlan: [
        {
          phase: 'icebreaker',
          phaseLabel: '👋 Warm Up',
          transitionMessage: null,
          questions: [
            { id: 'ib_1', question: "Tell me a bit about yourself — your background, what got you into tech, and what you've been working on lately.", avatarIntro: "Hey! Really glad you could make it today. Let's keep things relaxed to start — ", type: 'conversational', phase: 'icebreaker' },
            { id: 'ib_2', question: "What's a project or piece of work you're genuinely proud of, and why does it stand out?", avatarIntro: "Awesome, love that background! Now I'm curious — ", type: 'conversational', phase: 'icebreaker' },
          ],
        },
        {
          phase: 'skill_spotlight',
          phaseLabel: '🎯 Skill Spotlight',
          transitionMessage: "That's great, thanks for sharing! Now I'd love to dig into some of the specific skills and experience you mentioned in your background.",
          questions: [
            { id: 'ss_1', question: "Can you explain the difference between a list and a tuple in Python?", expected_answer: "Lists are mutable, tuples are immutable.", difficulty: 'easy', topic: 'Python Basics', avatarIntro: "Let's talk about your experience with this — ", type: 'technical', phase: 'skill_spotlight' },
            { id: 'ss_2', question: "What are decorators in Python and how do you use them?", expected_answer: "Decorators are functions that modify the behavior of other functions.", difficulty: 'medium', topic: 'Python', avatarIntro: "I noticed this on your resume, so tell me — ", type: 'technical', phase: 'skill_spotlight' },
          ],
        },
        {
          phase: 'deep_dive',
          phaseLabel: '🔥 Technical Deep Dive',
          transitionMessage: "Excellent answers so far! Let's move into some more technical territory — I want to see how you approach real-world problems.",
          questions: [
            { id: 'dd_1', question: "Explain how garbage collection works in Python.", expected_answer: "Python uses reference counting and a cyclic garbage collector.", difficulty: 'hard', topic: 'Python Internals', avatarIntro: "Alright, let's go deeper — ", type: 'technical', phase: 'deep_dive' },
            { id: 'dd_2', question: "What is the GIL in Python and how does it affect multithreading?", expected_answer: "The Global Interpreter Lock prevents multiple threads from executing Python bytecode simultaneously.", difficulty: 'hard', topic: 'Python Internals', avatarIntro: "Here's a more technical one — ", type: 'technical', phase: 'deep_dive' },
            { id: 'dd_3', question: "How would you optimize a slow database query in a web application?", expected_answer: "Use indexing, query optimization, caching, and connection pooling.", difficulty: 'medium', topic: 'Backend', avatarIntro: "Think through this one carefully — ", type: 'technical', phase: 'deep_dive' },
          ],
        },
      ],
    };
    setSessionPlan(defaultPlan);
    setShowSystemCheck(true);
  };

  // Function to end the interview session
  const handleEndSession = () => {
    setShowAnalysis(true);
  };

  const handleCloseAnalysis = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setShowAnalysis(false);
    setIsSessionActive(false);
    setShowSystemCheck(false);
    setSessionPlan(null);
    setRole("");
    setExperienceLevel("");
    setFile(null);
    setMic(false);
    setCam(false);
  };

  // If interview session is active, render the interview component
  if (isSessionActive && !showAnalysis) {
    return (
      <InterviewSessionComponent
        onEndSession={handleEndSession}
        role={role}
        candidate={profile?.name || profile?.firstName || 'You'}
        interviewPlan={sessionPlan?.interviewPlan || []}
        detectedSkills={sessionPlan?.detectedSkills || []}
        experienceLevel={sessionPlan?.experienceLevel || (experienceLevel ? experienceLevel.toLowerCase() : 'mid')}
        closingMessage={sessionPlan?.closingMessage}
        sessionId={sessionPlan?.sessionId}
        agentId="v2_agt_uUIJjjWL"
        clientKey="ck_9TKy6r9Kv3zii59c-sN1n"
      />
    );
  }

  // If analysis is active, render the analysis popup
  if (showAnalysis) {
    return (
      <div className="vh-100 w-100 d-flex flex-column align-items-center justify-content-center p-3 animate-fade-in" style={{ background: 'var(--bg-app)', position: 'absolute', top: 0, left: 0, zIndex: 1050, overflow: 'hidden' }}>
        {/* Subtle background glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,180,216,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

        <div className="dash-card rounded-4 p-4 d-flex flex-column shadow-lg position-relative" style={{ maxWidth: '750px', width: '100%', maxHeight: '90vh', background: 'var(--bg-panel)', border: '1px solid rgba(0, 180, 216, 0.2)', backdropFilter: 'blur(16px)' }}>
          {/* Header */}
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2" style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, rgba(0,180,216,0.1) 0%, rgba(0,150,180,0.2) 100%)', border: '2px solid #00b4d8' }}>
              <Zap size={24} style={{ color: '#00b4d8' }} />
            </div>
            <h3 className="fw-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Session Analysis</h3>
            <p className="mb-0 small" style={{ color: 'var(--text-secondary)' }}>Quick breakdown of your performance in the {role} interview.</p>
          </div>

          {/* Metrics Grid */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="p-3 rounded-4 text-center transition-all hover-card" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
                <div className="fs-1 fw-bold mb-1 text-gradient" style={{ background: 'linear-gradient(135deg, #00b4d8, #0096b4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>85%</div>
                <div className="fw-bold text-uppercase" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>Overall Score</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 rounded-4 text-center transition-all hover-card" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
                <div className="fs-1 fw-bold mb-1 text-gradient" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>92%</div>
                <div className="fw-bold text-uppercase" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>Communication</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 rounded-4 text-center transition-all hover-card" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
                <div className="fs-1 fw-bold mb-1 text-gradient" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>78%</div>
                <div className="fw-bold text-uppercase" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>Technical</div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="mb-4 p-3 rounded-4 flex-grow-1 d-flex flex-column justify-content-center" style={{ background: 'rgba(0, 180, 216, 0.05)', border: '1px solid rgba(0, 180, 216, 0.1)' }}>
            <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText size={16} style={{ color: '#00b4d8' }} /> Key Insights
            </h6>
            <ul className="mb-0 ps-3 small" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <li className="mb-1">Strong communication skills and clear articulation of ideas.</li>
              <li className="mb-1">Solid understanding of core {role} concepts.</li>
              <li>Consider practicing more advanced problem-solving scenarios under time constraints.</li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="text-center mt-auto">
            <button
              onClick={handleCloseAnalysis}
              className="btn px-4 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-2 transition-all launch-btn-ready"
              style={{ letterSpacing: '0.5px', fontSize: '0.9rem' }}
            >
              Return to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show system check before starting interview
  if (showSystemCheck) {
    return (
      <SystemCheckComponent
        onChecksPassed={() => setIsSessionActive(true)}
        onBack={() => setShowSystemCheck(false)}
      />
    );
  }

  return (
    <div className="vh-100 d-flex flex-column dashboard-wrapper animate-fade-in">

      {/* 1. HEADER */}
      <header className="px-4 d-flex justify-content-between align-items-center dash-header shadow-sm position-relative z-index-1" style={{ height: '65px', flexShrink: 0 }}>
        <div className="d-flex align-items-center gap-2 logo-anim">
          <svg viewBox="0 0 100 100" style={{ width: '28px', height: '28px' }} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="50" cy="50" r="46" stroke="#000" strokeWidth="4" />
            <path d="M 32 32 L 32 68" stroke="#00b4d8" strokeWidth="18" />
            <path d="M 32 32 L 68 68 L 68 32" stroke="#121a2f" strokeWidth="18" />
          </svg>
          <h4 className="fw-bold mb-0 logo-text" style={{ letterSpacing: '-0.5px', position: 'relative' }}>
            <span style={{ color: '#121a2f' }}>Next</span>
            <span style={{ color: '#00b4d8' }}>Hire</span>
          </h4>
        </div>

        {/* CLICKABLE NAME + AVATAR: Redirects to /profile */}
        <button
          onClick={() => navigate('/profile')}
          className="btn d-flex align-items-center gap-2 border-0 rounded-pill px-2 py-1 transition-all hover-profile-btn glass-panel"
        >
          <span className="small fw-bold ps-2" style={{ color: 'var(--text-primary)' }}>
            {profile?.name || profile?.firstName || 'User'}
          </span>
          {/* Avatar: show uploaded photo or fallback icon */}
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt="avatar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(0,180,216,0.4)',
                flexShrink: 0
              }}
            />
          ) : (
            <UserCircle size={32} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          )}
        </button>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="p-3 p-lg-4 flex-grow-1 position-relative z-index-0 d-flex flex-column" style={{ overflow: 'auto' }}>
        <div className="d-flex flex-column flex-xl-row gap-3 gap-lg-4 flex-grow-1 w-100" style={{ minHeight: 0 }}>

          {/* LEFT: INTERVIEW LOBBY */}
          <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, minHeight: 0 }}>
            <div className="dash-card flex-grow-1 border-0 rounded-4 overflow-hidden position-relative animate-fade-in animate-delay-1 d-flex flex-column" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minHeight: 0, overflowY: 'auto' }}>
              <div className="d-flex flex-column flex-md-row flex-grow-1" style={{ minHeight: 0 }}>

                {/* Media Setup Sidebar */}
                <div className="col-md-5 d-flex flex-column align-items-center justify-content-center p-4 border-end position-relative" style={{ background: 'linear-gradient(160deg, #0d1117 0%, #161b22 50%, #0d1117 100%)', borderColor: 'var(--border-color) !important', overflow: 'hidden' }}>
                  {/* Subtle grid pattern */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                  {/* Section title */}
                  <div className="text-center mb-3 position-relative">
                    <span className="text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '2.5px', color: '#00b4d8' }}>Permission Check</span>
                  </div>

                  {/* Camera preview */}
                  <div className="position-relative mb-4">
                    <div className={`rounded-4 d-flex align-items-center justify-content-center transition-all container-camera ${cam ? 'camera-active' : 'camera-inactive'}`}
                      style={{ border: '2px solid', width: '100%', maxWidth: '240px', minWidth: '200px', aspectRatio: '4/3', backgroundColor: cam ? 'rgba(0,180,216,0.05)' : 'rgba(255,255,255,0.03)', position: 'relative' }}>
                      <User size={64} style={{ color: cam ? '#00b4d8' : 'rgba(255,255,255,0.15)', transition: 'color 0.3s ease' }} />
                      {cam && <div className="camera-pulse-ring"></div>}
                    </div>
                  </div>

                  {/* Toggle buttons with labels */}
                  <div className="d-flex gap-4 mb-4 position-relative">
                    <div className="d-flex flex-column align-items-center gap-2">
                      <button onClick={() => setMic(!mic)} className={`btn rounded-circle p-0 d-flex align-items-center justify-content-center transition-all hw-btn ${mic ? 'hw-btn-active' : 'hw-btn-inactive'}`} style={{ width: '48px', height: '48px' }}>
                        <Mic size={20} />
                      </button>
                      <div className="d-flex align-items-center gap-1">
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: mic ? '#10b981' : '#ef4444', boxShadow: mic ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(239,68,68,0.4)' }}></div>
                        <span style={{ fontSize: '0.65rem', color: mic ? '#10b981' : 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.5px' }}>{mic ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <button onClick={() => setCam(!cam)} className={`btn rounded-circle p-0 d-flex align-items-center justify-content-center transition-all hw-btn ${cam ? 'hw-btn-active' : 'hw-btn-inactive'}`} style={{ width: '48px', height: '48px' }}>
                        <Video size={20} />
                      </button>
                      <div className="d-flex align-items-center gap-1">
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cam ? '#10b981' : '#ef4444', boxShadow: cam ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(239,68,68,0.4)' }}></div>
                        <span style={{ fontSize: '0.65rem', color: cam ? '#10b981' : 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.5px' }}>{cam ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="position-relative d-flex align-items-center gap-2 px-3 py-2 rounded-pill" style={{ background: (mic && cam) ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${(mic && cam) ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.3s ease' }}>
                    {(mic && cam) ? <CheckCircle2 size={14} style={{ color: '#10b981' }} /> : <AlertCircle size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: (mic && cam) ? '#10b981' : 'rgba(255,255,255,0.35)', letterSpacing: '0.5px' }}>
                      {(mic && cam) ? 'System Ready' : 'Hardware Pending'}
                    </span>
                  </div>
                </div>

                {/* Session Configuration (Setup Panel) */}
                <div className="d-flex flex-column p-3 p-xl-4 flex-grow-1 position-relative" style={{ background: 'linear-gradient(180deg, #fafcff 0%, #f0f6fa 100%)', minWidth: 0, overflow: 'hidden' }}>
                  {/* Decorative corner accent */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle at top right, rgba(0,180,216,0.06) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

                  <div className="position-relative">
                    {/* Header with icon */}
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <svg viewBox="0 0 100 100" style={{ width: '24px', height: '24px' }} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="50" cy="50" r="46" stroke="#000" strokeWidth="4" />
                        <path d="M 32 32 L 32 68" stroke="#00b4d8" strokeWidth="18" />
                        <path d="M 32 32 L 68 68 L 68 32" stroke="#121a2f" strokeWidth="18" />
                      </svg>
                      <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Interview Setup</h5>
                    </div>
                    <p className="small mb-3" style={{ color: 'var(--text-secondary)', paddingLeft: '36px' }}>Configure your session and get started.</p>

                    {/* Step 1: Target Domain */}
                    <div className="mb-3 config-field">
                      <label className="fw-bold small mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '18px', height: '18px', fontSize: '0.6rem', fontWeight: 700, background: role ? '#10b981' : 'rgba(0,180,216,0.15)', color: role ? '#fff' : '#00b4d8', transition: 'all 0.3s ease' }}>{role ? '✓' : '1'}</span>
                        TARGET DOMAIN
                      </label>
                      <div className="d-flex gap-3">
                        {[
                          { value: 'Python', label: 'Python Stack', desc: 'Basic Python, Flask, Django', icon: '🐍', bg: 'rgba(59,130,246,0.08)' },
                          { value: 'Java', label: 'Java Stack', desc: 'Core Java, Collections, Spring', icon: '☕', bg: 'rgba(249,115,22,0.08)' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRole(opt.value)}
                            className={`domain-option flex-grow-1 rounded-3 p-3 text-start ${role === opt.value ? 'domain-active' : ''}`}
                            style={{
                              background: role === opt.value ? 'rgba(0,180,216,0.06)' : '#fff',
                              border: role === opt.value ? '2px solid #00b4d8' : '2px solid rgba(0,0,0,0.08)',
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                              boxShadow: role === opt.value ? '0 4px 12px rgba(0,180,216,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '40px', height: '40px', background: role === opt.value ? 'rgba(0,180,216,0.12)' : opt.bg, flexShrink: 0 }}>
                                <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                              </div>
                              <div>
                                <div className="fw-bold" style={{ fontSize: '0.85rem', color: role === opt.value ? '#00b4d8' : 'var(--text-primary)' }}>{opt.label}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: '1px' }}>{opt.desc}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Experience Level in selected tech stack */}
                    <div className="mb-3 config-field">
                      <label className="fw-bold small mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '18px', height: '18px', fontSize: '0.6rem', fontWeight: 700, background: experienceLevel ? '#10b981' : 'rgba(0,180,216,0.15)', color: experienceLevel ? '#fff' : '#00b4d8', transition: 'all 0.3s ease' }}>{experienceLevel ? '✓' : '2'}</span>
                        EXPERIENCE LEVEL {role ? `(${role.toUpperCase()})` : ''} <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#ef4444' }}>(required)</span>
                      </label>
                      <div className="d-flex gap-2">
                        {[
                          { value: 'Beginner', label: 'Beginner', subtitle: '0–2 yrs', desc: 'Foundations & Syntax', icon: '🌱', bg: 'rgba(16,185,129,0.08)' },
                          { value: 'Intermediate', label: 'Intermediate', subtitle: '2–5 yrs', desc: 'Core Concepts & OOP', icon: '⚡', bg: 'rgba(59,130,246,0.08)' },
                          { value: 'Advanced', label: 'Advanced', subtitle: '5+ yrs', desc: 'Architecture & Scaling', icon: '🚀', bg: 'rgba(139,92,246,0.08)' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setExperienceLevel(opt.value)}
                            className={`domain-option flex-grow-1 rounded-3 p-2 p-sm-3 text-start ${experienceLevel === opt.value ? 'domain-active' : ''}`}
                            style={{
                              background: experienceLevel === opt.value ? 'rgba(0,180,216,0.06)' : '#fff',
                              border: experienceLevel === opt.value ? '2px solid #00b4d8' : '2px solid rgba(0,0,0,0.08)',
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                              boxShadow: experienceLevel === opt.value ? '0 4px 12px rgba(0,180,216,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '36px', height: '36px', background: experienceLevel === opt.value ? 'rgba(0,180,216,0.12)' : opt.bg, flexShrink: 0 }}>
                                <span style={{ fontSize: '1.1rem' }}>{opt.icon}</span>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div className="d-flex align-items-center gap-1 flex-wrap">
                                  <span className="fw-bold" style={{ fontSize: '0.82rem', color: experienceLevel === opt.value ? '#00b4d8' : 'var(--text-primary)' }}>{opt.label}</span>
                                  <span className="badge rounded-pill" style={{ fontSize: '0.58rem', backgroundColor: experienceLevel === opt.value ? 'rgba(0,180,216,0.15)' : 'rgba(0,0,0,0.05)', color: experienceLevel === opt.value ? '#007799' : 'var(--text-muted)', fontWeight: 600 }}>{opt.subtitle}</span>
                                </div>
                                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.2, marginTop: '2px' }}>{opt.desc}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Resume Upload */}
                    <div className="mb-2 config-field">
                      <label className="fw-bold small mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '18px', height: '18px', fontSize: '0.6rem', fontWeight: 700, background: file ? '#10b981' : 'rgba(0,180,216,0.15)', color: file ? '#fff' : '#00b4d8', transition: 'all 0.3s ease' }}>{file ? '✓' : '3'}</span>
                        RESUME UPLOAD <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#ef4444' }}>(required)</span>
                      </label>
                      <div className="rounded-3 text-center transition-all config-dropzone" style={{ border: `2px dashed ${file ? '#10b981' : 'rgba(239,68,68,0.3)'}`, backgroundColor: file ? 'rgba(16,185,129,0.04)' : 'rgba(0,0,0,0.02)', padding: '0.75rem', transition: 'all 0.3s ease' }}>
                        <input type="file" id="up" hidden accept=".pdf" onChange={(e) => { setFile(e.target.files[0]); setAnalyzeError(''); }} />
                        <label htmlFor="up" className="mb-0 w-100 cursor-pointer d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '0.85rem' }}>
                          {file ? (
                            <>
                              <FileText size={18} style={{ color: '#10b981' }} />
                              <span style={{ color: '#10b981', fontWeight: 600 }}>{file.name}</span>
                            </>
                          ) : (
                            <>
                              <Upload size={18} style={{ color: '#00b4d8' }} />
                              <span style={{ color: 'var(--text-secondary)' }}>Click to upload resume (PDF) — Required</span>
                            </>
                          )}
                        </label>
                      </div>
                      {/* Analysis Button */}
                      <button
                        onClick={analyzeResume}
                        disabled={!file || isAnalyzing}
                        className="btn btn-sm w-100 mt-2 rounded-3 border-0 py-2 d-flex align-items-center justify-content-center gap-2"
                        style={{ backgroundColor: 'rgba(0,180,216,0.1)', color: '#00b4d8', fontWeight: 600 }}
                      >
                        {isAnalyzing ? <Loader2 size={16} className="spin-icon" /> : <Terminal size={16} />}
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
                      </button>
                      {/* Extracted Resume Info */}
                      {resumeData && (
                        <div className="mt-3 p-3 rounded-4 custom-scrollbar" style={{ background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.2)', maxHeight: '300px', overflowY: 'auto' }}>
                          <h6 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Extracted Resume Information</h6>
                          <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{JSON.stringify(resumeData, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* START ACTION */}
                  <div className="mt-auto pt-3">
                    {/* Readiness bar */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="d-flex gap-1 flex-grow-1">
                        {[mic, cam, !!role, !!experienceLevel, !!file].map((ready, i) => (
                          <div key={i} className="flex-grow-1 rounded-pill" style={{ height: '3px', backgroundColor: ready ? '#00b4d8' : 'rgba(0,0,0,0.08)', transition: 'background-color 0.4s ease' }}></div>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        {[mic, cam, !!role, !!experienceLevel, !!file].filter(Boolean).length}/5
                      </span>
                    </div>
                    {analyzeError && (
                      <div className="mb-2 px-3 py-2 rounded-3 d-flex align-items-center gap-2"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.78rem', color: '#dc2626' }}>
                        <AlertCircle size={14} />
                        {analyzeError}
                      </div>
                    )}
                    <button
                      onClick={handleStartSession}
                      disabled={!isReady || isAnalyzing}
                      className={`launch-btn py-2 d-flex align-items-center justify-content-center gap-2 w-100 rounded-3 border-0 fw-bold ${isReady && !isAnalyzing ? 'launch-btn-ready' : 'launch-btn-disabled'}`}
                    >
                      {isAnalyzing ? (
                        <><Loader2 size={18} className="spin-icon" /> Analyzing Resume…</>
                      ) : (
                        <>
                          <PlayCircle size={18} /> Launch Session {isReady && <ArrowRight size={16} className="launch-arrow" />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: PREVIOUS HISTORY SIDEBAR */}
          <div className="animate-fade-in animate-delay-2 sidebar-panel d-flex flex-column" style={{ flex: '0 0 auto', minHeight: 0 }}>
            <div className="dash-card flex-grow-1 border-0 rounded-4 d-flex flex-column" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minHeight: 0 }}>
              <div className="p-4 border-bottom glass-panel sticky-top rounded-top-4" style={{ borderBottomColor: 'var(--border-color) !important' }}>
                <h5 className="fw-bold mb-0 text-gradient d-flex align-items-center gap-2">
                  <Clock size={20} /> Recent Activity
                </h5>
              </div>
              <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleHistoryNavigation(item)}
                      className="p-3 mb-3 rounded-4 transition-all hover-card"
                      style={{ cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0 small" style={{ color: 'var(--text-primary)' }}>{item.role}</h6>
                        <span className="badge rounded-pill px-3 py-1" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                          {item.score}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center small mt-2">
                        <span style={{ color: 'var(--text-muted)' }}><Clock size={12} className="me-1" />{item.date}</span>
                        <span className="fw-bold small d-flex align-items-center gap-1 transition-all link-hover" style={{ color: 'var(--accent-primary)' }}>
                          Analysis <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center h-100 d-flex flex-column align-items-center justify-content-center opacity-50 pb-5">
                    <Clock size={40} className="mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>No previous sessions recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .hover-profile-btn {
          background-color: rgba(255,255,255,0.05) !important;
        }
        .hover-profile-btn:hover {
          background-color: rgba(255,255,255,0.1) !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        .camera-active {
          border-color: #00b4d8 !important;
          box-shadow: 0 0 30px rgba(0,180,216,0.15) inset, 0 0 25px rgba(0,180,216,0.2);
        }
        .camera-inactive {
          border-color: rgba(255,255,255,0.08) !important;
        }

        .camera-pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 18px;
          border: 2px solid rgba(0,180,216,0.3);
          animation: cameraPulse 2s ease-in-out infinite;
        }
        @keyframes cameraPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.03); }
        }
        
        .hw-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .hw-btn-active {
          background: linear-gradient(135deg, #00b4d8 0%, #0096b4 100%) !important;
          color: white !important;
          border: none !important;
          box-shadow: 0 4px 15px rgba(0,180,216,0.4), 0 0 0 3px rgba(0,180,216,0.15);
        }
        .hw-btn-active:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(0,180,216,0.5), 0 0 0 3px rgba(0,180,216,0.2);
        }
        .hw-btn-inactive {
          background: rgba(255,255,255,0.04) !important;
          color: rgba(255,255,255,0.4) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .hw-btn-inactive:hover {
          background: rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.6) !important;
          border-color: rgba(255,255,255,0.2) !important;
          transform: scale(1.05);
        }

        .select-dark {
          background-color: rgba(0,0,0,0.2) !important;
          border-color: var(--border-color) !important;
          color: var(--text-primary) !important;
        }
        .select-dark option {
          background-color: var(--bg-panel);
          color: var(--text-primary);
        }

        .file-dropzone:hover, .config-dropzone:hover {
          border-color: var(--accent-primary) !important;
          background-color: rgba(0, 180, 216, 0.04) !important;
        }

        .config-select {
          background-color: #fff !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
          color: var(--text-primary) !important;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .config-select:focus {
          border-color: #00b4d8 !important;
          box-shadow: 0 0 0 3px rgba(0,180,216,0.12) !important;
        }
        .config-select option {
          background-color: #fff;
          color: var(--text-primary);
        }

        .config-field {
          transition: all 0.3s ease;
        }

        .domain-option:hover {
          border-color: rgba(0,180,216,0.3) !important;
          background: rgba(0,180,216,0.04) !important;
          transform: translateY(-1px);
        }
        .domain-active {
          border-color: #00b4d8 !important;
          box-shadow: 0 2px 8px rgba(0,180,216,0.15);
        }

        .launch-btn {
          font-size: 0.9rem;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.3px;
        }
        .launch-btn-ready {
          background: linear-gradient(135deg, #00b4d8 0%, #0096b4 100%);
          color: #fff;
          box-shadow: 0 4px 16px rgba(0,180,216,0.35);
        }
        .launch-btn-ready:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,180,216,0.45);
        }
        .launch-btn-ready:hover .launch-arrow {
          transform: translateX(4px);
        }
        .launch-btn-disabled {
          background: rgba(0,0,0,0.06);
          color: rgba(0,0,0,0.3);
          cursor: not-allowed;
        }
        .launch-arrow {
          transition: transform 0.3s ease;
        }
        
        .link-hover:hover {
          transform: translateX(3px);
          color: var(--accent-primary-hover) !important;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }

        .sidebar-panel {
          width: 100%;
        }
        @media (min-width: 1200px) {
          .sidebar-panel {
            width: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default NextHireDashBoard;
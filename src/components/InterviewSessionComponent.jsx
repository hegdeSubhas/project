import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  Phone, Mic, MicOff, Video, VideoOff,
  Volume2, VolumeX, Clock, SkipForward,
  AlertTriangle, Loader2, CheckCircle2, Zap, FileText, X, Cast, Monitor, MonitorOff
} from 'lucide-react';

// ─── Config ────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';
const MAX_SECONDS = 15 * 60;
const SILENCE_MS = 4000;   // auto-submit after 4 s of silence

const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

// ─── Icebreaker questions ───────────────────────────────────────────────────────
const ICEBREAKERS = [
  {
    id: 'ib1',
    question: "So, tell me a bit about yourself — your background and what's been keeping you busy lately?",
    follow_up: "That sounds interesting! What's one thing from that experience you're most proud of?",
    keywords: []
  },
  {
    id: 'ib2',
    question: "What got you into this field in the first place? Was there a specific moment that clicked for you?",
    follow_up: "I love that! How has that motivation shaped the kind of work you look for today?",
    keywords: []
  },
];

// ─── Acknowledgement pool ──────────────────────────────────────────────────────
const ACKS_GOOD = ["Great answer!", "Nice, I like that.", "Solid.", "Really good point.", "Absolutely, well said!", "That makes sense.", "I appreciate that."];
const ACKS_BRIDGE = ["Alright, next one —", "Moving on —", "Here's another —", "Good! Now,", "Let's try this —"];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function InterviewSessionComponent({
  onEndSession,
  role = 'Software Engineer',
  candidate = 'You',
  interviewPlan = [],
  detectedSkills = [],
  experienceLevel = 'mid',
  closingMessage = "Those were some really great answers. That's everything I had for today — thank you so much, it was a genuine pleasure chatting with you!",
  agentId = 'v2_agt_uUIJjjWL',
  clientKey = 'ck_9TKy6r9Kv3zii59c-sN1n',
}) {

  // ── D-ID Agent Injection ───────────────────────────────────────────────────
  useEffect(() => {
    const containerId = 'did-agent-container';
    const scriptId = 'did-agent-script';

    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'module';
    script.src = 'https://agent.d-id.com/v2/index.js';
    script.setAttribute('data-mode', 'full');
    script.setAttribute('data-client-key', clientKey);
    script.setAttribute('data-agent-id', agentId);
    script.setAttribute('data-name', 'did-agent');
    script.setAttribute('data-monitor', 'true');
    script.setAttribute('data-target-id', containerId);

    document.body.appendChild(script);

    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
    };
  }, [agentId, clientKey]);

  // ── Hide D-ID "Start Call" Button Safely ────────────────────────────────────
  useEffect(() => {
    let autoClicked = false;

    const hideStartCallBtn = () => {
      const container = document.getElementById('did-agent-container');
      if (!container) return;

      const inspectRoot = (root) => {
        if (!root) return;

        // Target ONLY buttons containing "start call" text
        const buttons = root.querySelectorAll('button, div[role="button"], a');
        buttons.forEach(btn => {
          const txt = (btn.textContent || '').trim().toLowerCase();
          if (txt.includes('start call') || txt === 'start call') {
            if (!autoClicked && typeof btn.click === 'function') {
              autoClicked = true;
              try { btn.click(); } catch (_) { }
            }
            btn.style.setProperty('display', 'none', 'important');
            btn.style.setProperty('visibility', 'hidden', 'important');
            btn.style.setProperty('opacity', '0', 'important');
            btn.style.setProperty('pointer-events', 'none', 'important');
          }
        });

        // Traverse nested shadow roots
        root.querySelectorAll('*').forEach(child => {
          if (child.shadowRoot) {
            inspectRoot(child.shadowRoot);
          }
        });
      };

      inspectRoot(container);
    };

    const interval = setInterval(hideStartCallBtn, 300);
    const containerEl = document.getElementById('did-agent-container');
    let observer;
    if (containerEl) {
      observer = new MutationObserver(hideStartCallBtn);
      observer.observe(containerEl, { childList: true, subtree: true });
    }

    return () => {
      clearInterval(interval);
      if (observer) observer.disconnect();
    };
  }, []);

  // ── Refs (stable, never stale) ─────────────────────────────────────────────
  const videoRef = useRef(null);
  const webcamStreamRef = useRef(null); // persistent webcam MediaStream
  const screenVideoRef = useRef(null);   // screen share preview video
  const screenStreamRef = useRef(null);  // screen share MediaStream
  const recRef = useRef(null);     // SpeechRecognition instance
  const silenceRef = useRef(null);     // silence debounce timer
  const transcriptEnd = useRef(null);     // scroll anchor
  const mutedRef = useRef(false);    // always-current muted flag
  const stateRef = useRef({});       // snapshot of key state for callbacks
  const slotMainRef = useRef(null);      // container slot in main left interviewer card
  const slotSmallRef = useRef(null);     // container slot in small right interviewer card when sharing
  const agentContainerRef = useRef(null);// reference to #did-agent-container

  // ── Media ──────────────────────────────────────────────────────────────────
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);  // screen share active
  const [shareError, setShareError] = useState('');   // error message

  // ── Timer ──────────────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);

  // ── Conversation ───────────────────────────────────────────────────────────
  const [msgs, setMsgs] = useState([]);      // chat bubbles
  const [liveText, setLiveText] = useState('');      // interim speech
  const [pendingText, setPendingText] = useState('');      // final before submit
  const [isSpeaking, setIsSpeaking] = useState(false);   // alex TTS active
  const [isListening, setIsListening] = useState(false);   // mic active
  const [isThinking, setIsThinking] = useState(false);   // NLP call in-flight
  const [muted, setMuted] = useState(false);
  const [done, setDone] = useState(false);

  // ── Question engine ────────────────────────────────────────────────────────
  const [techQs, setTechQs] = useState([]);
  const [loadingQs, setLoadingQs] = useState(true);
  const [phase, setPhase] = useState('icebreaker');
  const [ibIdx, setIbIdx] = useState(0);       // icebreaker index
  const [techIdx, setTechIdx] = useState(0);       // technical index
  const [followUpQ, setFollowUpQ] = useState(null);    // active follow-up
  const [askedFollowUp, setAskedFollowUp] = useState(false);
  const [activeQ, setActiveQ] = useState('');      // shown on screen
  const [qCount, setQCount] = useState(0);       // total asked

  // ── Keep ref snapshot in sync ──────────────────────────────────────────────
  useEffect(() => {
    stateRef.current = { phase, ibIdx, techIdx, techQs, askedFollowUp, followUpQ, done };
  }, [phase, ibIdx, techIdx, techQs, askedFollowUp, followUpQ, done]);

  // ── Voice loading (async in Chrome) ───────────────────────────────────────
  const voicesRef = useRef([]);
  useEffect(() => {
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load);
  }, []);

  // ── Master unmount cleanup ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      clearTimeout(silenceRef.current);
      try { recRef.current?.abort(); } catch (_) { }
      // Stop webcam stream
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
      }
      // Stop any active screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ── Webcam ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { width: 640 }, audio: true })
      .then(s => {
        webcamStreamRef.current = s;      // save stream persistently
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => { });
    return () => {
      webcamStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Reattach webcam when video element remounts (e.g. isSharing toggle) ───
  useEffect(() => {
    if (webcamStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = webcamStreamRef.current;
    }
  }, [isSharing]); // fires after React mounts the PiP in its new position

  // ── Dynamic Reparenting of D-ID Interviewer Container on Screen Share ────
  useLayoutEffect(() => {
    const agentEl = agentContainerRef.current || document.getElementById('did-agent-container');
    const targetSlot = isSharing ? slotSmallRef.current : slotMainRef.current;
    if (agentEl && targetSlot && agentEl.parentElement !== targetSlot) {
      targetSlot.appendChild(agentEl);
    }
  }, [isSharing]);


  // ── Session timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => Math.min(e + 1, MAX_SECONDS)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (elapsed >= MAX_SECONDS && !done) {
      stopListening();
      window.speechSynthesis.cancel();
      addMsg('system', '⏰ Time limit reached. Interview auto-completed.');
      setDone(true);
    }
  }, [elapsed, done]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, liveText]);

  // ── Add message bubble ─────────────────────────────────────────────────────
  const addMsg = useCallback((role, text, meta = {}) => {
    setMsgs(prev => [...prev, {
      id: Date.now() + Math.random(),
      role, text,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...meta,
    }]);
  }, []);

  // ── D-ID Avatar Speech Trigger ─────────────────────────────────────────────
  const speakWithDIDAvatar = useCallback((text) => {
    if (!text) return;
    try {
      const container = document.getElementById('did-agent-container');
      if (!container) return;

      // 1. Target <did-agent> custom element API
      const didAgent = container.querySelector('did-agent') || document.querySelector('did-agent');
      if (didAgent) {
        if (typeof didAgent.speak === 'function') {
          didAgent.speak({ type: 'text', input: text });
        } else if (typeof didAgent.chat === 'function') {
          didAgent.chat(text);
        } else if (typeof didAgent.sendMessage === 'function') {
          didAgent.sendMessage(text);
        } else if (typeof didAgent.send === 'function') {
          didAgent.send(text);
        }
      }

      // 2. Target iframe message interface
      const iframes = container.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          iframe.contentWindow?.postMessage({ type: 'speak', text, input: text }, '*');
          iframe.contentWindow?.postMessage({ type: 'chat', message: text, text }, '*');
          iframe.contentWindow?.postMessage({ type: 'agent-speak', input: text }, '*');
        } catch (_) { }
      });
    } catch (e) {
      console.warn('D-ID avatar speech trigger warning:', e);
    }
  }, []);

  // ── TTS: Alex / D-ID Human Speaks ──────────────────────────────────────────
  const alexSay = useCallback((text, onDone) => {
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setIsListening(false);
    setLiveText('');
    setPendingText('');

    // Trigger D-ID Human Avatar to speak input question
    speakWithDIDAvatar(text);

    if (mutedRef.current) {
      setTimeout(() => { setIsSpeaking(false); onDone?.(); }, 60);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    // Pick a distinct male voice across Windows, Edge, Chrome, and macOS
    const voices = voicesRef.current;
    const maleVoice = voices.find(v => /male|david|mark|guy|christopher|daniel|alex|george|james|fred|richard|stefan|brian/i.test(v.name))
      || voices.find(v => v.lang === 'en-US' && !/female|zira|samantha|karen|victoria|moira|fiona|veena|hazel|susan/i.test(v.name))
      || voices.find(v => v.lang?.startsWith('en') && !/female|zira|samantha|karen|victoria|moira|fiona|veena|hazel|susan/i.test(v.name))
      || voices[0];
    if (maleVoice) utter.voice = maleVoice;
    utter.rate = 0.95;
    utter.pitch = 0.92; // Natural deeper pitch for male voice

    const finish = () => { setIsSpeaking(false); onDone?.(); };
    utter.onend = finish;
    utter.onerror = finish;

    window.speechSynthesis.speak(utter);
  }, [speakWithDIDAvatar]);

  // ── Start speech recognition ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.warn('SpeechRecognition not available'); return; }

    try { recRef.current?.abort(); } catch (_) { }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    recRef.current = rec;

    let accumulated = '';

    rec.onstart = () => setIsListening(true);
    rec.onerror = (e) => { if (e.error !== 'no-speech') console.warn('SR error', e.error); };
    rec.onend = () => setIsListening(false);

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) accumulated += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setLiveText(interim);
      if (accumulated.trim()) setPendingText(accumulated.trim());

      // Silence timer — fires after user stops speaking
      clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        const ans = accumulated.trim();
        if (ans.length > 1) {
          stopListeningNow();
          processAnswer(ans);
        }
      }, SILENCE_MS);
    };

    try { rec.start(); } catch (_) { }
  }, []);

  const stopListeningNow = useCallback(() => {
    clearTimeout(silenceRef.current);
    try { recRef.current?.stop(); } catch (_) { }
    setIsListening(false);
    setLiveText('');
  }, []);

  const stopListening = stopListeningNow; // alias

  // ── NLP: process answer, decide next step ─────────────────────────────────
  const processAnswer = useCallback(async (answer) => {
    const { phase, ibIdx, techIdx, techQs, askedFollowUp, followUpQ } = stateRef.current;
    addMsg('you', answer);
    setPendingText('');
    setIsThinking(true);

    // Determine what question was just answered
    const currentQ = followUpQ
      || (phase === 'icebreaker' ? ICEBREAKERS[ibIdx] : techQs[techIdx])
      || { question: '', follow_up: null, keywords: [] };

    let decision;
    try {
      const res = await fetch(`${API_BASE}/interviews/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswer: answer, currentQuestion: currentQ, askedFollowUp }),
      });
      decision = await res.json();
    } catch (_) {
      decision = { action: 'acknowledge_and_next', acknowledgement: pick(ACKS_GOOD) + ' ' };
    }
    setIsThinking(false);
    applyDecision(decision, currentQ);
  }, [addMsg]);

  // ── Apply NLP decision ─────────────────────────────────────────────────────
  const applyDecision = useCallback((decision, currentQ) => {
    if (decision.action === 'follow_up' || decision.action === 'encourage') {
      // Ask follow-up
      const fuText = decision.text;
      setFollowUpQ({ ...currentQ, question: fuText, follow_up: null });
      setAskedFollowUp(true);
      setActiveQ(fuText);
      addMsg('alex', fuText);
      setQCount(c => c + 1);
      alexSay(fuText, () => startListening());
    } else {
      // Move to next question
      setFollowUpQ(null);
      setAskedFollowUp(false);
      const ack = decision.acknowledgement || pick(ACKS_GOOD) + ' ';
      advanceQuestion(ack);
    }
  }, [addMsg, alexSay, startListening]);

  // ── Advance to next question in sequence ──────────────────────────────────
  const advanceQuestion = useCallback((prefix = '') => {
    const { phase, ibIdx, techIdx, techQs } = stateRef.current;

    // Still icebreakers?
    if (phase === 'icebreaker') {
      const next = ibIdx + 1;
      if (next < ICEBREAKERS.length) {
        setIbIdx(next);
        const q = ICEBREAKERS[next];
        setActiveQ(q.question);
        addMsg('alex', q.question);
        setQCount(c => c + 1);
        alexSay(prefix + q.question, () => startListening());
        return;
      }
      // Move to technical
      setPhase('technical');
      setTechIdx(0);
      if (!techQs || techQs.length === 0) { endSession(prefix); return; }
      const transition = prefix + `Great, I love your energy! Now let's dig into some ${role}-specific questions. Take your time — there are no wrong answers, just think out loud.`;
      const q = techQs[0];
      setActiveQ(q.question);
      addMsg('alex', transition.replace(prefix, '').trim());
      addMsg('alex', q.question);
      setQCount(c => c + 2);
      alexSay(transition + ' ' + q.question, () => startListening());
      return;
    }

    // Technical questions
    const next = techIdx + 1;
    if (next >= techQs.length) { endSession(prefix); return; }
    setTechIdx(next);
    const q = techQs[next];
    const bridge = pick(ACKS_BRIDGE);
    const fullText = prefix + bridge + ' ' + q.question;
    setActiveQ(q.question);
    addMsg('alex', bridge + ' ' + q.question);
    setQCount(c => c + 1);
    alexSay(fullText, () => startListening());
  }, [addMsg, alexSay, startListening, role]);

  // ── End the interview ──────────────────────────────────────────────────────
  const endSession = useCallback((prefix = '') => {
    setDone(true);
    setActiveQ('');
    stopListening();
    addMsg('alex', closingMessage);
    alexSay(prefix + closingMessage, null);
    addMsg('system', '✅ Interview complete.');
  }, [stopListening, addMsg, alexSay, closingMessage]);

  // ── Load tech questions from backend ───────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/interviews/select-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, experienceLevel, count: 8 }),
    })
      .then(r => r.json())
      .then(d => { setTechQs(d.questions || []); setLoadingQs(false); })
      .catch(() => {
        // Fallback to plan questions
        const flat = interviewPlan.flatMap(p =>
          (p.questions || []).filter(q => q.type !== 'conversational' && q.question)
        );
        setTechQs(flat);
        setLoadingQs(false);
      });
  }, [role, experienceLevel]);

  // ── Kick off interview once voices + questions are ready ───────────────────
  const started = useRef(false);
  useEffect(() => {
    if (loadingQs || started.current) return;
    // Wait a tick for voices to populate
    const t = setTimeout(() => {
      started.current = true;
      const greeting = `Hey ${candidate}! I'm Alex, your interviewer for today. We've got about 15 minutes together, so let's make it a great conversation. I'll start with a couple of relaxed warm-up questions and then we'll get into some ${role}-related topics. Sound good? Let's dive in!`;
      const firstQ = ICEBREAKERS[0];

      addMsg('system', `🎙 Session started · ${role} Interview`);
      addMsg('alex', greeting.replace(/Hey.*?Let's dive in! /s, '').trim());
      addMsg('alex', firstQ.question);
      setActiveQ(firstQ.question);
      setQCount(2);
      alexSay(greeting + ' ' + firstQ.question, () => startListening());
    }, 1200);
    return () => clearTimeout(t);
  }, [loadingQs]);

  // ── Exit handler ───────────────────────────────────────────────────────────
  const handleExit = () => {
    window.speechSynthesis.cancel();
    stopListeningNow();
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    onEndSession();
  };

  // ── Manual submit ──────────────────────────────────────────────────────────
  const submitNow = () => {
    const ans = pendingText || liveText;
    if (!ans.trim()) return;
    stopListeningNow();
    processAnswer(ans.trim());
  };

  const skipQuestion = () => {
    stopListeningNow();
    addMsg('you', '(skipped)');
    advanceQuestion("No worries, let's move on. ");
  };

  // ── Media toggles ──────────────────────────────────────────────────────────
  const toggleCam = () => {
    const t = videoRef.current?.srcObject?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setCamOn(o => !o); }
  };
  const toggleMic = () => {
    const t = videoRef.current?.srcObject?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMicOn(o => !o); }
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next) window.speechSynthesis.cancel();
  };

  // ── Screen share ───────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    setShareError('');
    if (isSharing) {
      // Stop sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      setIsSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });
        screenStreamRef.current = stream;
        // NOTE: do NOT set srcObject here — the <video> element is conditionally
        // rendered and won't be in the DOM until isSharing becomes true.
        // The useEffect below handles attaching the stream after mount.
        setIsSharing(true);
        // Auto-stop when user clicks browser's native "Stop sharing" button
        stream.getVideoTracks()[0].onended = () => {
          screenStreamRef.current = null;
          if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
          setIsSharing(false);
        };
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          setShareError('Screen share failed. Please try again.');
        }
        setIsSharing(false);
      }
    }
  }, [isSharing]);

  // ── Attach screen stream to video element once it mounts (after isSharing = true) ───
  useEffect(() => {
    if (isSharing && screenStreamRef.current && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSharing]);  // runs every time isSharing toggles

  // ── Computed ───────────────────────────────────────────────────────────────
  const remaining = Math.max(0, MAX_SECONDS - elapsed);
  const tColor = remaining < 120 ? '#ef4444' : remaining < 300 ? '#f59e0b' : '#10b981';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      background: '#f0f4f8',
    }}>

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <div style={{
        height: 54, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px',
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px', color: '#111' }}>
            Next<span style={{ color: '#00b4d8' }}>Hire</span>
          </span>
          <div style={{ width: 1, height: 18, background: '#e5e7eb' }} />
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{role} Interview</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: phase === 'icebreaker' ? '#fffbeb' : '#eff6ff',
            color: phase === 'icebreaker' ? '#d97706' : '#2563eb',
            border: `1px solid ${phase === 'icebreaker' ? '#fde68a' : '#bfdbfe'}`,
          }}>
            {phase === 'icebreaker' ? '' : `🔥 ${role}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {detectedSkills.slice(0, 4).map(s => (
              <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 600 }}>{s}</span>
            ))}
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13,
            color: tColor, background: `${tColor}15`, border: `1.5px solid ${tColor}40`,
          }}>
            <Clock size={13} /> {fmt(remaining)}
          </span>
        </div>
      </div>

      {/* ═══ SCREEN SHARE BANNER ═════════════════════════════════════════════ */}
      {isSharing && (
        <div style={{
          flexShrink: 0, padding: '0 20px',
          background: 'linear-gradient(90deg,#0f172a,#1e293b)',
          borderBottom: '1px solid rgba(0,180,216,0.3)',
          display: 'flex', alignItems: 'center', gap: 10, height: 36,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'blink 1s infinite' }} />
          <span style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 700 }}>You are sharing your screen with the interviewer</span>
          <button onClick={toggleScreenShare} style={{
            marginLeft: 'auto', padding: '3px 12px', borderRadius: 20, border: 'none',
            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            border: '1px solid rgba(239,68,68,0.3)',
          }}>Stop Sharing</button>
        </div>
      )}

      {/* ═══ BODY ════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: 16, overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: changes based on sharing state ──────────────────── */}
        <div style={{ flex: isSharing ? 3 : 2.2, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, minHeight: 0, transition: 'flex 0.4s ease' }}>

          {/* ── When sharing: full-size screen share panel ── */}
          {isSharing && (
            <div style={{
              position: 'relative', flex: 1, borderRadius: 16, overflow: 'hidden',
              background: '#0a0f1a',
              border: '2px solid rgba(0,180,216,0.5)',
              boxShadow: '0 0 32px rgba(0,180,216,0.18)',
              minHeight: 0,
            }}>
              <video ref={screenVideoRef} autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#0a0f1a' }} />
              {/* Screen label */}
              <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(4px)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }} />
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>Screen Share</span>
              </div>
              {/* Candidate PiP: bottom-left */}
              <div style={{
                position: 'absolute', bottom: 14, left: 14,
                width: 160, height: 105, borderRadius: 10, overflow: 'hidden',
                border: isListening ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.25)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)', background: '#000', zIndex: 10,
              }}>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
                {!camOn && (
                  <div style={{ position: 'absolute', inset: 0, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <VideoOff size={18} color="#64748b" />
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 7px', background: 'linear-gradient(to top,rgba(0,0,0,0.8),transparent)' }}>
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{candidate}</span>
                </div>
                {isListening && (
                  <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', background: 'rgba(16,185,129,0.9)', borderRadius: 20 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }} />
                    <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>Live</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alex / D-ID interviewer avatar card — always in DOM, hidden when sharing */}
          <div style={{
            position: 'relative', borderRadius: 16, overflow: 'hidden',
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: isSpeaking ? '2px solid #00b4d8' : '2px solid rgba(255,255,255,0.06)',
            boxShadow: isSpeaking ? '0 0 28px rgba(0,180,216,0.4)' : '0 4px 20px rgba(0,0,0,0.25)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            flex: isSharing ? '0 0 0px' : 1,
            minHeight: 0,
            display: isSharing ? 'none' : undefined,
          }}>
            {/* Target slot for D-ID Agent */}
            <div ref={slotMainRef} style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden', borderRadius: 16 }}>
              {/* D-ID Interactive AI Agent Container */}
              <div
                id="did-agent-container"
                ref={agentContainerRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: 16,
                  zIndex: 2,
                }}
              />
            </div>

            {/* Avatar illustration (Fallback) */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 1 }}>
              {/* Animated head */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 110, height: 110, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 52, boxShadow: '0 4px 30px rgba(102,126,234,0.6)',
                  border: '4px solid rgba(255,255,255,0.18)',
                  animation: isSpeaking ? 'alexBob 0.6s ease-in-out infinite alternate' : 'none',
                }}>🤵</div>
                {/* Speaking rings */}
                {isSpeaking && [1, 2, 3].map(i => (
                  <div key={i} style={{
                    position: 'absolute', inset: -i * 10, borderRadius: '50%',
                    border: '1.5px solid rgba(0,180,216,0.4)',
                    animation: `ring 1.5s ease-out infinite`,
                    animationDelay: `${(i - 1) * 0.4}s`,
                  }} />
                ))}
              </div>
              {/* Interviewer name under avatar */}
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Alex</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>AI Interviewer</p>
              </div>
              {/* Sound bars */}
              {isSpeaking && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 24, marginTop: 8 }}>
                  {[4, 8, 16, 10, 4].map((h, i) => (
                    <div key={i} style={{
                      width: 5, borderRadius: 3, background: '#00b4d8',
                      animation: `bar 0.5s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.1}s`,
                      minHeight: 4, maxHeight: 20,
                      height: h,
                    }} />
                  ))}
                </div>
              )}
              {isThinking && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', animation: 'thinking 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              )}
            </div>


            {isSpeaking && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 14px', background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', fontSize: 12, color: '#7dd3fc', fontWeight: 600, zIndex: 3 }}>
                Speaking…
              </div>
            )}
            {isThinking && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 14px', background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', fontSize: 12, color: '#a78bfa', fontWeight: 600, zIndex: 3 }}>
                Thinking…
              </div>
            )}
            {done && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 4 }}>
                <CheckCircle2 size={56} color="#10b981" />
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>Interview Complete!</p>
                <button onClick={handleExit} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  View Report <Zap size={14} style={{ verticalAlign: 'middle' }} />
                </button>
              </div>
            )}

            {/* ── Candidate camera: PiP in bottom-right corner (only when NOT sharing) ── */}
            {!isSharing && (
              <div style={{
                position: 'absolute', bottom: 16, right: 16,
                width: 270, height: 180,
                borderRadius: 14, overflow: 'hidden',
                border: isListening ? '2.5px solid #10b981' : '2px solid rgba(255,255,255,0.3)',
                boxShadow: isListening
                  ? '0 0 20px rgba(16,185,129,0.6), 0 6px 20px rgba(0,0,0,0.5)'
                  : '0 6px 20px rgba(0,0,0,0.45)',
                transition: 'all 0.3s ease',
                background: '#000',
                zIndex: 10,
              }}>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
                {!camOn && (
                  <div style={{ position: 'absolute', inset: 0, background: '#1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <VideoOff size={24} color="#64748b" />
                    <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>Camera off</span>
                  </div>
                )}
                {/* Candidate name tag */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 10px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{candidate}</span>
                </div>
                {isListening && (
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(16,185,129,0.9)', borderRadius: 20 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }} />
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>Live</span>
                  </div>
                )}
              </div>
            )}
          </div>


          {shareError && (
            <div style={{ padding: '8px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
              {shareError}
            </div>
          )}

          {loadingQs && !isSharing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280' }}>
              <Loader2 size={15} color="#00b4d8" style={{ animation: 'spin 0.8s linear infinite' }} />
              Loading questions…
            </div>
          )}
        </div>

        {/* ── RIGHT: Chat (normal) or small Interviewer panel (screen share) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, minHeight: 0 }}>

          {/* ════ SCREEN-SHARE MODE: small interviewer window ════ */}
          {isSharing && (
            <>
              {/* Small D-ID interviewer card */}
              <div style={{
                position: 'relative', borderRadius: 14, overflow: 'hidden',
                background: 'linear-gradient(145deg,#1e293b,#0f172a)',
                border: isSpeaking ? '2px solid #00b4d8' : '2px solid rgba(255,255,255,0.08)',
                boxShadow: isSpeaking ? '0 0 20px rgba(0,180,216,0.35)' : '0 4px 16px rgba(0,0,0,0.3)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                height: 220, flexShrink: 0,
              }}>
                {/* Target slot for D-ID Agent when sharing screen */}
                <div ref={slotSmallRef} style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden', borderRadius: 14 }} />

                {/* Fallback avatar (behind D-ID agent container) */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#667eea,#764ba2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 34, boxShadow: '0 4px 20px rgba(102,126,234,0.5)',
                      border: '3px solid rgba(255,255,255,0.15)',
                      animation: isSpeaking ? 'alexBob 0.6s ease-in-out infinite alternate' : 'none',
                    }}>🤵</div>
                    {isSpeaking && [1, 2].map(i => (
                      <div key={i} style={{
                        position: 'absolute', inset: -i * 8, borderRadius: '50%',
                        border: '1.5px solid rgba(0,180,216,0.4)',
                        animation: 'ring 1.5s ease-out infinite',
                        animationDelay: `${(i - 1) * 0.4}s`,
                      }} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Alex</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>AI Interviewer</p>
                  </div>
                  {isSpeaking && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 18 }}>
                      {[3, 6, 12, 7, 3].map((h, i) => (
                        <div key={i} style={{ width: 4, borderRadius: 2, background: '#00b4d8', animation: 'bar 0.5s ease-in-out infinite alternate', animationDelay: `${i * 0.1}s`, height: h }} />
                      ))}
                    </div>
                  )}
                  {isThinking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'thinking 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Status label */}
                {(isSpeaking || isThinking) && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 12px', background: 'linear-gradient(to top,rgba(0,0,0,0.75),transparent)', fontSize: 11, color: isSpeaking ? '#7dd3fc' : '#a78bfa', fontWeight: 600, zIndex: 3 }}>
                    {isSpeaking ? 'Speaking…' : 'Thinking…'}
                  </div>
                )}
                {done && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 4 }}>
                    <CheckCircle2 size={36} color="#10b981" />
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>Complete!</p>
                  </div>
                )}
              </div>

              {/* Current question — keep visible */}
              {activeQ && !done && (
                <div style={{
                  flexShrink: 0, padding: '12px 14px', borderRadius: 12,
                  background: '#fff', border: '1.5px solid #bfdbfe',
                  boxShadow: '0 2px 10px rgba(59,130,246,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', animation: 'blink 1.5s infinite' }} />
                    <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Current Question</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.55 }}>{activeQ}</p>
                </div>
              )}

              {/* Live speech + submit */}
              {(isListening || liveText || pendingText) && !done && (
                <div style={{
                  flexShrink: 0, padding: '10px 12px', borderRadius: 10,
                  background: isListening ? '#f0fdf4' : '#f8fafc',
                  border: `1.5px solid ${isListening ? '#86efac' : '#e2e8f0'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    {isListening
                      ? <><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'blink 1s infinite' }} /><span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Listening…</span></>
                      : <><Mic size={10} color="#9ca3af" /><span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Your answer</span></>
                    }
                    {isThinking && <Loader2 size={10} color="#6366f1" style={{ marginLeft: 'auto', animation: 'spin 0.8s linear infinite' }} />}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: pendingText ? '#111827' : '#6b7280', lineHeight: 1.5, fontStyle: liveText && !pendingText ? 'italic' : 'normal' }}>
                    {pendingText || liveText || '…'}
                  </p>
                  {pendingText && !isThinking && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button onClick={submitNow} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#00b4d8,#0096b4)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✓ Submit</button>
                      <button onClick={() => { setPendingText(''); setLiveText(''); startListening(); }} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>↺ Re-record</button>
                    </div>
                  )}
                </div>
              )}

              {/* View report when done */}
              {done && (
                <button onClick={handleExit} style={{ padding: '10px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  View Report <Zap size={13} style={{ verticalAlign: 'middle' }} />
                </button>
              )}
            </>
          )}

          {/* Current question card — hidden during screen share */}
          {activeQ && !done && !isSharing && (
            <div style={{
              flexShrink: 0, padding: '14px 18px', borderRadius: 14,
              background: '#fff', border: '1.5px solid #bfdbfe',
              boxShadow: '0 2px 12px rgba(59,130,246,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'blink 1.5s infinite' }} />
                <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Current Question</span>
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.6 }}>{activeQ}</p>
            </div>
          )}

          {/* Live speech box — hidden during screen share */}
          {(isListening || liveText || pendingText) && !done && !isSharing && (
            <div style={{
              flexShrink: 0, padding: '12px 16px', borderRadius: 12,
              background: isListening ? '#f0fdf4' : '#f8fafc',
              border: `1.5px solid ${isListening ? '#86efac' : '#e2e8f0'}`,
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {isListening
                  ? <><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'blink 1s infinite' }} /><span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>Listening — speak your answer…</span></>
                  : <><Mic size={12} color="#9ca3af" /><span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Your answer (confirm or re-record)</span></>
                }
                {isThinking && <Loader2 size={12} color="#6366f1" style={{ marginLeft: 'auto', animation: 'spin 0.8s linear infinite' }} />}
              </div>
              <p style={{ margin: 0, fontSize: 14, color: pendingText ? '#111827' : '#6b7280', lineHeight: 1.6, fontStyle: liveText && !pendingText ? 'italic' : 'normal' }}>
                {pendingText || liveText || '…'}
              </p>
              {pendingText && !isThinking && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={submitNow} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00b4d8,#0096b4)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    ✓ Submit
                  </button>
                  <button onClick={() => { setPendingText(''); setLiveText(''); startListening(); }}
                    style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ↺ Re-record
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Conversation transcript — hidden during screen share */}
          {!isSharing && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb', minHeight: 0 }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Conversation</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
                className="chat-scroll">
                {msgs.length === 0 && (
                  <p style={{ margin: 'auto', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    Starting your interview…
                  </p>
                )}
                {msgs.map(m => (
                  <div key={m.id} style={{ animation: 'fadeUp 0.3s ease' }}>
                    {m.role === 'system' ? (
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 12, color: '#9ca3af', background: '#f8fafc', padding: '3px 12px', borderRadius: 20 }}>{m.text}</span>
                      </div>
                    ) : m.role === 'alex' ? (
                      <div style={{ maxWidth: '80%' }}>
                        <div style={{ fontSize: 11, color: '#00b4d8', fontWeight: 700, marginBottom: 4 }}>Alex · {m.ts}</div>
                        <div style={{ padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px 14px 14px 14px', fontSize: 14, color: '#0c4a6e', lineHeight: 1.6 }}>
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div style={{ maxWidth: '80%', marginLeft: 'auto' }}>
                        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginBottom: 4, textAlign: 'right' }}>{candidate} · {m.ts}</div>
                        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px 4px 14px 14px', fontSize: 14, color: '#052e16', lineHeight: 1.6, opacity: m.text === '(skipped)' ? 0.5 : 1, fontStyle: m.text === '(skipped)' ? 'italic' : 'normal' }}>
                          {m.text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={transcriptEnd} />
              </div>
            </div>
          )}{/* end !isSharing transcript */}
        </div>
      </div>

      {/* ═══ CONTROLS BAR ════════════════════════════════════════════════════ */}
      <div style={{
        height: 80, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 20, padding: '0 24px',
        background: '#fff', borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.05)',
        position: 'relative',
      }}>

        {/* Ctrl buttons */}
        {[
          { icon: muted ? <VolumeX size={18} /> : <Volume2 size={18} />, active: !muted, onClick: toggleMute, label: 'Sound', off: muted },
          { icon: micOn ? <Mic size={18} /> : <MicOff size={18} />, active: micOn, onClick: toggleMic, label: 'Mic', off: !micOn },
          { icon: camOn ? <Video size={18} /> : <VideoOff size={18} />, active: camOn, onClick: toggleCam, label: 'Camera', off: !camOn },
        ].map(({ icon, active, onClick, label, off }) => (
          <Ctrl key={label} icon={icon} active={active} off={off} onClick={onClick} label={label} />
        ))}

        {/* Screen share button */}
        <Ctrl
          icon={isSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
          active={isSharing}
          off={false}
          onClick={toggleScreenShare}
          label={isSharing ? 'Stop Share' : 'Share Screen'}
          sharing={isSharing}
        />

        <div style={{ width: 1, height: 30, background: '#e5e7eb' }} />

        {!done && (
          <Ctrl icon={<SkipForward size={18} />} active={false} off={false}
            onClick={skipQuestion} label="Skip"
            disabled={isSpeaking || isThinking}
          />
        )}

        {/* Mic button — big, centre */}
        {!done && (
          <button onClick={() => isListening ? stopListeningNow() : startListening()}
            title={isListening ? 'Stop recording' : 'Start recording'}
            style={{
              width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: isListening
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isListening
                ? '0 0 0 6px rgba(16,185,129,0.2), 0 4px 14px rgba(16,185,129,0.4)'
                : '0 4px 14px rgba(99,102,241,0.4)',
              transition: 'all 0.25s',
              animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }}>
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
        )}

        <div style={{ width: 1, height: 30, background: '#e5e7eb' }} />

        {/* End call */}
        <Ctrl icon={<Phone size={18} />} active onClick={handleExit} label="End" danger />

        {/* Time warning */}
        {remaining <= 120 && !done && (
          <div style={{ position: 'absolute', right: 20, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <AlertTriangle size={12} color="#ef4444" />
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>Under 2 min!</span>
          </div>
        )}
      </div>

      {/* ═══ KEYFRAMES ═══════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes bar        { from { transform:scaleY(0.5); } to { transform:scaleY(1.4); } }
        @keyframes ring       { 0%{opacity:.6;transform:scale(1)} 100%{opacity:0;transform:scale(1.6)} }
        @keyframes blink      { 0%,49%{opacity:1} 50%,100%{opacity:0.3} }
        @keyframes thinking   { 0%,80%,100%{transform:scale(0.8);opacity:.4} 40%{transform:scale(1.2);opacity:1} }
        @keyframes alexBob    { from{transform:translateY(0)} to{transform:translateY(-4px)} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes pulse      { 0%,100%{box-shadow:0 0 0 6px rgba(16,185,129,0.2),0 4px 14px rgba(16,185,129,0.4)} 50%{box-shadow:0 0 0 10px rgba(16,185,129,0.1),0 4px 20px rgba(16,185,129,0.5)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-red  { 0%,100%{box-shadow:0 0 0 4px rgba(239,68,68,0.2),0 3px 10px rgba(239,68,68,0.3)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0.1),0 3px 14px rgba(239,68,68,0.5)} }
        .chat-scroll::-webkit-scrollbar{width:4px}
        .chat-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:4px}
        button:hover{filter:brightness(1.06)}
        button:active{transform:scale(0.93)!important}

        #did-agent-container {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          border-radius: 16px !important;
          background: transparent !important;
        }
        #did-agent-container iframe,
        #did-agent-container video,
        #did-agent-container did-agent,
        #did-agent-container > div,
        #did-agent-container canvas {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: cover !important;
          border: none !important;
          border-radius: 16px !important;
        }

        /* Ensure D-ID video, avatar, and iframe stream are fully visible */
        #did-agent-container iframe,
        #did-agent-container video,
        #did-agent-container did-agent,
        #did-agent-container canvas,
        #did-agent-container > div {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Strictly hide ONLY action buttons containing start call text */
        #did-agent-container button.did-start-call,
        #did-agent-container button[class*="start-call"],
        #did-agent-container button[class*="StartCall"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
}

// ─── Small control button component ───────────────────────────────────────────
function Ctrl({ icon, active, onClick, label, off, danger, disabled, sharing }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <button onClick={onClick} disabled={disabled} style={{
        width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: danger ? '#ef4444' : sharing ? 'linear-gradient(135deg,#ef4444,#dc2626)' : off ? '#fef2f2' : active ? '#e0f2fe' : '#f1f5f9',
        color: danger ? '#fff' : sharing ? '#fff' : off ? '#ef4444' : active ? '#0284c7' : '#64748b',
        boxShadow: danger ? '0 3px 10px rgba(239,68,68,0.3)' : sharing ? '0 0 0 4px rgba(239,68,68,0.2), 0 3px 10px rgba(239,68,68,0.3)' : active && !off ? '0 2px 8px rgba(2,132,199,0.2)' : 'none',
        transition: 'all 0.2s', opacity: disabled ? 0.4 : 1,
        animation: sharing ? 'pulse-red 1.5s ease-in-out infinite' : 'none',
      }}>
        {icon}
      </button>
      <span style={{ fontSize: 10, color: sharing ? '#ef4444' : off ? '#ef4444' : '#9ca3af', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

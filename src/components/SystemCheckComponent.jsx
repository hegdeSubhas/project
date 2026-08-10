import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Video, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RotateCcw, Volume2 } from 'lucide-react';

const SystemCheckComponent = ({ onChecksPassed, onBack }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState('idle');
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [avgNoise, setAvgNoise] = useState(null);
  const [videoRes, setVideoRes] = useState(null);
  const [videoBrightness, setVideoBrightness] = useState(null);
  const [videoFps, setVideoFps] = useState(null);
  const [micStatus, setMicStatus] = useState('pending');
  const [videoStatus, setVideoStatus] = useState('pending');
  const [errorMsg, setErrorMsg] = useState(null);
  const [countdown, setCountdown] = useState(5);

  const NOISE_THRESHOLD = 135;
  const MIN_BRIGHTNESS = 40;
  const MIN_WIDTH = 640;
  const MIN_HEIGHT = 480;

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startCheck = useCallback(async () => {
    setStep('checking');
    setMicStatus('pending');
    setVideoStatus('pending');
    setAvgNoise(null);
    setErrorMsg(null);
    setCountdown(5);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      const samples = [];
      const startTime = Date.now();
      const dataArray = new Uint8Array(analyser.fftSize);
      const measure = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        setCountdown(Math.max(0, Math.ceil(5 - elapsed)));
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) { const val = (dataArray[i] - 128) / 128; sum += val * val; }
        const rms = Math.sqrt(sum / dataArray.length);
        const db = Math.min(60, Math.max(0, 20 * Math.log10(rms + 0.0001) + 90));
        setNoiseLevel(db);
        samples.push(db);
        if (elapsed < 5) { animFrameRef.current = requestAnimationFrame(measure); }
        else {
          const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
          setAvgNoise(avg);
          setMicStatus(avg <= NOISE_THRESHOLD ? 'pass' : 'fail');
          checkVideoQuality(stream);
        }
      };
      animFrameRef.current = requestAnimationFrame(measure);
    } catch (err) {
      setErrorMsg('Could not access camera/microphone. Please check permissions.');
      setStep('done');
    }
  }, []);

  const checkVideoQuality = (stream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) { setVideoStatus('fail'); setStep('done'); return; }

    // Wait slightly to ensure video has started rendering frames
    setTimeout(() => {
      const video = videoRef.current;
      if (!video) { setVideoStatus('fail'); setStep('done'); return; }

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
      const fps = settings.frameRate || 30;

      setVideoRes({ width, height });
      setVideoFps(Math.round(fps));

      if (canvasRef.current && width > 0 && height > 0) {
        try {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          let total = 0;

          // Sample every 4th pixel to improve performance and avoid locking the thread
          for (let i = 0; i < data.length; i += 16) {
            total += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          }
          const px = data.length / 16;
          const avgB = total / px;

          setVideoBrightness(Math.round(avgB));
          setVideoStatus((width >= MIN_WIDTH && height >= MIN_HEIGHT && avgB >= MIN_BRIGHTNESS) ? 'pass' : 'fail');
        } catch (e) {
          console.error("Video analysis error", e);
          setVideoStatus((width >= MIN_WIDTH && height >= MIN_HEIGHT) ? 'pass' : 'fail');
        }
      } else {
        setVideoStatus((width >= MIN_WIDTH && height >= MIN_HEIGHT) ? 'pass' : 'fail');
      }
      setStep('done');
    }, 1000); // 1 second delay ensures camera has adjusted exposure
  };

  const retry = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) { audioContextRef.current.close().catch(() => { }); audioContextRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setStep('idle'); setNoiseLevel(0); setAvgNoise(null); setMicStatus('pending'); setVideoStatus('pending');
    setVideoRes(null); setVideoBrightness(null); setVideoFps(null); setErrorMsg(null);
  };

  const allPassed = micStatus === 'pass' && videoStatus === 'pass';
  const getMeterColor = (db) => db <= 18 ? '#10b981' : db <= 24 ? '#f59e0b' : '#ef4444';

  const StatusIcon = ({ status }) => {
    if (status === 'pass') return <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
    if (status === 'fail') return <XCircle size={16} style={{ color: '#ef4444' }} />;
    return <div className="spinner-border spinner-border-sm" style={{ color: '#00b4d8', width: '14px', height: '14px' }} role="status" />;
  };

  return (
    <div className="dashboard-wrapper" style={{ height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* HEADER BAR */}
      <header className="dash-header" style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #00b4d8, #0096b4)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem' }}>Next<span style={{ color: '#00b4d8' }}>Hire</span></span>
          <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)', margin: '0 6px' }} />
          <span style={{ color: '#00b4d8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>System Diagnostics</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
          ← Back
        </button>
      </header>

      {/* MAIN CONTENT — fills remaining space */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', padding: '20px 28px', minHeight: 0 }}>

        {/* LEFT: Video Preview */}
        <div style={{ flex: '1.4', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>
          <div style={{ flex: 1, position: 'relative', backgroundColor: 'var(--bg-dark)', borderRadius: '14px', overflow: 'hidden', border: step === 'done' && allPassed ? '2px solid rgba(16,185,129,0.4)' : '1px solid rgba(0,0,0,0.1)', transition: 'border-color 0.4s ease' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: step !== 'idle' ? 'block' : 'none' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {step === 'idle' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Video size={44} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Camera preview will appear here</span>
              </div>
            )}
            {step === 'checking' && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: '8px', padding: '5px 12px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="spinner-border spinner-border-sm" style={{ color: '#00b4d8', width: '12px', height: '12px' }} role="status" />
                <span style={{ color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 600 }}>Analyzing... {countdown}s</span>
              </div>
            )}
            {step === 'done' && allPassed && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(16,185,129,0.1)', backdropFilter: 'blur(8px)', borderRadius: '8px', padding: '5px 12px', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600 }}>All Checks Passed</span>
              </div>
            )}
          </div>

          {/* Noise Meter — below video, compact */}
          {step === 'checking' && (
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} style={{ color: '#00b4d8' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600 }}>Ambient Noise</span>
                </div>
                <span style={{ color: getMeterColor(noiseLevel), fontSize: '0.78rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{noiseLevel.toFixed(1)} dB</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', borderRadius: '3px', width: `${Math.min(100, (noiseLevel / 60) * 100)}%`, background: `linear-gradient(90deg, #10b981, ${getMeterColor(noiseLevel)})`, transition: 'width 0.1s ease', boxShadow: `0 0 8px ${getMeterColor(noiseLevel)}40` }} />
                <div style={{ position: 'absolute', top: '-3px', bottom: '-3px', left: `${(NOISE_THRESHOLD / 60) * 100}%`, width: '2px', background: '#f59e0b', boxShadow: '0 0 4px rgba(245,158,11,0.5)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>0 dB</span>
                <span style={{ fontSize: '0.55rem', color: '#f59e0b' }}>24 dB max</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>60 dB</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Results & Actions Panel */}
        <div className="dash-card" style={{ flex: '1', display: 'flex', flexDirection: 'column', minHeight: 0, gap: '14px', padding: '24px', background: 'var(--bg-panel)', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>

          {/* Info / Idle state */}
          {step === 'idle' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center', padding: '0 12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0,180,216,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={26} style={{ color: '#00b4d8' }} />
              </div>
              <div>
                <h5 style={{ color: 'var(--text-primary)', margin: '0 0 6px', fontWeight: 700, fontSize: '1.05rem' }}>Ready to Check?</h5>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.78rem', lineHeight: 1.5 }}>
                  We'll test your microphone noise level (must be below 24 dB) and camera video quality.
                </p>
              </div>
              <button onClick={startCheck} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #00b4d8, #0096b4)', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 18px rgba(0,180,216,0.35)', transition: 'all 0.3s ease' }}>
                <Mic size={16} /> Run System Check
              </button>
            </div>
          )}

          {/* Checking state — spinner */}
          {step === 'checking' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <div className="spinner-border" style={{ color: '#00b4d8', width: '2.5rem', height: '2.5rem' }} role="status" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>Running Diagnostics</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>Analyzing audio & video quality...</div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div className="spinner-border spinner-border-sm" style={{ color: '#00b4d8', width: '12px', height: '12px' }} role="status" />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>Mic</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div className="spinner-border spinner-border-sm" style={{ color: '#00b4d8', width: '12px', height: '12px' }} role="status" />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>Video</span>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {step === 'done' && errorMsg && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '0 12px' }}>
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errorMsg}</span>
              </div>
              <button onClick={retry} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #00b4d8, #0096b4)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={14} /> Try Again
              </button>
            </div>
          )}

          {/* Done — Results */}
          {step === 'done' && !errorMsg && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Mic Result */}
              <div style={{ padding: '14px 16px', borderRadius: '10px', background: micStatus === 'pass' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${micStatus === 'pass' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: micStatus === 'pass' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                      <Mic size={15} style={{ color: micStatus === 'pass' ? '#10b981' : '#ef4444' }} />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem' }}>Voice / Noise</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '1px' }}>
                        Avg: <strong style={{ color: micStatus === 'pass' ? '#10b981' : '#ef4444' }}>{avgNoise?.toFixed(1)} dB</strong> / {NOISE_THRESHOLD} dB
                      </div>
                    </div>
                  </div>
                  <StatusIcon status={micStatus} />
                </div>
                {micStatus === 'fail' && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', fontSize: '0.7rem', color: '#ef4444' }}>
                    ⚠ Too noisy. Use a quieter room or headset.
                  </div>
                )}
              </div>

              {/* Video Result */}
              <div style={{ padding: '14px 16px', borderRadius: '10px', background: videoStatus === 'pass' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${videoStatus === 'pass' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: videoStatus === 'pass' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                      <Video size={15} style={{ color: videoStatus === 'pass' ? '#10b981' : '#ef4444' }} />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem' }}>Video Quality</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '1px' }}>
                        {videoRes ? `${videoRes.width}×${videoRes.height}` : '—'}{videoFps ? ` · ${videoFps}fps` : ''}{videoBrightness !== null ? ` · Lux ${videoBrightness}` : ''}
                      </div>
                    </div>
                  </div>
                  <StatusIcon status={videoStatus} />
                </div>
                {videoStatus === 'fail' && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', fontSize: '0.7rem', color: '#ef4444' }}>
                    ⚠ {videoBrightness !== null && videoBrightness < MIN_BRIGHTNESS ? 'Lighting too low. Move to a brighter area.' : `Min resolution: ${MIN_WIDTH}×${MIN_HEIGHT}.`}
                  </div>
                )}
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={retry} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <RotateCcw size={14} /> Retry
                </button>
                <button
                  onClick={() => { if (allPassed) { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); onChecksPassed(); } }}
                  disabled={!allPassed}
                  style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: allPassed ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(0,0,0,0.06)', color: allPassed ? '#fff' : 'rgba(0,0,0,0.25)', fontWeight: 700, fontSize: '0.82rem', cursor: allPassed ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: allPassed ? '0 4px 16px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.3s ease' }}
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default SystemCheckComponent;

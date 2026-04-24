import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff, Video, VideoOff, Share2, MessageSquare, Plus, Trash2, Edit3, X } from 'lucide-react';
import { TalkingHead } from '../lib/talkinghead';

const InterviewSessionComponent = ({ onEndSession, role, candidate }) => {
  const videoRef = useRef(null);
  const avatarRef = useRef(null);
  const talkingHeadRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [notes, setNotes] = useState('');
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Initialize webcam stream
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions.');
      }
    };

    startWebcam();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer for session duration
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize TalkingHead Avatar
  useEffect(() => {
    const initializeAvatar = async () => {
      if (!avatarRef.current || !TalkingHead) {
        if (!TalkingHead) {
          setAvatarError('TalkingHead library not installed. Run: npm install talkinghead');
        }
        setIsAvatarReady(true);
        return;
      }

      try {
        const head = new TalkingHead(avatarRef.current, {
          // Voice settings
          speechRate: 1,
          voiceURI: 'Google UK English Female', // Professional female voice
        });

        // Load professional avatar body
        await head.showAvatar({
          url: 'https://models.readyplayer.me/63a8a8b3bf004141e0f10c6e.glb', // Default RPM avatar
          body: 'F', // Female body
          avatarMood: 'neutral',
        });

        talkingHeadRef.current = head;
        setIsAvatarReady(true);
        setAvatarError(null);

        // Welcome message
        setTimeout(() => {
          head.speakText(`Welcome to your ${role} interview at NextHire. Let's begin with your interview.`);
        }, 1000);
      } catch (error) {
        console.error('Error initializing TalkingHead:', error);
        setAvatarError('Failed to load avatar. Please refresh the page.');
        setIsAvatarReady(true);
      }
    };

    initializeAvatar();

    return () => {
      if (talkingHeadRef.current) {
        try {
          talkingHeadRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying avatar:', error);
        }
        talkingHeadRef.current = null;
      }
    };
  }, [role]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const videoTrack = videoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(!cameraActive);
      }
    }
  };

  const toggleMic = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const audioTrack = videoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(!micActive);
      }
    }
  };

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  // Interview questions for the avatar to ask
  const interviewQuestions = [
    "Tell me about your experience with this role.",
    "What are your key strengths and how do they apply here?",
    "Can you describe a challenging project you worked on?",
    "How do you approach problem-solving?",
    "What interested you most about this position?",
    "Where do you see yourself in 5 years?",
  ];

  // Function to make avatar ask a question
  const askQuestion = (questionIndex = 0) => {
    if (talkingHeadRef.current && isAvatarReady) {
      const question = interviewQuestions[questionIndex % interviewQuestions.length];
      talkingHeadRef.current.speakText(question);
    }
  };

  // Function to make avatar speak custom text
  const speakText = (text) => {
    if (talkingHeadRef.current && isAvatarReady) {
      talkingHeadRef.current.speakText(text);
    }
  };

  return (
    <div
      className="vh-100 d-flex flex-column overflow-hidden"
      style={{ backgroundColor: '#0d1117', fontFamily: "'Inter', sans-serif" }}
    >
      {/* HEADER */}
      <header
        className="px-4 d-flex justify-content-between align-items-center"
        style={{
          background: 'linear-gradient(90deg, #121a2f 0%, #1a2540 100%)',
          borderBottom: '1px solid rgba(0,180,216,0.12)',
          height: '60px',
          flexShrink: 0,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle" style={{ width: '20px', height: '20px', background: 'linear-gradient(135deg, #00b4d8, #0096b4)' }}></div>
            <span className="fw-bold" style={{ color: '#fff', fontSize: '1rem', letterSpacing: '-0.3px' }}>
              Next<span style={{ color: '#00b4d8' }}>Hire</span>
            </span>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.12)' }}></div>
          <div>
            <span className="fw-bold" style={{ color: '#fff', fontSize: '0.85rem' }}>{role} Interview</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          {candidate && (
            <span className="rounded-pill px-3 py-1 d-flex align-items-center gap-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              {candidate}
            </span>
          )}
          <span className="rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
            <span className="blink-dot" style={{ display: 'inline-block', width: '7px', height: '7px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}></span>
            {formatTime(sessionTime)}
          </span>
        </div>
      </header>

      {/* MAIN VIDEO AREA */}
      <main className="flex-grow-1 p-4 position-relative overflow-auto d-flex flex-column flex-xl-row align-items-center justify-content-center gap-4" style={{ background: 'radial-gradient(ellipse at center, #161b22 0%, #0d1117 100%)' }}>
        
        {/* INTERVIEWER SCREEN */}
        <div
          className="rounded-4 overflow-hidden position-relative d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: '#0d1117',
            border: '2px solid rgba(0,180,216,0.2)',
            width: '100%',
            maxWidth: '850px',
            aspectRatio: '16/9',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,180,216,0.1)',
          }}
        >
          {/* TALKING HEAD AVATAR CONTAINER */}
          <div
            ref={avatarRef}
            id="avatar-container"
            className="w-100 h-100 position-relative"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!isAvatarReady && (
              <div className="text-center">
                <div className="spinner-border mb-3" style={{ color: '#00b4d8', width: '2rem', height: '2rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <small className="d-block" style={{ color: 'rgba(255,255,255,0.4)' }}>Initializing AI interviewer...</small>
              </div>
            )}
            {avatarError && (
              <div className="text-center p-4">
                <small className="d-block" style={{ color: '#f59e0b' }}>{avatarError}</small>
                <small className="d-block mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Check the setup guide: TALKINGHEAD_SETUP.md
                </small>
              </div>
            )}
          </div>
        </div>

        {/* CANDIDATE VIDEO - SIDE BY SIDE */}
        <div
          className="rounded-4 overflow-hidden shadow-lg position-relative"
          style={{
            width: '100%',
            maxWidth: '380px',
            aspectRatio: '4/3',
            backgroundColor: '#0d1117',
            border: '2px solid #00b4d8',
            flexShrink: 0,
            boxShadow: '0 8px 24px rgba(0,180,216,0.15)',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-100 h-100"
            style={{
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            }}
          />
          {!cameraActive && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
            >
              <div className="text-center">
                <VideoOff size={40} className="text-white mb-2" />
                <small className="text-white d-block fw-bold">Camera Off</small>
              </div>
            </div>
          )}

          {/* "You" LABEL */}
          <div
            className="position-absolute top-0 start-0 p-2"
            style={{
              background: 'linear-gradient(135deg, #00b4d8, #0096b4)',
              borderRadius: '0 0 8px 0',
            }}
          >
            <small className="text-white fw-bold">You</small>
          </div>
        </div>

        {/* FLOATING NOTES BUBBLE BUTTON */}
        <button
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className="btn rounded-circle shadow-lg position-absolute d-flex align-items-center justify-content-center border-0"
          style={{
            bottom: '30px',
            left: '30px',
            width: '52px',
            height: '52px',
            zIndex: 100,
            background: isNotesOpen ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #00b4d8 0%, #0096b4 100%)',
            color: '#fff',
            boxShadow: isNotesOpen ? 'none' : '0 4px 20px rgba(0,180,216,0.35)',
            transition: 'all 0.3s ease',
          }}
          title="Session Notes"
        >
          {isNotesOpen ? <X size={22} /> : <Edit3 size={20} />}
        </button>

        {/* NOTES PANEL */}
        {isNotesOpen && (
          <div
            className="d-flex flex-column rounded-3 overflow-hidden position-absolute shadow-lg animate-fade-in"
            style={{
              width: '300px',
              height: '340px',
              border: '1px solid rgba(255,255,255,0.1)',
              bottom: '95px',
              left: '30px',
              zIndex: 99,
              background: 'rgba(18,26,47,0.95)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="px-3 py-2 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="fw-bold" style={{ color: '#fff', fontSize: '0.8rem' }}>Notes</span>
              <button 
                onClick={() => setNotes('')} 
                className="btn btn-sm p-0 border-0"
                style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}
                title="Clear all"
              >
                Clear
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type your notes here..."
              className="flex-grow-1 p-3 border-0 shadow-none"
              autoFocus
              style={{
                backgroundColor: 'transparent',
                color: '#e6edf3',
                resize: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.85rem',
                lineHeight: '1.6',
                outline: 'none',
                letterSpacing: '0.2px',
              }}
            />
          </div>
        )}
      </main>

      {/* CONTROLS BAR */}
      <div
        className="px-4 d-flex justify-content-center align-items-center gap-4"
        style={{
          background: 'linear-gradient(90deg, #121a2f 0%, #1a2540 100%)',
          borderTop: '1px solid rgba(0,180,216,0.12)',
          height: '88px',
          flexShrink: 0,
        }}
      >
        {/* Microphone */}
        <div className="d-flex flex-column align-items-center gap-1">
          <button
            onClick={toggleMic}
            className="btn rounded-circle p-0 d-flex align-items-center justify-content-center border-0"
            style={{
              width: '50px', height: '50px',
              background: micActive ? 'linear-gradient(135deg, #00b4d8, #0096b4)' : '#ef4444',
              color: '#fff',
              boxShadow: micActive ? '0 4px 12px rgba(0,180,216,0.3)' : '0 4px 12px rgba(239,68,68,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            {micActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Mic</span>
        </div>

        {/* Camera */}
        <div className="d-flex flex-column align-items-center gap-1">
          <button
            onClick={toggleCamera}
            className="btn rounded-circle p-0 d-flex align-items-center justify-content-center border-0"
            style={{
              width: '50px', height: '50px',
              background: cameraActive ? 'linear-gradient(135deg, #00b4d8, #0096b4)' : '#ef4444',
              color: '#fff',
              boxShadow: cameraActive ? '0 4px 12px rgba(0,180,216,0.3)' : '0 4px 12px rgba(239,68,68,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            {cameraActive ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Camera</span>
        </div>

        {/* Screen Share */}
        <div className="d-flex flex-column align-items-center gap-1">
          <button
            onClick={handleScreenShare}
            className="btn rounded-circle p-0 d-flex align-items-center justify-content-center border-0"
            style={{
              width: '50px', height: '50px',
              background: isScreenSharing ? '#00b4d8' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              border: isScreenSharing ? 'none' : '1px solid rgba(255,255,255,0.12) !important',
              transition: 'all 0.3s ease',
            }}
          >
            <Share2 size={20} />
          </button>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Share</span>
        </div>

        {/* Ask Question */}
        <div className="d-flex flex-column align-items-center gap-1">
          <button
            onClick={() => askQuestion(Math.floor(Math.random() * 6))}
            className="btn rounded-circle p-0 d-flex align-items-center justify-content-center border-0"
            style={{
              width: '50px', height: '50px',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.12) !important',
              transition: 'all 0.3s ease',
            }}
          >
            <MessageSquare size={20} />
          </button>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Ask</span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

        {/* End Call */}
        <div className="d-flex flex-column align-items-center gap-1">
          <button
            onClick={onEndSession}
            className="btn rounded-circle p-0 d-flex align-items-center justify-content-center border-0"
            style={{
              width: '50px', height: '50px',
              background: '#ef4444',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            <Phone size={20} />
          </button>
          <span style={{ fontSize: '0.6rem', color: 'rgba(239,68,68,0.7)', fontWeight: 500 }}>End</span>
        </div>
      </div>

      {/* CSS ANIMATIONS */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .blink-dot {
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0.5;
          }
        }

        .transition-all {
          transition: all 0.3s ease-in-out;
        }

        .transition-all:hover {
          transform: scale(1.08);
        }

        button:active {
          transform: scale(0.95) !important;
        }
      `}</style>
    </div>
  );
};

export default InterviewSessionComponent;

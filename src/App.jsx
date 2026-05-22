import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login               from './components/LoginPage';
import Signup              from './components/SignupPage';
import DashBoard           from './components/NextHireDashBoard';
import HistoryComponent    from './components/HistoryComponent';
import ProfileEditComponent from './components/ProfileEditComponent';
import { isLoggedIn, getStoredUser, apiUpdateProfile, apiGetMe } from './lib/api';

// ── Protected Route wrapper ───────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
};

// ── Build a clean profile object from a raw user object ──────────────────────
const buildProfile = (u) => ({
  firstName: u.firstName || '',
  lastName:  u.lastName  || '',
  name:      u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
  email:     u.email  || '',
  role:      u.role   || '',
  skills:    u.skills || '',
  avatar:    u.avatar || '',
});

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [selectedReport, setSelectedReport] = useState(null);

  // Profile — seeded from localStorage, synced from server
  const [profile, setProfile] = useState(() => {
    const stored = getStoredUser();
    return stored ? buildProfile(stored) : { firstName: '', lastName: '', name: '', email: '', role: '', skills: '' };
  });

  // Interview history
  const [historyData, setHistoryData] = useState(() => {
    const stored = getStoredUser();
    return stored?.interviewHistory || [];
  });

  // Re-sync fresh data from server on every mount
  useEffect(() => {
    if (!isLoggedIn()) return;
    apiGetMe()
      .then((data) => {
        if (data?.success && data.user) {
          const u = data.user;
          setProfile(buildProfile(u));
          setHistoryData(u.interviewHistory || []);
          localStorage.setItem('nh_user', JSON.stringify(u));
        }
      })
      .catch(() => {/* silent — user sees cached data */});
  }, []);

  // ── Save profile to MongoDB (looked up by email on the server) ──────────────
  const handleSaveProfile = async (updatedProfile) => {
    const data = await apiUpdateProfile({
      firstName: updatedProfile.firstName,
      lastName:  updatedProfile.lastName,
      role:      updatedProfile.role,
      skills:    updatedProfile.skills,
    });

    if (data.success) {
      const u = data.user;
      setProfile(buildProfile(u));
      setHistoryData(u.interviewHistory || []);
      localStorage.setItem('nh_user', JSON.stringify(u));
    }

    return data; // let ProfileEdit show success/error
  };

  return (
    <Router>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"       element={<Navigate to="/login" replace />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ── Protected: Dashboard ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashBoard
                profile={profile}
                history={historyData}
                onHistoryClick={(item) => setSelectedReport(item)}
                onHistoryUpdate={(newHistory) => setHistoryData(newHistory)}
              />
            </ProtectedRoute>
          }
        />

        {/* ── Protected: Profile Edit ── */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileEditComponent
                profile={profile}
                setProfile={setProfile}
                onSave={handleSaveProfile}
                onBack={() => window.history.back()}
              />
            </ProtectedRoute>
          }
        />

        {/* ── Protected: History Detail ── */}
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              {selectedReport
                ? <HistoryComponent report={selectedReport} onBack={() => window.history.back()} />
                : <Navigate to="/dashboard" replace />
              }
            </ProtectedRoute>
          }
        />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
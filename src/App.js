import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/LoginPage';
import Signup from './components/SignupPage';
import DashBoard from "./components/NextHireDashBoard";
import HistoryComponent from "./components/HistoryComponent";
import ProfileEditComponent from "./components/ProfileEditComponent"; // Import your new component

function App() {
  // 1. State for History Reports
  const [selectedReport, setSelectedReport] = useState(null);

  // 2. State for User Profile (moved to state so it's updatable)
  const [profile, setProfile] = useState({
    name: "Subhas Hegde",
    email: "subhas.hegde@sdmit.edu.in",
    role: "Full Stack Developer",
    skills: "React, Node.js, MongoDB, Java"
  });

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <DashBoard 
              profile={profile}
              onHistoryClick={(item) => {
                setSelectedReport(item);
              }} 
              // The Dashboard will call this to go to Profile Edit
            />
          } 
        />

        {/* Profile Edit Route (New) */}
        <Route 
          path="/profile" 
          element={
            <ProfileEditComponent 
              profile={profile} 
              setProfile={setProfile} 
              onBack={() => window.history.back()} 
            />
          } 
        />

        {/* History Analysis Route */}
        <Route 
          path="/history" 
          element={
            selectedReport ? (
              <HistoryComponent 
                selectedData={selectedReport} 
                onBack={() => window.history.back()} 
              />
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
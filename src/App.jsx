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

  // 3. Dummy History Data
  const historyData = [
    { id: 1, role: 'Java Full Stack', score: '87%', date: 'Apr 22, 2026', analytics: { feedback: 'Strong OOP concepts and Spring Boot knowledge. Good understanding of RESTful APIs and microservices architecture. Demonstrated effective use of design patterns.', technical: 85, nonTechnical: 88, confidence: 90, improvements: ['Deepen knowledge in distributed caching (Redis/Memcached)', 'Practice system design for high-availability systems', 'Improve on multithreading and concurrency patterns'] } },
    { id: 2, role: 'Python Backend', score: '92%', date: 'Apr 18, 2026', analytics: { feedback: 'Excellent problem-solving and Django expertise. Demonstrated strong knowledge of data structures and algorithms. Clean code practices and good testing methodology.', technical: 94, nonTechnical: 90, confidence: 92, improvements: ['Explore async Python (asyncio, FastAPI)', 'Study message queue systems (RabbitMQ, Kafka)', 'Practice explaining complex solutions more concisely'] } },
    { id: 3, role: 'React Frontend', score: '78%', date: 'Apr 14, 2026', analytics: { feedback: 'Good component architecture, needs improvement in state management patterns and performance optimization. Solid understanding of React hooks and lifecycle.', technical: 76, nonTechnical: 82, confidence: 75, improvements: ['Master advanced state management (Redux Toolkit, Zustand)', 'Study React performance optimization (memo, useMemo, lazy)', 'Improve confidence in live coding scenarios', 'Learn testing with React Testing Library'] } },
    { id: 4, role: 'System Design', score: '81%', date: 'Apr 10, 2026', analytics: { feedback: 'Solid fundamentals in system design. Could improve on distributed systems and database scaling strategies. Good understanding of load balancing concepts.', technical: 80, nonTechnical: 84, confidence: 78, improvements: ['Study CAP theorem and its practical implications', 'Practice database sharding and partitioning strategies', 'Learn about event-driven architecture patterns'] } },
  ];

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
              history={historyData}
              onHistoryClick={(item) => {
                setSelectedReport(item);
              }} 
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
                report={selectedReport} 
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
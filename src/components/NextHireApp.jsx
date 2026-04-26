import React, { useState } from 'react';
import NextHireDashboard from './NextHireDashboard';
import HistoryComponent from './HistoryComponent';

const NextHireApp = () => {
  // view: 'dashboard' or 'history'
  const [view, setView] = useState('dashboard');
  const [selectedReport, setSelectedReport] = useState(null);

  // User Profile
  const profile = { name: "Subhas Hegde" };

  // Mock Data for Analytics
  const historyData = [
    { 
      id: 1, 
      role: "MERN Stack Developer", 
      date: "Apr 16, 2026", 
      score: "88/100",
      analytics: {
        technical: 88, nonTechnical: 82, confidence: 90,
        feedback: "Exceptional proficiency in React. Focus on optimizing MongoDB aggregation pipelines.",
        topSkills: ["React Context API", "Node.js Performance", "NoSQL Schema Design"]
      }
    },
    { 
      id: 2, 
      role: "Java Backend Engineer", 
      date: "Apr 10, 2026", 
      score: "74/100",
      analytics: {
        technical: 70, nonTechnical: 78, confidence: 75,
        feedback: "Good core Java knowledge. Suggest practicing Spring Boot microservices communication.",
        topSkills: ["Core Java", "Multi-threading", "REST APIs"]
      }
    }
  ];

  // Logic to "Redirect" to history view
  const loadHistory = (item) => {
    setSelectedReport(item);
    setView('history');
  };

  return (
    <div className="vh-100 overflow-hidden" style={{ backgroundColor: '#F8F9FA' }}>
      {view === 'dashboard' ? (
        <NextHireDashboard 
          profile={profile} 
          history={historyData} 
          onHistoryClick={loadHistory} 
        />
      ) : (
        <HistoryComponent 
          report={selectedReport} 
          onBack={() => setView('dashboard')} 
        />
      )}
    </div>
  );
};

export default NextHireApp;
import React from 'react';
import { ArrowLeft, Save, User, Mail, Code, Briefcase, MapPin } from 'lucide-react';

const ProfileEditComponent = ({ profile, setProfile, onBack }) => {
  const handleSave = () => {
    // Add logic here to save to your database/API
    onBack();
  };

  return (
    <div className="dashboard-wrapper vh-100 d-flex flex-column">
      {/* HEADER */}
      <header className="px-4 dash-header d-flex align-items-center" style={{ height: '70px' }}>
        <div className="d-flex align-items-center gap-3">
          <button onClick={onBack} className="btn rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '40px', height: '40px' }}>
            <ArrowLeft size={20} />
          </button>
          <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Update Profile</h5>
        </div>
      </header>

      {/* EDIT FORM */}
      <main className="flex-grow-1 p-4 overflow-auto d-flex justify-content-center">
        <div className="w-100 py-3 py-md-4" style={{ maxWidth: '580px' }}>
          <div className="glass-panel p-4 animate-fade-in" style={{ borderRadius: '20px' }}>
            
            <div className="text-center mb-4">
              <div className="d-inline-flex p-3 rounded-circle mb-2" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-glow)' }}>
                <User size={36} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h5 className="fw-bold text-white mb-1">{profile.name}</h5>
              <p className="small mb-0" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Manage your personal and technical information</p>
            </div>

            <div className="d-flex flex-column gap-4">
              <div className="d-flex flex-column flex-md-row gap-4">
                <div className="flex-grow-1" style={{ flexBasis: '50%' }}>
                  <label className="fw-bold small mb-2 d-block text-uppercase" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                  <div className="position-relative">
                    <User size={18} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="input-premium" style={{ paddingLeft: '2.5rem' }}
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})} />
                  </div>
                </div>

                <div className="flex-grow-1" style={{ flexBasis: '50%' }}>
                  <label className="fw-bold small mb-2 d-block text-uppercase" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                  <div className="position-relative">
                    <Mail size={18} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" className="input-premium" style={{ paddingLeft: '2.5rem' }}
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex-grow-1">
                <label className="fw-bold small mb-2 d-block text-uppercase" style={{ color: 'var(--text-secondary)' }}>Target Role</label>
                <div className="position-relative">
                  <Briefcase size={18} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input-premium" style={{ paddingLeft: '2.5rem' }}
                    value={profile.role} 
                    onChange={(e) => setProfile({...profile, role: e.target.value})} />
                </div>
              </div>

              <div className="flex-grow-1">
                <label className="fw-bold small mb-2 d-block text-uppercase" style={{ color: 'var(--text-secondary)' }}>Technical Stack (Skills)</label>
                <div className="position-relative">
                  <Code size={18} className="position-absolute" style={{ top: '1rem', left: '1rem', color: 'var(--text-muted)' }} />
                  <textarea className="input-premium" rows="3" style={{ paddingLeft: '2.5rem' }}
                    value={profile.skills} 
                    onChange={(e) => setProfile({...profile, skills: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--border-color) !important' }}>
              <button 
                onClick={handleSave} 
                className="btn-premium w-100 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2"
              >
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileEditComponent;
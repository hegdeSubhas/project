import React from 'react';
import { ArrowLeft, Save, User, Mail, Code, Briefcase, Camera } from 'lucide-react';

const ProfileEditComponent = ({ profile, setProfile, onBack }) => {
  const handleSave = () => {
    // Add logic here to save to your database/API
    onBack();
  };

  return (
    <div className="dashboard-wrapper vh-100 d-flex flex-column animate-fade-in">
      {/* HEADER */}
      <header className="px-4 dash-header d-flex align-items-center shadow-sm z-index-1 position-relative" style={{ height: '65px', flexShrink: 0 }}>
        <div className="d-flex align-items-center gap-3">
          <button onClick={onBack} className="btn rounded-circle p-2 d-flex align-items-center justify-content-center transition-all" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-primary)', width: '38px', height: '38px' }}>
            <ArrowLeft size={18} />
          </button>
          <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Edit Profile</h5>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow-1 p-4 overflow-auto position-relative z-index-0 d-flex justify-content-center align-items-start">
        {/* Background Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '300px', background: 'linear-gradient(180deg, rgba(0,180,216,0.05) 0%, transparent 100%)', pointerEvents: 'none' }}></div>

        <div className="w-100 position-relative mt-2 mt-md-4" style={{ maxWidth: '680px' }}>
          <div className="dash-card border-0 rounded-4 overflow-hidden animate-fade-in animate-delay-1" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            
            {/* Banner */}
            <div style={{ height: '120px', background: 'linear-gradient(135deg, #121a2f 0%, #1e293b 100%)', position: 'relative' }}>
               <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            </div>

            {/* Profile Avatar */}
            <div className="px-4 d-flex justify-content-between align-items-end position-relative" style={{ marginTop: '-45px', marginBottom: '20px' }}>
              <div className="position-relative">
                <div className="rounded-circle d-flex align-items-center justify-content-center bg-white" style={{ width: '90px', height: '90px', border: '4px solid #fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <div className="rounded-circle w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,180,216,0.1)' }}>
                    <User size={40} style={{ color: '#00b4d8' }} />
                  </div>
                </div>
                <button className="position-absolute btn rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm transition-all" style={{ bottom: '0', right: '0', width: '30px', height: '30px', background: '#00b4d8', border: '2px solid #fff', color: '#fff' }}>
                  <Camera size={14} />
                </button>
              </div>
            </div>

            <div className="px-4 px-md-5 pb-5">
              <div className="mb-4">
                <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{profile.name}</h4>
                <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>Update your personal and technical details.</p>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>Full Name</label>
                  <div className="position-relative">
                    <User size={16} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="input-premium py-2" style={{ paddingLeft: '2.5rem' }}
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})} />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>Email Address</label>
                  <div className="position-relative">
                    <Mail size={16} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" className="input-premium py-2" style={{ paddingLeft: '2.5rem' }}
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})} />
                  </div>
                </div>

                <div className="col-12">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>Target Role</label>
                  <div className="position-relative">
                    <Briefcase size={16} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="input-premium py-2" style={{ paddingLeft: '2.5rem' }}
                      value={profile.role} 
                      onChange={(e) => setProfile({...profile, role: e.target.value})} />
                  </div>
                </div>

                <div className="col-12">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>Technical Stack (Skills)</label>
                  <div className="position-relative">
                    <Code size={16} className="position-absolute" style={{ top: '1rem', left: '1rem', color: 'var(--text-muted)' }} />
                    <textarea className="input-premium py-2" rows="3" style={{ paddingLeft: '2.5rem' }}
                      value={profile.skills} 
                      onChange={(e) => setProfile({...profile, skills: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-5 pt-4 border-top d-flex justify-content-end gap-3 align-items-center" style={{ borderColor: 'var(--border-color) !important' }}>
                <button 
                  onClick={onBack} 
                  className="btn fw-bold px-4 py-2 rounded-3 transition-all" 
                  style={{ color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="btn-premium d-flex align-items-center justify-content-center gap-2 px-4 py-2 rounded-3 m-0"
                  style={{ width: 'auto', fontSize: '0.9rem' }}
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileEditComponent;
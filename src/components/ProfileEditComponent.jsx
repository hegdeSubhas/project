import React, { useState } from 'react';
import { ArrowLeft, Save, User, Mail, Code, Briefcase, Camera, LogOut, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearSession, apiUploadAvatar } from '../lib/api';

const ProfileEditComponent = ({ profile, setProfile, onSave, onBack }) => {
  const navigate = useNavigate();

  // Editable text fields
  const [editData, setEditData] = useState({
    firstName: profile.firstName || '',
    lastName:  profile.lastName  || '',
    role:      profile.role      || '',
    skills:    profile.skills    || '',
  });

  // Avatar state
  const [avatarPreview,    setAvatarPreview]    = useState(profile.avatar || '');
  const [avatarUploading,  setAvatarUploading]  = useState(false);
  const [avatarError,      setAvatarError]      = useState('');
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState(profile.avatar || '');

  // Save state
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
    setSaveMsg('');
    setErrorMsg('');
  };

  // ── Handle image selection: upload immediately ────────────────────────────
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size on client (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5 MB.');
      return;
    }

    // Show local preview instantly
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarError('');
    setAvatarUploading(true);

    try {
      const data = await apiUploadAvatar(file);
      if (data.success) {
        setPendingAvatarUrl(data.avatarUrl);
        setAvatarPreview(data.avatarUrl);   // switch to permanent URL
        // Update localStorage avatar immediately
        const stored = JSON.parse(localStorage.getItem('nh_user') || '{}');
        localStorage.setItem('nh_user', JSON.stringify({ ...stored, avatar: data.avatarUrl }));
        setProfile(prev => ({ ...prev, avatar: data.avatarUrl }));
      } else {
        setAvatarError(data.message || 'Upload failed. Please try again.');
        setAvatarPreview(profile.avatar || '');
      }
    } catch {
      setAvatarError('Could not reach server. Please try again.');
      setAvatarPreview(profile.avatar || '');
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Save text fields (avatar already saved during upload) ─────────────────
  const handleSave = async () => {
    if (!editData.firstName.trim() || !editData.lastName.trim()) {
      setErrorMsg('First name and last name are required.');
      return;
    }

    setSaving(true);
    setSaveMsg('');
    setErrorMsg('');

    try {
      const result = await onSave({
        firstName: editData.firstName.trim(),
        lastName:  editData.lastName.trim(),
        role:      editData.role.trim(),
        skills:    editData.skills.trim(),
        avatar:    pendingAvatarUrl,
      });

      if (result?.success) {
        setSaveMsg('success');
        setTimeout(() => onBack(), 1000);
      } else {
        setErrorMsg(result?.message || 'Update failed. Please try again.');
      }
    } catch {
      setErrorMsg('Could not reach server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const displayName = `${editData.firstName} ${editData.lastName}`.trim() || profile.email;

  return (
    <div className="dashboard-wrapper vh-100 d-flex flex-column animate-fade-in">

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="px-4 dash-header d-flex align-items-center justify-content-between shadow-sm z-index-1 position-relative" style={{ height: '65px', flexShrink: 0 }}>
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={onBack}
            className="btn rounded-circle p-2 d-flex align-items-center justify-content-center transition-all"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-primary)', width: '38px', height: '38px' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Edit Profile</h5>
        </div>

        <button
          onClick={handleLogout}
          id="logout-btn"
          className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-bold"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '0.85rem' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <main className="flex-grow-1 p-4 overflow-auto position-relative z-index-0 d-flex justify-content-center align-items-start">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '300px', background: 'linear-gradient(180deg, rgba(0,180,216,0.05) 0%, transparent 100%)', pointerEvents: 'none' }} />

        <div className="w-100 position-relative mt-2 mt-md-4" style={{ maxWidth: '680px' }}>
          <div className="dash-card border-0 rounded-4 overflow-hidden animate-fade-in animate-delay-1" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>

            {/* Banner */}
            <div style={{ height: '120px', background: 'linear-gradient(135deg, #121a2f 0%, #1e293b 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            </div>

            {/* ── Avatar row with upload ── */}
            <div className="px-4 d-flex align-items-end gap-4 position-relative" style={{ marginTop: '-50px', marginBottom: '20px' }}>

              {/* Avatar circle */}
              <div className="position-relative" style={{ flexShrink: 0 }}>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-white overflow-hidden"
                  style={{ width: '96px', height: '96px', border: '4px solid #fff', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', position: 'relative' }}
                >
                  {avatarUploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                      <span className="spinner-border spinner-border-sm text-white" />
                    </div>
                  )}
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,180,216,0.1)' }}>
                      <User size={42} style={{ color: '#00b4d8' }} />
                    </div>
                  )}
                </div>

                {/* Camera badge */}
                <label
                  className="position-absolute d-flex align-items-center justify-content-center rounded-circle shadow"
                  style={{ bottom: 2, right: 2, width: '30px', height: '30px', background: '#00b4d8', border: '2px solid #fff', cursor: avatarUploading ? 'not-allowed' : 'pointer', zIndex: 3 }}
                  title="Upload profile picture"
                >
                  <input
                    type="file"
                    id="avatar-input"
                    hidden
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    disabled={avatarUploading}
                  />
                  <Camera size={14} style={{ color: '#fff' }} />
                </label>
              </div>

              {/* Upload status messages */}
              <div className="pb-1">
                {avatarUploading && (
                  <div className="d-flex align-items-center gap-2" style={{ color: '#00b4d8', fontSize: '0.82rem', fontWeight: 600 }}>
                    <Upload size={14} /> Uploading photo…
                  </div>
                )}
                {avatarError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>⚠️ {avatarError}</div>
                )}

              </div>
            </div>

            <div className="px-4 px-md-5 pb-5">
              <div className="mb-4">
                <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{displayName}</h4>
                <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>
                  Editing profile for <span style={{ color: '#00b4d8', fontWeight: 600 }}>{profile.email}</span>
                </p>
              </div>

              {/* Error / Success banners */}
              {errorMsg && (
                <div className="mb-3 px-3 py-2 rounded-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626', fontSize: '0.85rem' }}>
                  ⚠️ {errorMsg}
                </div>
              )}
              {saveMsg === 'success' && (
                <div className="mb-3 px-3 py-2 rounded-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669', fontSize: '0.85rem' }}>
                  ✓ Profile updated successfully! Redirecting…
                </div>
              )}

              <div className="row g-4">

                {/* First Name */}
                <div className="col-md-6">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    First Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div className="position-relative">
                    <User size={16} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="profile-firstName"
                      type="text"
                      name="firstName"
                      className="input-premium py-2"
                      style={{ paddingLeft: '2.5rem' }}
                      value={editData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="col-md-6">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    Last Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div className="position-relative">
                    <User size={16} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="profile-lastName"
                      type="text"
                      name="lastName"
                      className="input-premium py-2"
                      style={{ paddingLeft: '2.5rem' }}
                      value={editData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Email — READ ONLY */}
                <div className="col-12">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    Email Address
                  </label>
                  <div className="position-relative">
                    <Mail size={16} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="profile-email"
                      type="email"
                      className="input-premium py-2"
                      style={{ paddingLeft: '2.5rem', background: 'rgba(0,180,216,0.03)', cursor: 'not-allowed', opacity: 0.7 }}
                      value={profile.email}
                      disabled
                      readOnly
                    />
                  </div>

                </div>

                {/* Target Role */}
                <div className="col-12">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>Target Role</label>
                  <div className="position-relative">
                    <Briefcase size={16} className="position-absolute" style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="profile-role"
                      type="text"
                      name="role"
                      className="input-premium py-2"
                      style={{ paddingLeft: '2.5rem' }}
                      value={editData.role}
                      onChange={handleChange}
                      placeholder="e.g. Full Stack Developer"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="col-12">
                  <label className="fw-bold small mb-2 text-uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', fontSize: '0.7rem' }}>Technical Skills</label>
                  <div className="position-relative">
                    <Code size={16} className="position-absolute" style={{ top: '1rem', left: '1rem', color: 'var(--text-muted)' }} />
                    <textarea
                      id="profile-skills"
                      name="skills"
                      className="input-premium py-2"
                      rows="3"
                      style={{ paddingLeft: '2.5rem' }}
                      value={editData.skills}
                      onChange={handleChange}
                      placeholder="e.g. React, Node.js, MongoDB, Java"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-4 border-top d-flex justify-content-end gap-3 align-items-center" style={{ borderColor: 'var(--border-color) !important' }}>
                <button
                  onClick={onBack}
                  disabled={saving}
                  className="btn fw-bold px-4 py-2 rounded-3 transition-all"
                  style={{ color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
                >
                  Cancel
                </button>

                <button
                  id="save-profile-btn"
                  onClick={handleSave}
                  disabled={saving || avatarUploading}
                  className="btn-premium d-flex align-items-center justify-content-center gap-2 px-4 py-2 rounded-3 m-0"
                  style={{ width: 'auto', fontSize: '0.9rem', opacity: (saving || avatarUploading) ? 0.75 : 1 }}
                >
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Saving…</>
                  ) : saveMsg === 'success' ? (
                    <>✓ Saved!</>
                  ) : (
                    <><Save size={16} /> Save Changes</>
                  )}
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
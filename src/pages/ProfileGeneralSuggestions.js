import React from 'react';

export default function ProfileGeneralSuggestions(props) {
  const {
    generalActiveTab,
    generalForm,
    setSuggestionsChanged,
    setGeneralForm,
    isMobileViewport,
    previewKey,
    getProfileLink,
    hidePreview,
    forceShow,
    setActiveEditor
  } = props;

  const [newTitle, setNewTitle] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');

  if (generalActiveTab !== 'suggestions' && !forceShow) return null;

  const gProfileLink = getProfileLink();
  const suggestions = Array.isArray(generalForm?.suggestions) ? generalForm.suggestions : [];

  const handleAdd = () => {
    if (!newTitle.trim()) {
      alert('Please enter a title for what you do.');
      return;
    }
    if (suggestions.length >= 4) {
      alert('You can showcase up to 4 custom cards of your work.');
      return;
    }
    setSuggestionsChanged(true);
    setGeneralForm(prev => ({
      ...prev,
      suggestions: [...(prev.suggestions || []), {
        id: Date.now(),
        caption: newTitle.trim(),
        description: newDesc.trim(),
        url: '' // no image for standard text-based "What I Do"
      }]
    }));
    setNewTitle('');
    setNewDesc('');
  };

  const handleRemove = (idx) => {
    setSuggestionsChanged(true);
    setGeneralForm(prev => ({
      ...prev,
      suggestions: (prev.suggestions || []).filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
      {/* ── LEFT: Form + cards ── */}
      <div className="dash-single-profile" style={{ padding: '2rem 2.5rem', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            Services & Offerings
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Visible on profile</span>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                <input 
                  type="checkbox" 
                  checked={generalForm?.showWhatIDo !== false}
                  onChange={(e) => {
                    setSuggestionsChanged(true);
                    setGeneralForm(prev => ({ ...prev, showWhatIDo: e.target.checked }));
                  }}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span className="slider round" style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: generalForm?.showWhatIDo !== false ? '#2563eb' : '#cbd5e1',
                  transition: '.4s', borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                    transform: generalForm?.showWhatIDo !== false ? 'translateX(22px)' : 'none'
                  }} />
                </span>
              </label>
            </div>
            <button
              onClick={() => {
                if (setActiveEditor) {
                  setActiveEditor('default');
                }
              }}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
            >
              Back
            </button>
          </div>
        </div>

        {/* ── Add New suggestion Card ── */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Title input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              What I Do Title *
            </label>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Custom Portrait Commissions, Clay Workshops, Teaching, Designing" 
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                fontSize: '0.9rem', 
                border: '1.5px solid #e2e8f0', 
                background: '#ffffff', 
                color: '#0f172a', 
                outline: 'none', 
                boxSizing: 'border-box' 
              }} 
            />
          </div>

          {/* Description textarea */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              Brief Description
            </label>
            <textarea 
              rows={4} 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Tell viewers about what you do in this area — details, process, tools, or style..." 
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                fontSize: '0.9rem', 
                border: '1.5px solid #e2e8f0', 
                background: '#ffffff', 
                color: '#0f172a', 
                outline: 'none', 
                resize: 'vertical', 
                boxSizing: 'border-box', 
                fontFamily: 'inherit' 
              }} 
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: '100px',
              fontSize: '0.9rem',
              fontWeight: 700,
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>✦</span>
            <span>Add to "What I Do"</span>
          </button>
        </div>

        {/* ── List of Added Items ── */}
        <div>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Your "What I Do" Items ({suggestions.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Add the things you do to showcase your skills and offerings
            </span>
          </div>

          {suggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {suggestions.map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    gap: '1.5rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {item.caption}
                    </h4>
                    {item.description && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(idx)}
                    style={{
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>No services or offerings added yet</span>
            </div>
          )}
        </div>

      </div>

      {/* ── RIGHT: Live Preview ── */}
      {!isMobileViewport && !hidePreview && (
        <div className="dash-preview-panel">
          <div className="dash-full-preview-container">
            <iframe
              key={`gp-suggestions-${previewKey}`}
              title="General Profile Preview"
              src={gProfileLink}
              className="dash-preview-iframe"
            />
          </div>
        </div>
      )}
    </div>
  );
}

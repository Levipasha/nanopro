import React from 'react';

export default function ProfileArtistPlatformCard({
  platform,
  artist,
  pendingLinks,
  openSubPanel,
  setOpenSubPanel,
  openLinkPopup,
  handleUpdateLink,
  handleUpdateHeroField,
  handleUpdateLinkLayout,
  handleUpdateLinkImage,
  handleRemoveLinkImage,
  handleUpdateLinkPrioritize,
  handleDuplicateLink,
  linkItem,
  isMobileViewport
}) {
  const cardKey = linkItem?._id || platform.id;

  const getPlatformLabel = () => {
    if (linkItem && linkItem.title) return linkItem.title;
    return platform.label;
  };

  const getPlatformFullUrl = (platformId, val) => {
    if (!val) return `Add your ${getPlatformLabel()} URL or username`;
    switch (platformId) {
      case 'whatsapp':
        return `https://wa.me/${val.replace(/\D/g, '')}`;
      case 'instagram':
        return `https://instagram.com/${val.replace('@', '')}`;
      case 'twitter':
        return `https://twitter.com/${val}`;
      case 'youtube':
        return val.startsWith('http') ? val : `https://youtube.com/${val}`;
      case 'facebook':
        return val.startsWith('http') ? val : `https://facebook.com/${val}`;
      case 'linkedin':
        return val.startsWith('http') ? val : `https://linkedin.com/in/${val}`;
      case 'pinterest':
        return val.startsWith('http') ? val : `https://pinterest.com/${val}`;
      case 'tiktok':
        return val.startsWith('http') ? val : `https://tiktok.com/@${val}`;
      case 'behance':
        return val.startsWith('http') ? val : `https://behance.net/${val}`;
      case 'dribbble':
        return val.startsWith('http') ? val : `https://dribbble.com/${val}`;
      default:
        return val.startsWith('http') ? val : `https://${val}`;
    }
  };

  const isPlatformEnabled = artist ? (artist[`show_${platform.id}`] !== false) : false;
  let serverValue = linkItem ? linkItem.url : ((artist && artist[platform.id]) || '');
  if (platform.id === 'whatsapp' && serverValue && serverValue.includes('wa.me/')) {
    serverValue = serverValue.split('wa.me/')[1];
  }
  const localValue = pendingLinks ? pendingLinks[cardKey] : undefined;
  const currentValue = localValue !== undefined ? localValue : serverValue;

  const platformLinkInfo = linkItem || null;
  const currentPrioritizeType = (platformLinkInfo && platformLinkInfo.prioritizeType) || 'none';
  const currentAnimationType = (platformLinkInfo && platformLinkInfo.animationType) || 'buzz';

  return (
    <div className="dash-link-card" style={{
      border: '1px solid rgba(0,0,0,0.06)',
      borderRadius: '20px',
      padding: '1.25rem',
      background: '#fff',
      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
      marginBottom: '16px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      opacity: isPlatformEnabled ? 1 : 0.65,
      transition: 'opacity 0.2s ease-in-out'
    }}>
      {/* Top Row */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
        {/* Drag Handle Icon */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: isPlatformEnabled ? '#cbd5e1' : '#e2e8f0', paddingRight: '4px', transition: 'color 0.2s' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>

        {/* Thumbnail Preview if custom image exists */}
        {(() => {
          if (platformLinkInfo && platformLinkInfo.image) {
            return (
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                marginRight: '8px',
                flexShrink: 0
              }}>
                <img src={platformLinkInfo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            );
          }
          return null;
        })()}

        {/* Title & Edit Column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span 
              onClick={() => openLinkPopup(platform.id, platform.label, getPlatformLabel(), 'title', linkItem?._id)}
              style={{ 
                fontWeight: 700, 
                fontSize: '0.95rem', 
                color: isPlatformEnabled ? '#1e293b' : '#94a3b8', 
                cursor: 'pointer',
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {getPlatformLabel()}
            </span>
            <svg 
              onClick={() => openLinkPopup(platform.id, platform.label, getPlatformLabel(), 'title', linkItem?._id)}
              viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" 
              style={{ color: '#94a3b8', cursor: 'pointer', verticalAlign: 'middle', flexShrink: 0 }}
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span 
              onClick={() => openLinkPopup(platform.id, platform.label, currentValue, 'value', linkItem?._id)}
              style={{ 
                fontSize: '0.85rem', 
                color: isPlatformEnabled ? (currentValue ? '#2563eb' : '#64748b') : '#94a3b8', 
                cursor: 'pointer', 
                textDecoration: isPlatformEnabled && currentValue ? 'underline' : 'none', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: currentValue ? '600' : '400',
                transition: 'color 0.2s'
              }}
            >
              {getPlatformFullUrl(platform.id, currentValue)}
            </span>
            <svg 
              onClick={() => openLinkPopup(platform.id, platform.label, currentValue, 'value', linkItem?._id)}
              viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" 
              style={{ color: '#94a3b8', cursor: 'pointer', verticalAlign: 'middle', flexShrink: 0 }}
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </div>
        </div>

        {/* Actions Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Share/Visit Link button */}
          {currentValue && isPlatformEnabled && (
            <a 
              href={getPlatformFullUrl(platform.id, currentValue)} 
              target="_blank" 
              rel="noreferrer"
              style={{ 
                color: '#64748b', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
              className="dash-link-action-icon-btn"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          {/* Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleUpdateHeroField(`show_${platform.id}`, !isPlatformEnabled)}
              style={{
                width: '38px',
                height: '20px',
                borderRadius: '999px',
                background: isPlatformEnabled ? '#10b981' : '#cbd5e1',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '2px',
                left: isPlatformEnabled ? '20px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }} />
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', marginTop: '0.75rem', marginBottom: '0.75rem' }} />

      {/* Footer Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '0.25rem' }}>
        {/* Sub Option Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#cbd5e1' }}>
          {(() => {
            const hasCustomImage = !!(platformLinkInfo && platformLinkInfo.image);
            const isPrioritized = platformLinkInfo && platformLinkInfo.prioritizeType && platformLinkInfo.prioritizeType !== 'none';
            const isPrioritizeOpen = openSubPanel[cardKey] === 'prioritize';

            return (
              <>
                {/* 1. Default logo icon */}
                <button 
                  type="button"
                  onClick={() => setOpenSubPanel(prev => ({
                    ...prev,
                    [cardKey]: prev[cardKey] === 'layout' ? null : 'layout'
                  }))}
                  title="Link layout options"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: 0, 
                    color: openSubPanel[cardKey] === 'layout' ? '#7c3aed' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>

                {/* 2. Image icon (photo custom image) */}
                <button 
                  type="button"
                  onClick={() => setOpenSubPanel(prev => ({
                    ...prev,
                    [cardKey]: prev[cardKey] === 'thumbnail' ? null : 'thumbnail'
                  }))}
                  title="Add or edit thumbnail" 
                  style={{ 
                    background: openSubPanel[cardKey] === 'thumbnail' ? '#7c3aed' : 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: openSubPanel[cardKey] === 'thumbnail' ? '6px' : 0,
                    borderRadius: openSubPanel[cardKey] === 'thumbnail' ? '8px' : 0,
                    color: openSubPanel[cardKey] === 'thumbnail' ? '#ffffff' : '#cbd5e1', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>

                {/* 3. Star icon (prioritize) */}
                <button 
                  type="button"
                  onClick={() => setOpenSubPanel(prev => ({
                    ...prev,
                    [cardKey]: prev[cardKey] === 'prioritize' ? null : 'prioritize'
                  }))}
                  title="Prioritize this link"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: 0, 
                    color: isPrioritizeOpen || isPrioritized ? '#7c3aed' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill={isPrioritizeOpen || isPrioritized ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>

                {/* 6. Graph icon followed by "0 clicks" */}
                {!isMobileViewport && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', cursor: 'default' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span>0 clicks</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Duplicate Button */}
          {currentValue && (
            <button
              type="button"
              onClick={() => handleDuplicateLink(linkItem || { platform: platform.id, url: currentValue, title: getPlatformLabel(), layoutType: platformLinkInfo?.layoutType || 'classic', image: platformLinkInfo?.image || '' })}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
                marginRight: '12px'
              }}
              className="dash-link-duplicate-btn"
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7c3aed'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
              title="Duplicate platform link"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => handleUpdateLink(platform.id, null, linkItem?._id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            className="dash-link-delete-trash-btn"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
            title="Delete platform link"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Panel Drawers */}
      {(() => {
        if (openSubPanel[cardKey] === 'layout') {
          const hasCustomImage = !!(platformLinkInfo && platformLinkInfo.image);
          const layoutType = platformLinkInfo?.layoutType || (hasCustomImage ? 'featured' : 'classic');
          const isClassic = layoutType === 'classic';
          const isFeatured = layoutType === 'featured';

          return (
            <div style={{
              marginTop: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              position: 'relative',
              padding: '24px 20px 20px'
            }}>
              <button 
                type="button" 
                onClick={() => setOpenSubPanel(prev => ({ ...prev, [cardKey]: null }))}
                style={{ 
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '4px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#94a3b8',
                  zIndex: 10,
                  transition: 'color 0.2s'
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px', textAlign: 'left' }}>
                Choose a layout for your link
              </div>

              {/* Option 1: Classic */}
              <div 
                onClick={() => {
                  handleUpdateLinkLayout(platform.id, 'classic', linkItem?._id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '2px solid ' + (isClassic ? '#000000' : 'rgba(0,0,0,0.06)'),
                  cursor: 'pointer',
                  marginBottom: '16px',
                  background: '#ffffff',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2.5px solid ' + (isClassic ? '#000000' : '#d1d1d6'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  flexShrink: 0
                }}>
                  {isClassic && (
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#000000' }} />
                  )}
                </div>

                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a', marginBottom: '4px' }}>Classic</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Efficient, direct and compact.</div>
                  <div style={{
                    width: '160px',
                    height: '32px',
                    borderRadius: '16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#cbd5e1' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ width: '45px', height: '4px', background: '#94a3b8', borderRadius: '2px' }} />
                        <div style={{ width: '25px', height: '3px', background: '#cbd5e1', borderRadius: '1.5px' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>↗</div>
                  </div>
                </div>
              </div>

              {/* Option 2: Featured */}
              <div 
                onClick={() => {
                  handleUpdateLinkLayout(platform.id, 'featured', linkItem?._id);
                  if (!hasCustomImage) {
                    setOpenSubPanel(prev => ({ ...prev, [cardKey]: 'thumbnail' }));
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '2px solid ' + (isFeatured ? '#000000' : 'rgba(0,0,0,0.06)'),
                  cursor: 'pointer',
                  background: '#ffffff',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2.5px solid ' + (isFeatured ? '#000000' : '#d1d1d6'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  flexShrink: 0
                }}>
                  {isFeatured && (
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#000000' }} />
                  )}
                </div>

                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a', marginBottom: '4px' }}>Featured</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Make your link stand out with a larger, more attractive display.</div>
                  <div style={{
                    width: '160px',
                    height: '92px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '6px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '52px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                      <div style={{ width: '50px', height: '5px', background: '#475569', borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (openSubPanel[cardKey] === 'thumbnail') {
          const hasCustomImage = !!(platformLinkInfo && platformLinkInfo.image);

          return (
            <div style={{
              marginTop: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              position: 'relative',
              padding: '24px 20px 20px'
            }}>
              <button 
                type="button" 
                onClick={() => setOpenSubPanel(prev => ({ ...prev, [cardKey]: null }))}
                style={{ 
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '4px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#94a3b8',
                  zIndex: 10,
                  transition: 'color 0.2s'
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                {hasCustomImage ? (
                  <>
                    <img 
                      src={platformLinkInfo.image} 
                      alt="Thumbnail preview" 
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        flexShrink: 0
                      }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      <label style={{
                        background: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'background 0.2s',
                        display: 'block',
                        boxSizing: 'border-box'
                      }}>
                        Change
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUpdateLinkImage(platform.id, e.target.files[0], linkItem?._id);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveLinkImage(platform.id, linkItem?._id)}
                        style={{
                          background: '#ffffff',
                          color: '#1a1a1a',
                          border: '1px solid rgba(0,0,0,0.15)',
                          borderRadius: '999px',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    height: '80px',
                    borderRadius: '16px',
                    border: '2px dashed rgba(0,0,0,0.12)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#7c3aed',
                    background: '#faf5ff',
                    boxSizing: 'border-box'
                  }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Upload Thumbnail
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUpdateLinkImage(platform.id, e.target.files[0], linkItem?._id);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        }

        if (openSubPanel[cardKey] === 'prioritize') {
          return (
            <div style={{
              marginTop: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#ffffff',
              fontFamily: "'Outfit', sans-serif"
            }}>
              <div style={{
                background: '#e6e4df',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#1a1a1a', textTransform: 'capitalize', letterSpacing: '0.3px', margin: '0 auto', paddingLeft: '24px' }}>Prioritize</span>
                <button 
                  type="button" 
                  onClick={() => setOpenSubPanel(prev => ({ ...prev, [cardKey]: null }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#666' }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div style={{ padding: '14px 18px', fontSize: '12.5px', color: '#666666', lineHeight: '1.45', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                Draw attention or even redirect traffic to your most important link. Only one link can be prioritized at a time.
              </div>

              <div style={{ padding: '8px 0' }}>
                {/* Option 1: Animate */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => handleUpdateLinkPrioritize(platform.id, 'animate', currentAnimationType, linkItem?._id)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid ' + (currentPrioritizeType === 'animate' ? '#000000' : '#d1d1d6'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        flexShrink: 0
                      }}>
                        {currentPrioritizeType === 'animate' && (
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#000000' }} />
                        )}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1c1c1e' }}>Animate</div>
                        <div style={{ fontSize: '11px', color: '#8e8e93', marginTop: '2px' }}>Apply a fun and engaging motion effect to this link.</div>
                      </div>
                    </div>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#f2f2f7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8e8e93'
                    }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>

                  {currentPrioritizeType === 'animate' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {['buzz', 'wobble', 'pop', 'swipe'].map((anim) => {
                        const isSelected = currentAnimationType === anim;
                        return (
                          <button
                            key={anim}
                            type="button"
                            onClick={() => handleUpdateLinkPrioritize(platform.id, 'animate', anim, linkItem?._id)}
                            style={{
                              flex: 1,
                              padding: '10px 4px',
                              borderRadius: '8px',
                              border: isSelected ? '1.5px solid #000000' : '1px solid #e5e5ea',
                              background: '#ffffff',
                              fontWeight: '700',
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              color: isSelected ? '#000000' : '#8e8e93',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {anim}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>


                {/* Option 3: None */}
                <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => handleUpdateLinkPrioritize(platform.id, 'none', 'buzz', linkItem?._id)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid ' + (currentPrioritizeType === 'none' ? '#000000' : '#d1d1d6'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                      flexShrink: 0
                    }}>
                      {currentPrioritizeType === 'none' && (
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#000000' }} />
                      )}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1c1c1e' }}>Off</div>
                      <div style={{ fontSize: '11px', color: '#8e8e93', marginTop: '2px' }}>Normal display setting.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import icons from './LinkIcons';

const PLATFORMS = [
  { value: 'website', label: 'Website', icon: icons.website },
  { value: 'portfolio', label: 'Portfolio', icon: icons.portfolio },
  { value: 'instagram', label: 'Instagram', icon: icons.instagram },
  { value: 'pinterest', label: 'Pinterest', icon: icons.pinterest },
  { value: 'youtube', label: 'YouTube', icon: icons.youtube },
  { value: 'tiktok', label: 'TikTok', icon: icons.tiktok },
  { value: 'twitter', label: 'Twitter', icon: icons.twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: icons.linkedin },
  { value: 'spotify', label: 'Spotify', icon: icons.spotify },
  { value: 'facebook', label: 'Facebook', icon: icons.facebook },
  { value: 'whatsapp', label: 'WhatsApp', icon: icons.whatsapp },
  { value: 'discord', label: 'Discord', icon: icons.discord },
  { value: 'snapchat', label: 'Snapchat', icon: icons.snapchat },
  { value: 'telegram', label: 'Telegram', icon: icons.telegram },
  { value: 'reddit', label: 'Reddit', icon: icons.reddit },
  { value: 'threads', label: 'Threads', icon: icons.threads },
  { value: 'tumblr', label: 'Tumblr', icon: icons.tumblr },
  { value: 'twitch', label: 'Twitch', icon: icons.twitch },
  { value: 'medium', label: 'Medium', icon: icons.medium },
  { value: 'quora', label: 'Quora', icon: icons.quora },
  { value: 'github', label: 'GitHub', icon: icons.github }
];

function PlatformIconSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const platform = PLATFORMS.find(p => p.value === (value || 'website')) || PLATFORMS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={`platform-icon-select ${open ? 'is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className="platform-icon-select-trigger"
        onClick={() => setOpen(!open)}
        aria-label={`Select platform. Current: ${platform.label}`}
        title={platform.label}
      >
        <span className="platform-icon-select-icon">{platform.icon}</span>
        <span className="platform-icon-select-chevron">▼</span>
      </button>
      {open && (
        <div className="platform-icon-select-dropdown">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`platform-icon-select-option ${p.value === platform.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
              title={p.label}
              aria-label={p.label}
            >
              {p.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlatformIconSelect;

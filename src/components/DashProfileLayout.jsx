import React from 'react';
import './dashProfile.css';

/**
 * Simple layout wrapper used by all profile pages.
 * Wraps children in the shared `dash-profile-layout` container.
 * Accepts an optional `className` prop for additional theme classes.
 */
export default function DashProfileLayout({ children, className = '' }) {
  return (
    <div className={`dash-profile-layout ${className}`} style={{ flex: 1, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

import React from 'react';
import nfcProfileImage from '../../image.jpg';

export default function HomePopups({
    showNfcPopup, setShowNfcPopup,
    showDigitalIdPopup, setShowDigitalIdPopup,
    showSmartBadgePopup, setShowSmartBadgePopup,
    showCustomIntegrationPopup, setShowCustomIntegrationPopup
}) {
    return (
        <>
            {/* NFC Profile Popup */}
            {showNfcPopup && (
                <div className="popup-overlay" onClick={() => setShowNfcPopup(false)}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-image">
                            <img src={nfcProfileImage} alt="NFC Profile Cards" />
                        </div>
                        <div className="popup-text">
                            <h3>NFC Profile Cards</h3>
                            <p>NFC Profile is a smart digital identity system that instantly displays a user's verified profile when an NFC card or tag is tapped on a device. It securely presents key details such as name, class/role, contact information, blood group, and more in a clean, professional interface. Ideal for schools, colleges, enterprises, and events, it replaces traditional ID cards with a fast, secure, and modern tap-to-verify solution.</p>
                            <div className="popup-features">
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <span>Secure, real-time profile access via NFC tap</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                            <path d="M2 10h20" />
                                        </svg>
                                    </span>
                                    <span>Digital ID card replacement</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                        </svg>
                                    </span>
                                    <span>Instant verification for organizations</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="5" y="2" width="14" height="20" rx="2" />
                                            <path d="M12 18h.01" />
                                        </svg>
                                    </span>
                                    <span>Mobile-friendly, responsive profile view</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                                        </svg>
                                    </span>
                                    <span>Cloud-based, easy profile updates</span>
                                </div>
                            </div>
                            <p className="tagline">Just Tap & Verify.</p>
                            <div className="popup-footer">
                                <button className="popup-close" onClick={() => setShowNfcPopup(false)} aria-label="Close">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Digital ID & Verification Popup */}
            {showDigitalIdPopup && (
                <div className="popup-overlay" onClick={() => setShowDigitalIdPopup(false)}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-image">
                            <img src="https://www.shutterstock.com/image-photo/digital-identification-concept-electronic-id-600nw-2552860339.jpg" alt="Digital ID & Verification" />
                        </div>
                        <div className="popup-text">
                            <div className="popup-title-row">
                                <h3>Digital ID & Verification</h3>
                                <span className="popup-verified" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </span>
                            </div>
                            <p>Advanced digital identity verification system that provides secure, instant authentication through multiple verification methods. Our solution combines cutting-edge encryption with user-friendly interfaces to deliver reliable identity verification for modern organizations.</p>
                            <div className="popup-features">
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <span>Multi-layer security encryption</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                        </svg>
                                    </span>
                                    <span>Instant identity verification</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 20V10M12 20V4M6 20v-6" />
                                        </svg>
                                    </span>
                                    <span>Real-time authentication tracking</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                    </span>
                                    <span>Cross-platform compatibility</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </span>
                                    <span>Fraud detection & prevention</span>
                                </div>
                            </div>
                            <p className="tagline">Secure Identity, Instant Access.</p>
                            <div className="popup-footer">
                                <button className="popup-close" onClick={() => setShowDigitalIdPopup(false)} aria-label="Close">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Smart Badges Popup */}
            {showSmartBadgePopup && (
                <div className="popup-overlay" onClick={() => setShowSmartBadgePopup(false)}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-image">
                            <img src="https://i.etsystatic.com/14793044/r/il/5a1578/5745450374/il_570xN.5745450374_qzk9.jpg" alt="Smart Badges" />
                        </div>
                        <div className="popup-text">
                            <div className="popup-title-row">
                                <h3>Smart Badges</h3>
                                <span className="popup-verified" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </span>
                            </div>
                            <p>Revolutionary smart badge system that enables instant profile verification and access control through advanced NFC technology. Perfect for corporate environments, events, and secure facilities requiring real-time identity verification.</p>
                            <div className="popup-features">
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                    </span>
                                    <span>Instant profile scanning</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <path d="M9 22V12h6v10" />
                                        </svg>
                                    </span>
                                    <span>Access control integration</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </span>
                                    <span>Multi-factor authentication</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 20V10M12 20V4M6 20v-6" />
                                        </svg>
                                    </span>
                                    <span>Analytics dashboard</span>
                                </div>
                            </div>
                            <p className="tagline">Smart Access, Secure Entry.</p>
                            <button className="popup-close" onClick={() => setShowSmartBadgePopup(false)} aria-label="Close">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Integrations Popup */}
            {showCustomIntegrationPopup && (
                <div className="popup-overlay" onClick={() => setShowCustomIntegrationPopup(false)}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-image">
                            <img src="https://media.istockphoto.com/id/1498846229/photo/businessman-pressing-on-virtual-screen-and-select-customization.jpg?s=612x612&w=0&k=20&c=kTc-ValbAhNNWHudOl8f5q6v2sbNAA5UabWiVIxkcco=" alt="Custom Integrations" />
                        </div>
                        <div className="popup-text">
                            <div className="popup-title-row">
                                <h3>Custom Integrations</h3>
                                <span className="popup-verified" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </span>
                            </div>
                            <p>Seamless integration solutions that connect your digital identity system with existing business applications, mobile platforms, and enterprise workflows. Our flexible API and development tools enable custom solutions tailored to your specific organizational needs.</p>
                            <div className="popup-features">
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                    </span>
                                    <span>API integration capabilities</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="5" y="2" width="14" height="20" rx="2" />
                                            <path d="M12 18h.01" />
                                        </svg>
                                    </span>
                                    <span>Mobile app development</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                                        </svg>
                                    </span>
                                    <span>Cloud synchronization</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <path d="M9 22V12h6v10" />
                                        </svg>
                                    </span>
                                    <span>Enterprise system connectivity</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                        </svg>
                                    </span>
                                    <span>Custom workflow automation</span>
                                </div>
                            </div>
                            <p className="tagline">Integrated Solutions, Seamless Operations.</p>
                            <div className="popup-footer">
                                <button className="popup-close" onClick={() => setShowCustomIntegrationPopup(false)} aria-label="Close">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


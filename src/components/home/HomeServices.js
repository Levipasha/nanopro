import React from 'react';

export default function HomeServices({
    setShowNfcPopup,
    setShowDigitalIdPopup,
    setShowSmartBadgePopup,
    setShowCustomIntegrationPopup
}) {
    return (
        <section id="services" className="info-section page-section">
            <div className="info-inner">
                <h2>Our Services</h2>
                <div className="services-grid services-grid-neo">
                    <div className="service-card-neo" style={{ '--card-bg': '#ff66a3' }} onClick={() => setShowNfcPopup(true)}>
                        <div className="service-card-neo-head">NFC Profile Cards</div>
                        <div className="service-card-neo-content">
                            <p>Tap-to-share profiles with secure data controls and clean design.</p>
                            <button type="button" className="service-card-neo-btn">Learn more</button>
                        </div>
                    </div>

                    <div className="service-card-neo" style={{ '--card-bg': '#60a5fa' }} onClick={() => setShowDigitalIdPopup(true)}>
                        <div className="service-card-neo-head">Digital ID & Verification</div>
                        <div className="service-card-neo-content">
                            <p>Identity scanning flows with encryption-ready storage patterns.</p>
                            <button type="button" className="service-card-neo-btn">Learn more</button>
                        </div>
                    </div>

                    <div className="service-card-neo" style={{ '--card-bg': '#fbbf24' }} onClick={() => setShowSmartBadgePopup(true)}>
                        <div className="service-card-neo-head">Smart Badges</div>
                        <div className="service-card-neo-content">
                            <p>Scan the badge to instantly view and verify your profile in real time.</p>
                            <button type="button" className="service-card-neo-btn">Learn more</button>
                        </div>
                    </div>

                    <div className="service-card-neo" style={{ '--card-bg': '#4ade80' }} onClick={() => setShowCustomIntegrationPopup(true)}>
                        <div className="service-card-neo-head">Custom Integrations</div>
                        <div className="service-card-neo-content">
                            <p>Connect profiles with mobile apps, cloud sync, and business systems.</p>
                            <button type="button" className="service-card-neo-btn">Learn more</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


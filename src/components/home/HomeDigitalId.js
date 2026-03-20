import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCard from '../../ProfileCard';
import nanoProfileAvatar from '../../NANO PROfile.png';

export default function HomeDigitalId() {
    const navigate = useNavigate();

    return (
        <section id="digital-id" className="info-section page-section">
            <div className="info-inner">
                <h2>Digital ID of You</h2>
                <div className="digital-id-wrap">
                    <ProfileCard
                        name="Your Digital ID"
                        title="Secure, Smart Identity"
                        handle="nanoprofiles"
                        status="Tap to view"
                        contactText="View Profile"
                        avatarUrl={nanoProfileAvatar}
                        showUserInfo={false}
                        enableTilt={true}
                        enableMobileTilt={false}
                        behindGlowColor="rgba(125, 190, 255, 0.67)"
                        iconUrl="/assets/demo/iconpattern.png"
                        behindGlowEnabled
                        innerGradient="linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)"
                    />

                    <button
                        type="button"
                        className="digital-id-cta"
                        onClick={() => navigate('/login')}
                    >
                        CREATE YOUR ID
                    </button>
                </div>
            </div>
        </section>
    );
}


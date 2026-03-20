import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, onAuthStateChanged, logout } from '../../firebase';

export default function HomeNavbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const navigate = useNavigate();
    const avatarMenuRef = useRef(null);

    const [user, setUser] = useState(null);
    const [otpUser, setOtpUser] = useState(() => {
        try {
            const raw = localStorage.getItem('landing_otp_auth');
            if (raw) {
                const data = JSON.parse(raw);
                if (data?.email && data?.token) return { email: data.email, token: data.token };
            }
        } catch (e) { }
        return null;
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
                setAvatarMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (user) logout();
        setOtpUser(null);
        localStorage.removeItem('landing_otp_auth');
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('general_step');
        localStorage.removeItem('profile_mode');
        setMobileMenuOpen(false);
        setAvatarMenuOpen(false);
    };

    const isLoggedIn = !!(user || otpUser);

    const userInitial = user?.displayName
        ? user.displayName.charAt(0).toUpperCase()
        : otpUser?.email
            ? otpUser.email.charAt(0).toUpperCase()
            : 'U';

    return (
        <nav className="nano-navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <Link className="navbar-logo" to="/">
                        <div className="logo-text">Nano Profiles</div>
                        <div className="logo-sub">NFC • DIGITAL IDENTITY</div>
                    </Link>
                </div>

                <div className={`navbar-center ${mobileMenuOpen ? 'mobile-show' : ''}`}>
                    <div className="nav-links-wrap">
                        <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>HOME</Link>
                        <Link to="/artist-showcase" className="nav-link" onClick={() => setMobileMenuOpen(false)}>ARTIST</Link>
                        <Link to="/student-showcase" className="nav-link" onClick={() => setMobileMenuOpen(false)}>STUDENT</Link>
                        <Link to="/restaurant-showcase" className="nav-link" onClick={() => setMobileMenuOpen(false)}>RESTAURANT</Link>
                    </div>
                </div>

                <div className="navbar-right">
                    <div className="nav-actions">
                        {isLoggedIn ? (
                            <div className="nav-user-area" ref={avatarMenuRef}>
                                <button
                                    className="nav-avatar-circle"
                                    onClick={() => setAvatarMenuOpen((v) => !v)}
                                >
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="" />
                                    ) : (
                                        <span>{userInitial}</span>
                                    )}
                                </button>
                                {avatarMenuOpen && (
                                    <div className="nav-dropdown">
                                        <button onClick={() => { setAvatarMenuOpen(false); navigate('/profile'); }}>Dashboard</button>
                                        <button onClick={() => { setAvatarMenuOpen(false); handleLogout(); }}>Logout</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="nav-login-btn">
                                <span className="dot blue"></span>
                                <span className="dot purple"></span>
                                <span className="dot teal"></span>
                            </Link>
                        )}
                    </div>

                    <button className={`nav-toggle ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </nav>
    );
}


import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, onAuthStateChanged, logout } from '../../firebase';
import './HomeNavbar.overrides.css';

export default function HomeNavbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isHomeActive = pathname === '/';
    const isArtistActive = pathname.startsWith('/artist-showcase') || pathname === '/artist';
    const isStudentActive = pathname.startsWith('/student-showcase') || pathname === '/student';
    const isRestaurantActive = pathname.startsWith('/restaurant-showcase') || pathname.startsWith('/link/');
    const avatarMenuRef = useRef(null);

    const [user, setUser] = useState(null);

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
        try { localStorage.removeItem('landing_otp_auth'); } catch (e) { }
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('general_step');
        localStorage.removeItem('profile_mode');
        setMobileMenuOpen(false);
        setAvatarMenuOpen(false);
    };

    const isLoggedIn = !!user;

    const userInitial = user?.displayName
        ? user.displayName.charAt(0).toUpperCase()
        : user?.email
            ? user.email.charAt(0).toUpperCase()
            : 'U';

    return (
        <nav className="nano-navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <Link className="navbar-logo" to="/">
                        <div className="logo-text">Nano Profiles</div>
                    </Link>
                </div>

                <div className={`navbar-center ${mobileMenuOpen ? 'mobile-show' : ''}`}>
                    <div className="nav-links-wrap">
                        <Link
                            to="/"
                            className={`nav-link${isHomeActive ? ' nav-link--active' : ''}`}
                            aria-current={isHomeActive ? 'page' : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            HOME
                        </Link>
                        <Link
                            to="/artist-showcase"
                            className={`nav-link${isArtistActive ? ' nav-link--active' : ''}`}
                            aria-current={isArtistActive ? 'page' : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            ARTIST
                        </Link>
                        <Link
                            to="/student-showcase"
                            className={`nav-link${isStudentActive ? ' nav-link--active' : ''}`}
                            aria-current={isStudentActive ? 'page' : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            STUDENT
                        </Link>
                        <Link
                            to="/restaurant-showcase"
                            className={`nav-link${isRestaurantActive ? ' nav-link--active' : ''}`}
                            aria-current={isRestaurantActive ? 'page' : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            RESTAURANT
                        </Link>
                    </div>
                </div>

                <div className="navbar-right">
                    <div className="nav-actions">
                        {isLoggedIn ? (
                            <div className="nav-user-area" ref={avatarMenuRef}>
                                <button
                                    type="button"
                                    className="nav-avatar-circle"
                                    onClick={() => setAvatarMenuOpen((v) => !v)}
                                    aria-expanded={avatarMenuOpen}
                                    aria-haspopup="true"
                                    aria-label="Profile menu"
                                >
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="" />
                                    ) : (
                                        <span>{userInitial}</span>
                                    )}
                                </button>
                                {avatarMenuOpen && (
                                    <div className="nav-dropdown" role="menu">
                                        <button type="button" role="menuitem" onClick={() => { setAvatarMenuOpen(false); navigate('/profile'); }}>Dashboard</button>
                                        <button type="button" role="menuitem" onClick={() => { setAvatarMenuOpen(false); handleLogout(); }}>Logout</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="nav-profile-signin"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign in
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


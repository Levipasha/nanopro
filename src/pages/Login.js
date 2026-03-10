import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithGoogle, onAuthStateChanged, auth } from '../firebase';
import { landingArtistAPI } from '../services/api';
import './Login.css';

function Login() {
    const clearSavedProfileFlow = () => {
        localStorage.removeItem('landing_otp_auth');
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('general_step');
        localStorage.removeItem('profile_mode');
    };

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email'); // 'email' | 'otp'
    const [view, setView] = useState('choice'); // 'choice' | 'form'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [showSignupLink, setShowSignupLink] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const m = params.get('mode');
        if (m === 'signup' || m === 'login') {
            setMode(m);
            setView('form');
        }
    }, [location.search]);

    useEffect(() => {
        let isActive = true;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                if (isActive) setLoading(false);
                return;
            }

            if (user) {
                // If we are in login mode, check if the account exists first
                if (isActive) {
                    setError('');
                    setShowSignupLink(false);
                    setLoading(true);
                }

                if (mode === 'login') {
                    try {
                        const check = await landingArtistAPI.checkAccount(user.email);
                        if (!check || !check.exists) {
                            await auth.signOut();
                            clearSavedProfileFlow();
                            if (!isActive) return;
                            setEmail(user.email || '');
                            setOtp('');
                            setStep('email');
                            setSuccess('');
                            setView('form');
                            setMode('login');
                            setError('No profile has been created on this mail. Please');
                            setShowSignupLink(true);
                            navigate('/login?mode=login', { replace: true });
                            return;
                        }
                    } catch (err) {
                        console.error('Account check failed:', err);
                        await auth.signOut();
                        clearSavedProfileFlow();
                        if (!isActive) return;
                        setOtp('');
                        setStep('email');
                        setSuccess('');
                        setView('form');
                        setMode('login');
                        setError('Account verification failed. Please check your connection or Sign Up.');
                        setShowSignupLink(true);
                        navigate('/login?mode=login', { replace: true });
                        return;
                    } finally {
                        if (isActive) setLoading(false);
                    }
                }

                clearSavedProfileFlow();
                if (isActive) navigate('/profile', { replace: true });
            }
        });

        return () => {
            isActive = false;
            unsubscribe();
        };
    }, [navigate, mode]);

    const handleGoogleLogin = async () => {
        setError('');
        setShowSignupLink(false);
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || 'Google login failed');
            setLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e?.preventDefault?.();
        setError('');
        setShowSignupLink(false);
        setLoading(true);
        try {
            await landingArtistAPI.sendOtp(email, mode);
            setStep('otp');
            setTempEmail(email);
            setSuccess('Code sent to your email!');
        } catch (err) {
            const msg = err.message || '';
            console.error('Login error:', msg);

            if (msg.toLowerCase().includes('no profile has been created') ||
                msg.toLowerCase().includes('no profile found') ||
                msg.toLowerCase().includes('verification aborted')) {
                clearSavedProfileFlow();
                setOtp('');
                setStep('email');
                setSuccess('');
                setError('No profile has been created on this mail. Please');
                setShowSignupLink(true);
            } else {
                setError(msg || 'Failed to send OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e?.preventDefault?.();
        setError('');
        setShowSignupLink(false);
        setLoading(true);
        try {
            const data = await landingArtistAPI.verifyOtp(email, otp, mode);
            if (data.token) {
                localStorage.setItem('landing_otp_auth', JSON.stringify({ email: data.email, token: data.token }));
                navigate('/profile');
            }
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('no profile found')) {
                clearSavedProfileFlow();
                setError('Login failed: No account associated with this email.');
                setStep('email'); // Reset to email step
            } else {
                setError(msg || 'Invalid OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    if (view === 'choice') {
        return (
            <div className="login-container">
                <div className="form choice-view" style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className="back-button"
                        style={{ top: '20px', left: '20px' }}
                        onClick={() => navigate('/')}
                    >
                        <svg height="28" width="28" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024">
                            <path d="M874.690416 495.024777c0 11.297082-9.156882 20.453964-20.453964 20.453964l-584.773974 0 270.524105 270.524105c8.007959 8.007959 8.007959 20.941926 0 28.949885-8.007959 8.007959-20.941926 8.007959-28.949885 0L201.701925 510.432085l0 0C193.693966 502.424126 193.693966 489.490159 201.701925 481.4822l309.334768-309.334768c8.007959-8.007959 20.941926-8.007959 28.949885 0 8.007959 8.007959 8.007959 20.941926 0 28.949885L269.46248 474.570813l584.773974 0C865.533534 474.570813 874.690416 483.727695 874.690416 495.024777z"></path>
                        </svg>
                        <span>Back</span>
                    </button>
                    <p className="title" style={{ marginTop: '20px' }}>
                        {mode === 'signup' ? 'Create your account' : 'Welcome back'}
                        <span>Choose how you want to continue</span>
                    </p>
                    <div className="choice-buttons">
                        <button className="choice-btn login-active" onClick={() => { setMode('login'); setView('form'); }}>
                            Login to account
                        </button>
                        <button className="choice-btn signup-btn" onClick={() => { setMode('signup'); setView('form'); }}>
                            Sign up fresh
                        </button>
                    </div>
                    <p className="choice-footer">
                        Secure OTP verification • One-tap Google Login
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="form" style={{ position: 'relative' }}>
                <button
                    type="button"
                    className="back-button"
                    style={{ top: '20px', left: '20px' }}
                    onClick={() => {
                        if (step === 'otp') {
                            setStep('email');
                            setOtp('');
                        } else {
                            navigate('/');
                        }
                        setError('');
                        setSuccess('');
                    }}
                    disabled={loading}
                >
                    <svg height="28" width="28" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1024 1024">
                        <path d="M874.690416 495.024777c0 11.297082-9.156882 20.453964-20.453964 20.453964l-584.773974 0 270.524105 270.524105c8.007959 8.007959 8.007959 20.941926 0 28.949885-8.007959 8.007959-20.941926 8.007959-28.949885 0L201.701925 510.432085l0 0C193.693966 502.424126 193.693966 489.490159 201.701925 481.4822l309.334768-309.334768c8.007959-8.007959 20.941926-8.007959 28.949885 0 8.007959 8.007959 8.007959 20.941926 0 28.949885L269.46248 474.570813l584.773974 0C865.533534 474.570813 874.690416 483.727695 874.690416 495.024777z"></path>
                    </svg>
                    <span>Back</span>
                </button>

                <p className="title" style={{ marginTop: '20px' }}>
                    {mode === 'signup' ? 'Create profile' : 'Login to profile'}
                    <span>{mode === 'signup' ? 'Join the artist community' : 'Manage your digital identity'}</span>
                </p>

                <form onSubmit={step === 'email' ? handleSendOtp : handleVerifyOtp}>
                    {step === 'email' ? (
                        <>
                            <input
                                className="input"
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />

                            <button className="button-confirm" type="submit" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Magic Code'}
                            </button>

                            <div className="login-with">
                                <p>Or log in with</p>
                                <button
                                    type="button"
                                    className="button-log"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <svg viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <input
                                className="input"
                                type="text"
                                placeholder="Verification Code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                disabled={loading}
                                maxLength={6}
                                required
                            />

                            <button className="button-confirm" type="submit" disabled={loading || otp.length !== 6}>
                                {loading ? 'Verifying...' : 'Verify →'}
                            </button>
                        </>
                    )}

                    {error && (
                        <div className="error-msg">
                            {error}{' '}
                            {showSignupLink && (
                                <button
                                    type="button"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        margin: 0,
                                        color: '#2d8cf0',
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        fontSize: 'inherit',
                                        fontWeight: '700',
                                        display: 'inline'
                                    }}
                                    onClick={() => {
                                        setMode('signup');
                                        setView('form');
                                        setError('');
                                        setShowSignupLink(false);
                                    }}
                                >
                                    Sign Up
                                </button>
                            )}
                        </div>
                    )}
                    {success && <p className="success-msg">{success}</p>}
                </form>
            </div>
        </div>
    );
}

export default Login;

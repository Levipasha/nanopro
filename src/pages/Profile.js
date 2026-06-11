import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, auth, getGoogleRedirectResult, logout } from '../firebase';
import { landingArtistAPI, generalProfileAPI } from '../services/api';
import { getIdToken } from '../firebase';
import ProfileChoiceScreen from '../components/profile/ProfileChoiceScreen';
import ProfileArtistController from './ProfileArtistController';
import ProfileGeneralController from './ProfileGeneralController';
import ProfileRestaurantController from './ProfileRestaurantController';
import {
  PROFILE_MODE_KEY,
  PROFILE_LOCK_KEY,
  GENERAL_FLOW_MODE_KEY,
  RESTAURANT_STORAGE_KEY,
  RESTAURANT_ONBOARDING_KEY,
  PROFILE_PREF_BY_EMAIL_KEY,
  getStoredValue,
  setStoredValue,
  removeStoredValue
} from './ProfileHelpers';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profileMode, setProfileMode] = useState('choice');
  const [profileLock, setProfileLock] = useState(null);
  const [choiceSource, setChoiceSource] = useState('automatic');
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    try {
      return window.matchMedia('(max-width: 768px)').matches;
    } catch (e) {
      return false;
    }
  });

  const [myArtists, setMyArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [artistListReady, setArtistListReady] = useState(false);

  const [generalProfile, setGeneralProfile] = useState(null);
  const [generalProfileLoading, setGeneralProfileLoading] = useState(true);
  const [restaurantProfile, setRestaurantProfile] = useState(null);

  const getPrefByEmail = (email) => {
    try {
      const raw = localStorage.getItem(PROFILE_PREF_BY_EMAIL_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed[email] || null;
    } catch (e) { return null; }
  };

  const setPrefByEmail = (email, mode) => {
    try {
      const raw = localStorage.getItem(PROFILE_PREF_BY_EMAIL_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[email] = mode;
      localStorage.setItem(PROFILE_PREF_BY_EMAIL_KEY, JSON.stringify(parsed));
    } catch (e) {}
  };

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getGoogleRedirectResult();
        if (result?.user) setUser(result.user);
      } catch (err) {
        console.error('Redirect error:', err);
      }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobileViewport(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, []);

  const handleSelectArtistMode = useCallback(() => {
    setProfileMode('artist');
    setChoiceSource('manual');
    if (!profileLock) {
      setProfileLock('artist');
      setStoredValue(user, PROFILE_LOCK_KEY, 'artist');
    }
    setStoredValue(user, PROFILE_MODE_KEY, 'artist');
  }, [profileLock, user]);

  const handleSelectGeneralMode = useCallback(() => {
    setProfileMode('general');
    setChoiceSource('manual');
    if (!profileLock) {
      setProfileLock('general_restaurant');
      setStoredValue(user, PROFILE_LOCK_KEY, 'general_restaurant');
    }
    setStoredValue(user, GENERAL_FLOW_MODE_KEY, 'general');
    setStoredValue(user, PROFILE_MODE_KEY, 'general');
    if (user?.email) setPrefByEmail(user.email, 'general');
  }, [profileLock, user]);

  const handleSelectRestaurantMode = useCallback(() => {
    setProfileMode('restaurant');
    setChoiceSource('manual');
    if (!profileLock) {
      setProfileLock('general_restaurant');
      setStoredValue(user, PROFILE_LOCK_KEY, 'general_restaurant');
    }
    setStoredValue(user, GENERAL_FLOW_MODE_KEY, 'restaurant');
    setStoredValue(user, PROFILE_MODE_KEY, 'restaurant');
    if (user?.email) setPrefByEmail(user.email, 'restaurant');
  }, [profileLock, user]);

  const handleLogout = async () => {
    try {
      if (user?.email) {
        setPrefByEmail(user.email, profileMode);
      }
      try {
        localStorage.removeItem(PROFILE_LOCK_KEY);
        localStorage.removeItem(PROFILE_MODE_KEY);
        localStorage.removeItem(GENERAL_FLOW_MODE_KEY);
        localStorage.removeItem(RESTAURANT_STORAGE_KEY);
        localStorage.removeItem(RESTAURANT_ONBOARDING_KEY);
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('general_step');
        localStorage.removeItem('landing_otp_auth');

        removeStoredValue(user, PROFILE_LOCK_KEY);
        removeStoredValue(user, PROFILE_MODE_KEY);
        removeStoredValue(user, GENERAL_FLOW_MODE_KEY);
        removeStoredValue(user, RESTAURANT_STORAGE_KEY);
        removeStoredValue(user, RESTAURANT_ONBOARDING_KEY);
        removeStoredValue(user, 'onboarding_step');
        removeStoredValue(user, 'general_step');
        removeStoredValue(user, 'landing_otp_auth');
      } catch (e) {
        console.error('Error clearing localStorage on logout:', e);
      }
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getFirebaseUser = useCallback(
    () => (user ? { uid: user.uid, email: user.email || null } : null),
    [user]
  );

  const loadMyProfiles = useCallback(async () => {
    if (!user) return;
    setArtistsLoading(true);
    try {
      const res = await landingArtistAPI.getMyProfiles(() => getIdToken(), getFirebaseUser);
      setMyArtists(res.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.warn('Artist profiles load:', err.message);
      setMyArtists([]);
    } finally {
      setArtistsLoading(false);
      setArtistListReady(true);
    }
  }, [user, getFirebaseUser]);

  const loadGeneralProfile = useCallback(async () => {
    if (!user) return;
    const getIdTokenFn = () => getIdToken();
    const getFirebaseUserFn = getFirebaseUser;
    setGeneralProfileLoading(true);
    try {
      if (profileMode === 'choice') {
        const resRestaurant = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'restaurant');
        if (resRestaurant?.data) {
          setGeneralProfile(resRestaurant.data);
          setRestaurantProfile(resRestaurant.data);
          return;
        }

        const resGeneral = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'general');
        if (resGeneral?.data) {
          setGeneralProfile(resGeneral.data);
          return;
        }
      } else {
        const requestedType = profileMode === 'restaurant' ? 'restaurant' : 'general';
        const res = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, requestedType);
        if (res?.data) {
          setGeneralProfile(res.data);
          if (requestedType === 'restaurant') setRestaurantProfile(res.data);
        }
      }
    } catch (err) {
      console.warn('General profile load:', err.message);
    } finally {
      setGeneralProfileLoading(false);
    }
  }, [user, getFirebaseUser, profileMode]);

  useEffect(() => {
    if (user) {
      loadMyProfiles();
      loadGeneralProfile();
    }
  }, [user, loadMyProfiles, loadGeneralProfile]);

  useLayoutEffect(() => {
    const uid = user?.uid || null;
    if (!uid) {
      setMyArtists([]);
      setGeneralProfile(null);
      setRestaurantProfile(null);
      setArtistListReady(false);
      return;
    }

    const email = user?.email;
    const prefMode = email ? getPrefByEmail(email) : null;
    const lock = getStoredValue(user, PROFILE_LOCK_KEY);
    const hasRestaurantLocal = !!getStoredValue(user, RESTAURANT_STORAGE_KEY);

    if (lock === 'general_restaurant' && hasRestaurantLocal && (!prefMode || prefMode === 'general' || prefMode === 'restaurant')) {
      setProfileLock('general_restaurant');
      setProfileMode('restaurant');
      setChoiceSource('automatic');
      return;
    }

    if (lock) {
      setProfileLock(lock);
      if (lock === 'artist') setProfileMode('artist');
      else if (lock === 'general_restaurant') {
        const flow = getStoredValue(user, GENERAL_FLOW_MODE_KEY, null);
        if (flow) {
          setProfileMode(flow);
        } else {
          setProfileMode('choice');
        }
      }
      setChoiceSource('automatic');
    } else {
      setProfileMode('choice');
      setProfileLock(null);
      setChoiceSource('automatic');
    }
  }, [user]);

  useEffect(() => {
    if (artistsLoading || generalProfileLoading || !user) return;

    const hasSetupArtist = myArtists.length > 0 && (myArtists[0].isSetup === true || String(myArtists[0].isSetup) === 'true');
    const hasGeneral = !!generalProfile;

    // If the user has no profiles on the backend, but we loaded a lock automatically from local storage,
    // it means it's a lingering lock (e.g. from a deleted account). Reset to choice screen.
    if (!hasSetupArtist && !hasGeneral && choiceSource === 'automatic') {
      if (profileMode !== 'choice') {
        setProfileMode('choice');
        setProfileLock(null);
        try {
          localStorage.removeItem(PROFILE_LOCK_KEY);
          localStorage.removeItem(PROFILE_MODE_KEY);

          removeStoredValue(user, PROFILE_LOCK_KEY);
          removeStoredValue(user, PROFILE_MODE_KEY);
          removeStoredValue(user, GENERAL_FLOW_MODE_KEY);
          removeStoredValue(user, RESTAURANT_STORAGE_KEY);
          removeStoredValue(user, RESTAURANT_ONBOARDING_KEY);
          removeStoredValue(user, 'onboarding_step');
          removeStoredValue(user, 'general_step');
          removeStoredValue(user, 'landing_otp_auth');

          if (user?.email) {
            const raw = localStorage.getItem(PROFILE_PREF_BY_EMAIL_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              delete parsed[user.email];
              localStorage.setItem(PROFILE_PREF_BY_EMAIL_KEY, JSON.stringify(parsed));
            }
          }
        } catch (e) {}
      }
      return;
    }

    if (!hasSetupArtist && !hasGeneral && profileMode === 'choice') {
      if (profileLock) setProfileLock(null);
      return;
    }

    if (profileMode === 'choice') {
      if (choiceSource === 'manual') return;
      const lock = profileLock;
      if (lock === 'artist') {
        handleSelectArtistMode();
        return;
      }
      if (lock === 'general_restaurant') {
        const preferredGeneralMode = getStoredValue(user, GENERAL_FLOW_MODE_KEY) || 'general';
        const likelyRestaurant = generalProfile?.profileType === 'restaurant' || !!(generalProfile?.menuPdf && String(generalProfile.menuPdf).trim());
        if (restaurantProfile || preferredGeneralMode === 'restaurant' || likelyRestaurant) {
          handleSelectRestaurantMode();
        } else if (hasGeneral) {
          handleSelectGeneralMode();
        }
        return;
      }

      if (!lock && hasSetupArtist && !hasGeneral) {
        handleSelectArtistMode();
        return;
      }

      if (!lock && hasGeneral) {
        const likelyRestaurant = generalProfile?.profileType === 'restaurant' || !!(generalProfile?.menuPdf && String(generalProfile.menuPdf).trim());
        if (likelyRestaurant) {
          handleSelectRestaurantMode();
        } else {
          handleSelectGeneralMode();
        }
        return;
      }

      if (hasSetupArtist && !hasGeneral) {
        handleSelectArtistMode();
      } else if (hasGeneral && !hasSetupArtist) {
        const likelyRestaurant = generalProfile?.profileType === 'restaurant' || !!(generalProfile?.menuPdf && String(generalProfile.menuPdf).trim());
        if (likelyRestaurant) {
          handleSelectRestaurantMode();
        } else {
          handleSelectGeneralMode();
        }
      }
    }
  }, [artistsLoading, generalProfileLoading, myArtists, generalProfile, restaurantProfile, profileLock, profileMode, user, handleSelectArtistMode, handleSelectGeneralMode, handleSelectRestaurantMode]);

  const displayName = user?.displayName || user?.email || 'Profile';
  const displayEmail = user?.email || '';

  const getSkeletonUI = (mode, isMobile) => {
    const headerTitle = mode === 'artist' ? 'Artist Editor' : mode === 'restaurant' ? 'Restaurant Editor' : 'General Editor';
    const desktopTitle = mode === 'artist' ? 'Artist Profile' : mode === 'restaurant' ? 'Restaurant Profile' : 'General Profile';

    if (mode === 'choice') {
      // Neutral brand loading splash screen while checking profile existence
      return (
        <div style={{ 
          background: '#F7F3EE', 
          height: '100vh', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontFamily: "'Syne', sans-serif", 
          color: '#0A0A0A' 
        }}>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.8; }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .nano-pulse {
              animation: pulse 2s ease-in-out infinite;
            }
            .nano-spinner {
              width: 32px;
              height: 32px;
              border: 3px solid rgba(200, 0, 26, 0.1);
              border-top-color: #C8001A;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
          `}</style>
          
          <div className="nano-pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '20px', letterSpacing: '6px', fontWeight: 700, color: '#9A9490' }}>
              <b style={{ color: '#C8001A' }}>NANO</b>PROFILES
            </div>
            <div className="nano-spinner" />
          </div>
        </div>
      );
    }

    if (isMobile) {
      return (
        <div style={{ background: '#ffffff', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            height: '60px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{headerTitle}</h1>
          </header>
          <div style={{ flex: 1, overflowY: 'auto', background: '#F7F3EE', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#F7F3EE', overflowY: 'auto', fontFamily: "'Syne', sans-serif", color: '#0A0A0A' }}>
              <style>{`
                @keyframes skshimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
                .skb { background: linear-gradient(90deg,#EDE8E2 25%,#F7F3EE 50%,#EDE8E2 75%); background-size: 600px 100%; animation: skshimmer 1.4s ease-in-out infinite; border-radius: 4px; }
                .skb-red { background: linear-gradient(90deg,#C8001A 25%,#ff4d66 50%,#C8001A 75%); background-size: 600px 100%; animation: skshimmer 1.4s ease-in-out infinite; border-radius: 4px; }
              `}</style>
              
              {/* Topbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                height: '56px',
                background: 'rgba(247,243,238,0.88)',
                backdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(10,10,10,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 100
              }}>
                <div style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: 700, color: '#9A9490' }}>
                  <b style={{ color: '#C8001A' }}>NANO</b>PROFILES
                </div>
                <div style={{ fontSize: '11px', fontFamily: "monospace", color: '#9A9490', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C8001A' }}></span>
                  @profile
                </div>
              </div>

              {/* Main Content (Hero) */}
              <div style={{ padding: '80px 24px 40px', position: 'relative', borderLeft: '4px solid #C8001A', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="skb" style={{ width: 110, height: 28 }} />
                  <div className="skb" style={{ width: 80, height: 16 }} />
                </div>
                <div className="skb" style={{ width: '100%', aspectRatio: '1/1', maxHeight: '380px', borderRadius: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px 0' }}>
                  <div className="skb-red" style={{ width: 120, height: 12 }} />
                  <div className="skb" style={{ width: '80%', height: 48 }} />
                  <div className="skb" style={{ width: '60%', height: 48 }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div className="skb" style={{ width: 90, height: 32, borderRadius: 0 }} />
                  <div className="skb" style={{ width: 110, height: 32, borderRadius: 0 }} />
                  <div className="skb" style={{ width: 80, height: 32, borderRadius: 0 }} />
                </div>
              </div>

              {/* Section 01: About */}
              <div style={{ padding: '40px 24px', borderTop: '1px solid rgba(10,10,10,0.1)', borderLeft: '4px solid #C8001A', background: '#0A0A0A', color: '#F7F3EE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div className="skb-red" style={{ width: 32, height: 20 }} />
                  <div className="skb" style={{ width: 80, height: 12 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="skb" style={{ width: '90%', height: 20 }} />
                  <div className="skb" style={{ width: '85%', height: 16 }} />
                  <div className="skb" style={{ width: '70%', height: 16 }} />
                </div>
              </div>

              {/* Section 02: Connect */}
              <div style={{ padding: '40px 24px', borderTop: '1px solid rgba(10,10,10,0.1)', borderLeft: '4px solid #C8001A', background: '#111' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div className="skb-red" style={{ width: 32, height: 20 }} />
                  <div className="skb" style={{ width: 80, height: 12 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skb" style={{ width: '100%', height: 68, borderRadius: 16 }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2.5rem',
            height: '72px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{desktopTitle}</h1>
            </div>
          </header>
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <div style={{ width: '400px', flexShrink: 0, background: '#ffffff', borderRight: '1px solid #e2e8f0', position: 'relative', overflowY: 'auto' }}>
              <div style={{ position: 'absolute', inset: 0, background: '#F7F3EE', overflowY: 'auto', fontFamily: "'Syne', sans-serif", color: '#0A0A0A' }}>
                <style>{`
                  @keyframes skshimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
                  .skb { background: linear-gradient(90deg,#EDE8E2 25%,#F7F3EE 50%,#EDE8E2 75%); background-size: 600px 100%; animation: skshimmer 1.4s ease-in-out infinite; border-radius: 4px; }
                  .skb-red { background: linear-gradient(90deg,#C8001A 25%,#ff4d66 50%,#C8001A 75%); background-size: 600px 100%; animation: skshimmer 1.4s ease-in-out infinite; border-radius: 4px; }
                `}</style>
                
                {/* Topbar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 20px',
                  height: '56px',
                  background: 'rgba(247,243,238,0.88)',
                  backdropFilter: 'blur(24px)',
                  borderBottom: '1px solid rgba(10,10,10,0.1)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 100
                }}>
                  <div style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: 700, color: '#9A9490' }}>
                    <b style={{ color: '#C8001A' }}>NANO</b>PROFILES
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: "monospace", color: '#9A9490', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C8001A' }}></span>
                    @profile
                  </div>
                </div>

                {/* Main Content (Hero) */}
                <div style={{ padding: '80px 24px 40px', position: 'relative', borderLeft: '4px solid #C8001A', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skb" style={{ width: 110, height: 28 }} />
                    <div className="skb" style={{ width: 80, height: 16 }} />
                  </div>
                  <div className="skb" style={{ width: '100%', aspectRatio: '1/1', maxHeight: '380px', borderRadius: 2 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px 0' }}>
                    <div className="skb-red" style={{ width: 120, height: 12 }} />
                    <div className="skb" style={{ width: '80%', height: 48 }} />
                    <div className="skb" style={{ width: '60%', height: 48 }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div className="skb" style={{ width: 90, height: 32, borderRadius: 0 }} />
                    <div className="skb" style={{ width: 110, height: 32, borderRadius: 0 }} />
                    <div className="skb" style={{ width: 80, height: 32, borderRadius: 0 }} />
                  </div>
                </div>

                {/* Section 01: About */}
                <div style={{ padding: '40px 24px', borderTop: '1px solid rgba(10,10,10,0.1)', borderLeft: '4px solid #C8001A', background: '#0A0A0A', color: '#F7F3EE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div className="skb-red" style={{ width: 32, height: 20 }} />
                    <div className="skb" style={{ width: 80, height: 12 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="skb" style={{ width: '90%', height: 20 }} />
                    <div className="skb" style={{ width: '85%', height: 16 }} />
                    <div className="skb" style={{ width: '70%', height: 16 }} />
                  </div>
                </div>

                {/* Section 02: Connect */}
                <div style={{ padding: '40px 24px', borderTop: '1px solid rgba(10,10,10,0.1)', borderLeft: '4px solid #C8001A', background: '#111' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div className="skb-red" style={{ width: 32, height: 20 }} />
                    <div className="skb" style={{ width: 80, height: 12 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skb" style={{ width: '100%', height: 68, borderRadius: 16 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, padding: '3.5rem 3rem', background: '#ffffff', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <style>{`
                  .skb-panel { background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%); background-size: 600px 100%; animation: skshimmer 1.4s ease-in-out infinite; border-radius: 6px; }
                `}</style>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="skb-panel" style={{ width: '40%', height: 20 }} />
                  <div className="skb-panel" style={{ width: '85%', height: 14 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return getSkeletonUI(profileMode, isMobileViewport);
  }

  if (user && (artistsLoading || generalProfileLoading)) {
    return getSkeletonUI(profileMode, isMobileViewport);
  }

  if (user && profileMode === 'choice') {
    return (
      <ProfileChoiceScreen
        displayName={displayName}
        displayEmail={displayEmail}
        profileLock={profileLock}
        choiceSource={choiceSource}
        generalProfile={generalProfile}
        restaurantProfile={restaurantProfile}
        handleSelectArtistMode={handleSelectArtistMode}
        handleSelectGeneralMode={handleSelectGeneralMode}
        handleSelectRestaurantMode={handleSelectRestaurantMode}
      />
    );
  }

  if (user) {
    const controllerProps = {
      user,
      handleLogout,
      isMobileViewport,
      frontendBase: window.location.origin,
      setProfileMode,
      setProfileLock,
      setChoiceSource
    };

    if (profileMode === 'artist') {
      return <ProfileArtistController {...controllerProps} />;
    }
    if (profileMode === 'general') {
      return <ProfileGeneralController {...controllerProps} />;
    }
    if (profileMode === 'restaurant') {
      return <ProfileRestaurantController {...controllerProps} />;
    }
  }

  return getSkeletonUI(profileMode, isMobileViewport);
}

import React, { useState, useEffect, useCallback } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { signInWithGoogle, onAuthStateChanged, auth, logout, getGoogleRedirectResult, getIdToken } from '../firebase';
import { landingArtistAPI } from '../services/api';
import './Profile.css';

const defaultForm = {
  name: '',
  bio: '',
  specialization: '',
  photo: '',
  backgroundPhoto: '',
  email: '',
  phone: '',
  website: '',
  instagram: '',
  facebook: '',
  twitter: '',
  linkedin: '',
  whatsapp: '',
  gallery: [],
  instagramName: '',
  instagramCategory: '',
  instagramPosts: '',
  instagramFollowers: '',
  instagramFollowing: '',
  instagramAccountBio: '',
  artworkCount: '',
  profileTheme: 'mono'
};

const OTP_STORAGE_KEY = 'landing_otp_auth';

function Profile() {
  const [user, setUser] = useState(null);
  const [otpUser, setOtpUser] = useState(() => {
    try {
      const raw = localStorage.getItem(OTP_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.email && data?.token) return { email: data.email, token: data.token };
      }
    } catch (e) {}
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myArtists, setMyArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [newGalleryFile, setNewGalleryFile] = useState(null);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState('idle');
  const [otpSendLoading, setOtpSendLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);

  const isLoggedIn = !!(user || otpUser);
  const getFirebaseUser = useCallback(
    () => (user ? { uid: user.uid, email: user.email || null } : null),
    [user]
  );

  const loadMyProfiles = useCallback(async () => {
    if (user) {
      setArtistsLoading(true);
      setError('');
      try {
        const res = await landingArtistAPI.getMyProfiles(() => getIdToken(), getFirebaseUser);
        setMyArtists(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load your artist profiles.');
      } finally {
        setArtistsLoading(false);
      }
    } else if (otpUser) {
      setArtistsLoading(true);
      setError('');
      try {
        const res = await landingArtistAPI.getMyProfilesWithOtpToken(otpUser.token);
        setMyArtists(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load your artist profiles.');
        if (err.message && (err.message.includes('expired') || err.message.includes('Invalid'))) {
          setOtpUser(null);
          localStorage.removeItem(OTP_STORAGE_KEY);
        }
      } finally {
        setArtistsLoading(false);
      }
    }
  }, [user, otpUser, getFirebaseUser]);

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
    if (user || otpUser) loadMyProfiles();
  }, [user, otpUser, loadMyProfiles]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const email = otpEmail.trim();
    if (!email) {
      setError('Please enter your profile email.');
      return;
    }
    setError('');
    setOtpSendLoading(true);
    try {
      await landingArtistAPI.sendOtp(email);
      setOtpStep('sent');
      setOtpCode('');
    } catch (err) {
      setError(err.message || 'Failed to send code.');
    } finally {
      setOtpSendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const email = otpEmail.trim();
    const code = otpCode.trim();
    if (!email || !code) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setOtpVerifyLoading(true);
    try {
      const data = await landingArtistAPI.verifyOtp(email, code);
      const auth = { email: data.email, token: data.token };
      setOtpUser(auth);
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(auth));
      setOtpStep('verified');
      setOtpEmail('');
      setOtpCode('');
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  const handleLogout = () => {
    if (user) logout();
    setOtpUser(null);
    localStorage.removeItem(OTP_STORAGE_KEY);
    setMyArtists([]);
    setEditingArtist(null);
  };

  const openEdit = (artist) => {
    setEditingArtist(artist);
    const gallery = Array.isArray(artist.gallery) ? artist.gallery : [];
    setFormData({
      name: artist.name || '',
      bio: artist.bio || '',
      specialization: artist.specialization || '',
      photo: artist.photo || '',
      backgroundPhoto: artist.backgroundPhoto || '',
      email: artist.email || '',
      phone: artist.phone || '',
      website: artist.website || '',
      instagram: artist.instagram || '',
      facebook: artist.facebook || '',
      twitter: artist.twitter || '',
      linkedin: artist.linkedin || '',
      whatsapp: artist.whatsapp || '',
      gallery: gallery.map((g) => (typeof g === 'string' ? { url: g, name: '' } : { url: g.url || '', name: g.name || '' })),
      instagramName: artist.instagramName || '',
      instagramCategory: artist.instagramCategory || '',
      instagramPosts: artist.instagramPosts || '',
      instagramFollowers: artist.instagramFollowers || '',
      instagramFollowing: artist.instagramFollowing || '',
      instagramAccountBio: artist.instagramAccountBio || '',
      artworkCount: artist.artworkCount != null ? artist.artworkCount : '',
      profileTheme: artist.profileTheme || 'mono'
    });
    setPhotoFile(null);
    setBgFile(null);
    setNewGalleryFile(null);
    setNewGalleryName('');
  };

  const closeEdit = () => {
    setEditingArtist(null);
    setFormData(defaultForm);
    setPhotoFile(null);
    setBgFile(null);
    setNewGalleryFile(null);
    setNewGalleryName('');
  };

  const removeGalleryItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const addGalleryItem = async () => {
    if (!newGalleryFile) return;
    setGalleryUploading(true);
    try {
      const tokenForUpload = otpUser ? otpUser.token : (await getIdToken());
      const up = await landingArtistAPI.uploadPhoto(newGalleryFile, tokenForUpload);
      const url = up && up.url ? up.url : null;
      if (url) {
        setFormData((prev) => ({
          ...prev,
          gallery: [...prev.gallery, { url, name: newGalleryName.trim() || 'Slide' }]
        }));
        setNewGalleryFile(null);
        setNewGalleryName('');
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setGalleryUploading(false);
    }
  };

  const setGalleryItemName = (index, name) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.map((item, i) => (i === index ? { ...item, name } : item))
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingArtist) return;
    setSaving(true);
    setError('');
    try {
      const tokenForUpload = otpUser ? otpUser.token : (await getIdToken());
      let photoUrl = formData.photo;
      let bgUrl = formData.backgroundPhoto;
      if (photoFile) {
        const up = await landingArtistAPI.uploadPhoto(photoFile, tokenForUpload);
        photoUrl = (up && up.url) ? up.url : photoUrl;
      }
      if (bgFile) {
        const up = await landingArtistAPI.uploadPhoto(bgFile, tokenForUpload);
        bgUrl = (up && up.url) ? up.url : bgUrl;
      }
      const payload = {
        ...formData,
        photo: photoUrl,
        backgroundPhoto: bgUrl,
        artworkCount: formData.artworkCount === '' ? undefined : Number(formData.artworkCount)
      };
      if (otpUser) {
        await landingArtistAPI.updateMyProfileWithOtpToken(editingArtist.artistId || editingArtist._id, payload, otpUser.token);
      } else {
        await landingArtistAPI.updateMyProfile(
          editingArtist.artistId || editingArtist._id,
          payload,
          () => getIdToken(),
          getFirebaseUser
        );
      }
      await loadMyProfiles();
      closeEdit();
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page profile-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="profile-page profile-login-wrap">
        <div className="profile-login-card">
          <div className="profile-login-header">
            <div className="profile-icon">
              <DotLottieReact
                src="https://lottie.host/487284a2-1c84-44ff-a757-a3a02b9bd91f/hin5ajk5f6.lottie"
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <h1>Profile</h1>
            <p>Sign in with Google or verify with your profile email to access and edit your artist profiles</p>
          </div>
          <div className="profile-social-section">
            <button type="button" onClick={handleGoogleLogin} className="profile-google-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="profile-otp-divider">
              <span>Or verify with your profile email</span>
            </div>

            {otpStep !== 'sent' ? (
              <form onSubmit={handleSendOtp} className="profile-otp-form">
                <input
                  type="email"
                  placeholder="Email on your artist profile"
                  value={otpEmail}
                  onChange={(e) => { setOtpEmail(e.target.value); setError(''); }}
                  className="profile-otp-input"
                  disabled={otpSendLoading}
                  autoComplete="email"
                />
                <button type="submit" className="profile-otp-btn" disabled={otpSendLoading}>
                  {otpSendLoading ? 'Sending…' : 'Send verification code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="profile-otp-form">
                <p className="profile-otp-sent-msg">We sent a 6-digit code to <strong>{otpEmail}</strong>. Enter it below.</p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                  className="profile-otp-input profile-otp-code-input"
                  disabled={otpVerifyLoading}
                  autoComplete="one-time-code"
                />
                <button type="submit" className="profile-otp-btn" disabled={otpVerifyLoading || otpCode.length !== 6}>
                  {otpVerifyLoading ? 'Verifying…' : 'Verify and continue'}
                </button>
                <button
                  type="button"
                  className="profile-otp-back"
                  onClick={() => { setOtpStep('idle'); setOtpCode(''); setError(''); }}
                >
                  Use a different email
                </button>
              </form>
            )}

            {error && <div className="profile-error-msg">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  const displayName = user?.displayName || user?.email || otpUser?.email || 'Profile';
  const displayEmail = user?.email || otpUser?.email || '';
  const avatarLetter = user?.displayName?.charAt(0) || user?.email?.charAt(0) || otpUser?.email?.charAt(0) || '?';

  return (
    <div className="profile-page profile-view-wrap">
      <div className="profile-view-card profile-view-card-wide">
        <div className="profile-view-header">
          <div className="profile-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} />
            ) : (
              <span>{avatarLetter}</span>
            )}
          </div>
          <h1>{displayName}</h1>
          <p className="profile-email">{displayEmail}</p>
          <button type="button" onClick={handleLogout} className="profile-logout-btn">
            Sign out
          </button>
        </div>

        <div className="profile-view-body">
          <h2 className="profile-section-title">My artist profiles</h2>
          <p className="profile-section-desc">Edit only your artist profiles here. Student profiles are managed by your school.</p>
          {error && <div className="profile-error-msg">{error}</div>}
          {artistsLoading ? (
            <p className="profile-loading-text">Loading your artist profiles…</p>
          ) : myArtists.length === 0 ? (
            <p className="profile-empty">You have no artist profiles linked to this Google account yet. Set up your NFC artist tag from the artist app and link it with this email to edit it here.</p>
          ) : (
            <ul className="profile-artist-list">
              {myArtists.map((artist) => (
                <li key={artist._id || artist.artistId} className="profile-artist-item">
                  <div className="profile-artist-avatar">
                    {artist.photo ? (
                      <img src={artist.photo} alt="" />
                    ) : (
                      <span>{artist.name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="profile-artist-info">
                    <strong>{artist.name || 'Unnamed'}</strong>
                    <span className="profile-artist-id">{artist.artistId}</span>
                  </div>
                  <div className="profile-artist-actions">
                    <a
                      href={`${process.env.REACT_APP_NFC_FRONTEND_URL || window.location.origin}/artist/${artist.accessToken || artist.artistId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-artist-view"
                    >
                      View
                    </a>
                    <button type="button" onClick={() => openEdit(artist)} className="profile-artist-edit">
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editingArtist && (
        <div className="profile-edit-overlay" onClick={closeEdit}>
          <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-edit-header">
              <h3>Edit artist: {editingArtist.artistId}</h3>
              <button type="button" className="profile-edit-close" onClick={closeEdit} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSave} className="profile-edit-form">
              <div className="profile-edit-body">
                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Basic info</h4>
                  <div className="profile-edit-field">
                    <label>Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Artist name" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Specialization</label>
                    <input name="specialization" value={formData.specialization} onChange={handleInputChange} placeholder="e.g. Visual Artist" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Bio</label>
                    <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} placeholder="Short bio" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Profile theme</label>
                    <div className="theme-choices-row">
                      {[
                        { id: 'mono', label: 'Mono Dark' },
                        { id: 'classic', label: 'Classic Light' },
                        { id: 'neon', label: 'Neon Glow' },
                        { id: 'art', label: 'Art Red/Black' }
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          className={`theme-pill ${formData.profileTheme === theme.id ? 'selected' : ''}`}
                          onClick={() => setFormData((prev) => ({ ...prev, profileTheme: theme.id }))}
                        >
                          <span className="theme-pill-label">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Photos</h4>
                  <div className="profile-edit-field profile-edit-photo-field">
                    <label>Profile photo</label>
                    <div className="profile-edit-photo-box">
                      {(formData.photo && !photoFile) && (
                        <div className="profile-edit-photo-current">
                          <img src={formData.photo} alt="" className="profile-edit-photo-preview" />
                          <span className="profile-edit-photo-caption">Current</span>
                        </div>
                      )}
                      <label className="profile-edit-file-btn">
                        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setPhotoFile(e.target.files[0])} />
                        {photoFile ? 'New image chosen' : 'Choose photo'}
                      </label>
                    </div>
                  </div>
                  <div className="profile-edit-field profile-edit-photo-field">
                    <label>Background photo</label>
                    <div className="profile-edit-photo-box">
                      {(formData.backgroundPhoto && !bgFile) && (
                        <div className="profile-edit-photo-current">
                          <img src={formData.backgroundPhoto} alt="" className="profile-edit-photo-preview profile-edit-bg-preview" />
                          <span className="profile-edit-photo-caption">Current</span>
                        </div>
                      )}
                      <label className="profile-edit-file-btn">
                        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setBgFile(e.target.files[0])} />
                        {bgFile ? 'New image chosen' : 'Choose photo'}
                      </label>
                    </div>
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Contact</h4>
                  <div className="profile-edit-field">
                    <label>Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@example.com" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Phone</label>
                    <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+1 234 567 8900" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Website</label>
                    <input name="website" type="url" value={formData.website} onChange={handleInputChange} placeholder="https://" />
                  </div>
                  <div className="profile-edit-field">
                    <label>WhatsApp</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="With country code" />
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Social links</h4>
                  <div className="profile-edit-field">
                    <label>Instagram</label>
                    <input name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="@handle" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Facebook</label>
                    <input name="facebook" value={formData.facebook} onChange={handleInputChange} />
                  </div>
                  <div className="profile-edit-field">
                    <label>Twitter</label>
                    <input name="twitter" value={formData.twitter} onChange={handleInputChange} placeholder="@handle" />
                  </div>
                  <div className="profile-edit-field">
                    <label>LinkedIn</label>
                    <input name="linkedin" value={formData.linkedin} onChange={handleInputChange} />
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Details</h4>
                  <div className="profile-edit-field">
                    <label>Artwork count</label>
                    <input name="artworkCount" type="number" min={0} value={formData.artworkCount} onChange={handleInputChange} placeholder="0" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Instagram name</label>
                    <input name="instagramName" value={formData.instagramName} onChange={handleInputChange} />
                  </div>
                  <div className="profile-edit-field">
                    <label>Instagram category</label>
                    <input name="instagramCategory" value={formData.instagramCategory} onChange={handleInputChange} />
                  </div>
                  <div className="profile-edit-field profile-edit-field-row">
                    <div className="profile-edit-field">
                      <label>Instagram posts</label>
                      <input name="instagramPosts" value={formData.instagramPosts} onChange={handleInputChange} />
                    </div>
                    <div className="profile-edit-field">
                      <label>Followers</label>
                      <input name="instagramFollowers" value={formData.instagramFollowers} onChange={handleInputChange} />
                    </div>
                    <div className="profile-edit-field">
                      <label>Following</label>
                      <input name="instagramFollowing" value={formData.instagramFollowing} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="profile-edit-field">
                    <label>Instagram bio</label>
                    <textarea name="instagramAccountBio" value={formData.instagramAccountBio} onChange={handleInputChange} rows={2} placeholder="Account bio" />
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Slideshow / Gallery</h4>
                  <div className="profile-edit-gallery-wrap">
                  {formData.gallery.length > 0 && (
                    <ul className="profile-edit-gallery-list">
                      {formData.gallery.map((item, idx) => (
                        <li key={idx} className="profile-edit-gallery-item">
                          <img src={item.url} alt="" className="profile-edit-gallery-thumb" />
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => setGalleryItemName(idx, e.target.value)}
                            placeholder="Title"
                            className="profile-edit-gallery-name"
                          />
                          <button type="button" onClick={() => removeGalleryItem(idx)} className="profile-edit-gallery-remove" aria-label="Remove">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="profile-edit-gallery-add">
                    <input
                      type="text"
                      value={newGalleryName}
                      onChange={(e) => setNewGalleryName(e.target.value)}
                      placeholder="Slide title (optional)"
                      className="profile-edit-gallery-name-in"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && setNewGalleryFile(e.target.files[0])}
                    />
                    <button type="button" onClick={addGalleryItem} disabled={!newGalleryFile || galleryUploading} className="profile-edit-gallery-add-btn">
                      {galleryUploading ? 'Uploading…' : 'Add to slideshow'}
                    </button>
                  </div>
                </div>
                </section>
              </div>
              <div className="profile-edit-footer">
                <button type="button" onClick={closeEdit}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;

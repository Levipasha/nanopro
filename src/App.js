import './App.css';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Profile from './pages/Profile';
import Login from './pages/Login';
import GeneralProfileView from './pages/GeneralProfileView';
import ArtistPublicView from './pages/ArtistPublicView';
import StudentPublicView from './pages/StudentPublicView';
import Home from './pages/Home';
import ArtistShowcase from './pages/ArtistShowcase';
import StudentShowcase from './pages/StudentShowcase';
import RestaurantShowcase from './pages/RestaurantShowcase';
import ArtGalleryPage from './pages/ArtGalleryPage';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading/splash
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500); // 2.5 seconds splash

    return () => clearTimeout(timer);
  }, []);

  const isArtistRoute = window.location.pathname.includes('/artist');
  const splashSrc = isArtistRoute
    ? "https://lottie.host/c1b7e87d-cc8f-44a2-b59a-9f00ec8c540b/n7PRg2j8GX.lottie"
    : "https://lottie.host/6b4bd948-73df-46e5-aa82-fbc42ca9d04a/k5p94sM04J.lottie";

  if (isInitialLoading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a'
      }}>
        <DotLottieReact
          src={splashSrc}
          loop
          autoplay
          style={{ width: isArtistRoute ? 250 : 300, height: isArtistRoute ? 250 : 300 }}
        />
        <p style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '12px',
          color: '#fff',
          marginTop: '2rem',
          letterSpacing: '0.1em',
          opacity: 0.8,
          animation: 'pulse 2s infinite'
        }}>
          nano is here
        </p>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/link/:username" element={<GeneralProfileView />} />
        <Route path="/artist" element={<ArtistPublicView />} />
        <Route path="/student" element={<StudentPublicView />} />
        <Route path="/show-my-art" element={<ArtGalleryPage />} />
        <Route path="/artist-showcase" element={<ArtistShowcase />} />
        <Route path="/student-showcase" element={<StudentShowcase />} />
        <Route path="/restaurant-showcase" element={<RestaurantShowcase />} />

        <Route path="/*" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;


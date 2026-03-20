import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Profile from './pages/Profile';
import Login from './pages/Login';
import GeneralProfileView from './pages/GeneralProfileView';
import ArtistPublicView from './pages/ArtistPublicView';
import Home from './pages/Home';
import ArtistShowcase from './pages/ArtistShowcase';
import StudentShowcase from './pages/StudentShowcase';
import RestaurantShowcase from './pages/RestaurantShowcase';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/link/:username" element={<GeneralProfileView />} />
        <Route path="/artist" element={<ArtistPublicView />} />
        <Route path="/artist-showcase" element={<ArtistShowcase />} />
        <Route path="/student-showcase" element={<StudentShowcase />} />
        <Route path="/restaurant-showcase" element={<RestaurantShowcase />} />
        <Route path="/*" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;


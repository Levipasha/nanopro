import './App.css';
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ShowcaseSkeleton from './components/ShowcaseSkeleton';
// import ResumePage from './pages/ResumePage';

const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const GeneralProfileView = lazy(() => import('./pages/GeneralProfileView'));
const ArtistPublicView = lazy(() => import('./pages/ArtistPublicView'));
const StudentPublicView = lazy(() => import('./pages/StudentPublicView'));
const Home = lazy(() => import('./pages/Home'));
const ArtistShowcase = lazy(() => import('./pages/ArtistShowcase'));
const StudentShowcase = lazy(() => import('./pages/StudentShowcase'));
const RestaurantShowcase = lazy(() => import('./pages/RestaurantShowcase'));
const ProfessionalShowcase = lazy(() => import('./pages/ProfessionalShowcase'));
const ArtGalleryPage = lazy(() => import('./pages/ArtGalleryPage'));
const MasterArtRedirect = lazy(() => import('./pages/MasterArtRedirect'));

function App() {

  return (
    <div>
      <ScrollToTop />
      <Suspense fallback={<ShowcaseSkeleton type="home" />}>
        <Routes>
          <Route path="/profile" element={
            <Suspense fallback={null}>
              <Profile />
            </Suspense>
          } />
          <Route path="/login" element={
            <Suspense fallback={<ShowcaseSkeleton type="login" />}>
              <Login />
            </Suspense>
          } />
          <Route path="/signup" element={
            <Suspense fallback={<ShowcaseSkeleton type="login" />}>
              <Login />
            </Suspense>
          } />
          <Route path="/link/:username" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-general" />}>
              <GeneralProfileView />
            </Suspense>
          } />
          <Route path="/artist/:artistId" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-artist" />}>
              <ArtistPublicView />
            </Suspense>
          } />
          <Route path="/a/:artistId/art" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-artist" />}>
              <MasterArtRedirect />
            </Suspense>
          } />
          <Route path="/student" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-student" />}>
              <StudentPublicView />
            </Suspense>
          } />
          <Route path="/show-my-art" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-artist" />}>
              <ArtGalleryPage />
            </Suspense>
          } />
          <Route path="/artist-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="artist" />}>
              <ArtistShowcase />
            </Suspense>
          } />
          <Route path="/student-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="student" />}>
              <StudentShowcase />
            </Suspense>
          } />
          <Route path="/restaurant-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="restaurant" />}>
              <RestaurantShowcase />
            </Suspense>
          } />
          <Route path="/professional-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="professional" />}>
              <ProfessionalShowcase />
            </Suspense>
          } />
{/* <Route path="/resume" element={<ResumePage />} /> */}

          <Route path="/*" element={
            <Suspense fallback={<ShowcaseSkeleton type="home" />}>
              <Home />
            </Suspense>
          } />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;


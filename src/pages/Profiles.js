import React from 'react';
import { Helmet } from 'react-helmet-async';
import HorizonHeroSection from '../components/ui/HorizonHeroSection';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
import './Profiles.css';

const Profiles = () => {
  const profileTypes = [
    {
      id: 'artist',
      name: 'The Artist',
      desc: 'An immersive digital portfolio for creators, gallery owners, and visionaries. Showcase your craft with premium aesthetics.',
      path: '/artist-showcase',
      color: '#6366f1'
    },
    {
      id: 'student',
      name: 'The Student',
      desc: 'Your academic identity simplified. Connect achievements, club participation, and skills into a professional tapestry.',
      path: '/student-showcase',
      color: '#06b6d4'
    },
    {
      id: 'chef',
      name: 'The Chef',
      desc: 'A culinary digital fingerprint. Seamlessly integrated menus, restaurant stories, and reservation systems.',
      path: '/restaurant-showcase',
      color: '#f59e0b'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Explore All Identities - Nano Profiles</title>
      </Helmet>

      <div className="profiles-page">
        <HomeNavbar />
        
        <HorizonHeroSection profileTypes={profileTypes} />

        <div className="discovery-footer-context">
          <HomeFooter />
        </div>
      </div>
    </>
  );
};

export default Profiles;

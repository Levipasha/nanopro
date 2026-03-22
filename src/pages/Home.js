import React from 'react';
import { Helmet } from 'react-helmet-async';

import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
import HomeHero from '../components/home/HomeHero';
import HomeAbout from '../components/home/HomeAbout';
import HomeTestimonials from '../components/home/HomeTestimonials';
import HomeContact from '../components/home/HomeContact';

export default function Home() {
    return (
        <>
            <Helmet>
                <title>Nano Profiles - Smart Digital Identity Solutions</title>
                <meta name="description" content="NFC digital identity for schools, restaurants, and artists. Tap to get menu and bills, student ID cards, artist portfolios. Contactless and secure. Just tap to trust." />
                <meta property="og:title" content="Nano Profiles - Smart Digital Identity Solutions" />
                <meta property="og:description" content="NFC digital identity for schools, restaurants, and artists. Tap to get menu and bills, student ID cards, artist portfolios. Just tap to trust." />
                <meta property="og:url" content="https://nanoprofiles.com/" />
                <meta name="twitter:title" content="Nano Profiles - Smart Digital Identity Solutions" />
                <meta name="twitter:description" content="NFC digital identity for schools, restaurants, and artists. Tap to get menu and bills, student ID cards, artist portfolios. Just tap to trust." />
            </Helmet>

            <main className="landing-page-container">
                <HomeNavbar />

                <HomeHero />
                <HomeAbout />
                <HomeTestimonials />
                <HomeContact />

                <HomeFooter />
            </main>
        </>
    );
}

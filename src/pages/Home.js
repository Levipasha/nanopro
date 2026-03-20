import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
import HomePopups from '../components/home/HomePopups';
import HomeHero from '../components/home/HomeHero';
import HomeAbout from '../components/home/HomeAbout';
import HomeDigitalId from '../components/home/HomeDigitalId';
import HomeProducts from '../components/home/HomeProducts';
import HomeServices from '../components/home/HomeServices';
import HomeContact from '../components/home/HomeContact';

export default function Home() {
    const [showNfcPopup, setShowNfcPopup] = useState(false);
    const [showDigitalIdPopup, setShowDigitalIdPopup] = useState(false);
    const [showSmartBadgePopup, setShowSmartBadgePopup] = useState(false);
    const [showCustomIntegrationPopup, setShowCustomIntegrationPopup] = useState(false);

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
                <HomeDigitalId />
                <HomeProducts />
                <HomeServices
                    setShowNfcPopup={setShowNfcPopup}
                    setShowDigitalIdPopup={setShowDigitalIdPopup}
                    setShowSmartBadgePopup={setShowSmartBadgePopup}
                    setShowCustomIntegrationPopup={setShowCustomIntegrationPopup}
                />
                <HomeContact />

                <HomeFooter />

                <HomePopups
                    showNfcPopup={showNfcPopup} setShowNfcPopup={setShowNfcPopup}
                    showDigitalIdPopup={showDigitalIdPopup} setShowDigitalIdPopup={setShowDigitalIdPopup}
                    showSmartBadgePopup={showSmartBadgePopup} setShowSmartBadgePopup={setShowSmartBadgePopup}
                    showCustomIntegrationPopup={showCustomIntegrationPopup} setShowCustomIntegrationPopup={setShowCustomIntegrationPopup}
                />
            </main>
        </>
    );
}


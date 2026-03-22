import React from 'react';

export default function HomeFooter() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <div className="footer-brandText">Nano Profiles</div>
                    <p>Smart digital identity solutions with NFC technology</p>
                    <div className="footer-quote">Just tap to trust</div>
                </div>

                <div className="footer-links">
                    <h4>Quick Links</h4>
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#testimonials">Testimonials</a>
                    <a href="#contact">Contact</a>
                </div>

                <div className="footer-contact">
                    <h4>Get In Touch</h4>
                    <p>hello@nanoprofiles.com</p>
                    <p>+91 91214 28210</p>
                </div>

                <div className="footer-social">
                    <h4>Follow Us</h4>
                    <a href="https://instagram.com/nanoprofiles" target="_blank" rel="noreferrer">Instagram</a>
                    <a href="https://wa.me/919121428210" target="_blank" rel="noreferrer">WhatsApp</a>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; 2026 Nano Profiles. All rights reserved. A product of <a href="https://www.skywebdev.xyz" target="_blank" rel="noreferrer">Skyweb IT Solutions Pvt Ltd</a></p>
            </div>
        </footer>
    );
}


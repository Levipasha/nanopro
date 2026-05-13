import React, { useState } from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import { Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import './ResumePage.css';

const ResumePage = () => {
    const [viewMode, setViewMode] = useState('gallery');
    const [activeTemplate, setActiveTemplate] = useState(1);
    const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&h=300&auto=format&fit=crop");

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setProfileImage(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const Template1 = ({ isPreview = false }) => (
        <div className={`resume-container ${isPreview ? 'mini-preview' : ''}`}>
            <aside className="resume-sidebar">
                <div className="profile-photo-wrapper">
                    <img src={profileImage} alt="Profile" className="profile-photo" />
                </div>
                <div className="sidebar-section">
                    <h2 className="sidebar-title">Contact Me</h2>
                    <ul className="contact-list">
                        <li className="contact-item"><MapPin size={14} /><span>123 Anywhere St., Any City</span></li>
                        <li className="contact-item"><Phone size={14} /><span>+123-456-7890</span></li>
                        <li className="contact-item"><Mail size={14} /><span>hello@reallygreatsite.com</span></li>
                    </ul>
                </div>
                <div className="sidebar-section">
                    <h2 className="sidebar-title">My Skills</h2>
                    <ul className="skills-list">
                        <li>Social media marketing</li>
                        <li>Digital marketing</li>
                    </ul>
                </div>
            </aside>
            <main className="resume-main">
                <header className="resume-header">
                    <h1 className="resume-name">MARCELINE ANDERSON</h1>
                    <p className="resume-title">Digital Marketing Manager</p>
                </header>
                <section className="main-section">
                    <h2 className="main-title">Summary</h2>
                    <p className="summary-text">Experience as the leader of various marketing campaigns and developing various online strategies.</p>
                </section>
            </main>
        </div>
    );

    const Template2 = ({ isPreview = false }) => (
        <div className={`t2-container ${isPreview ? 'mini-preview' : ''}`}>
            <div className="t2-frame"></div>
            <header className="t2-header">
                <h1 className="t2-name">
                    <span className="t2-first-name">MARCELINE</span> 
                    <span className="t2-last-name">ANDERSON</span>
                </h1>
                <p className="t2-subtitle">BUSINESS CONSULTANT</p>
            </header>
            <div className="t2-body">
                <aside className="t2-sidebar">
                    <h2 className="t2-sidebar-title">CONTACT</h2>
                    <div className="t2-contact-item">
                        <div className="t2-icon-circle"><Phone size={14} fill="white" /></div>
                        <span>+123-456-7890</span>
                    </div>
                </aside>
                <main className="t2-main">
                    <section className="t2-summary-block">
                        <h2 className="t2-summary-title">SUMMARY</h2>
                        <p className="t2-summary-text">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    </section>
                </main>
            </div>
        </div>
    );

    const Template3 = ({ isPreview = false }) => (
        <div className={`t3-page ${isPreview ? 'mini-preview' : ''}`}>
            <div className="t3-top-bar">
                <div className="t3-name" contentEditable={!isPreview} suppressContentEditableWarning>
                    <div>Kyle J Shanks</div>
                </div>
            </div>
            
            <div className="t3-side-bar">
                <div className="t3-mugshot">
                    <div className="t3-logo">
                        <svg viewBox="0 0 80 80" className="t3-logo-svg">
                            <path d="M 10 10 L 52 10 L 72 30 L 72 70 L 30 70 L 10 50 Z" />
                        </svg>
                        <p className="t3-logo-text" contentEditable={!isPreview} suppressContentEditableWarning>kj</p>
                    </div>
                </div>
                
                <div className="t3-sidebar-text" contentEditable={!isPreview} suppressContentEditableWarning>123 My Place Drive</div>
                <div className="t3-sidebar-text" contentEditable={!isPreview} suppressContentEditableWarning>Astoria, New York 11105</div>
                <div className="t3-sidebar-text" contentEditable={!isPreview} suppressContentEditableWarning>1-800-CALLPLZ</div>
                <div className="t3-sidebar-text" contentEditable={!isPreview} suppressContentEditableWarning>emailsareforsquares@gmail.com</div>
                <br/>
                
                <div className="t3-social t3-twitter" contentEditable={!isPreview} suppressContentEditableWarning>Twitter stuff</div>
                <div className="t3-social t3-pinterest" contentEditable={!isPreview} suppressContentEditableWarning>Pinterest things</div>
                <div className="t3-social t3-linkedin" contentEditable={!isPreview} suppressContentEditableWarning>Linked-in man</div>
                
                <h2 className="t3-side-header" contentEditable={!isPreview} suppressContentEditableWarning>Expertise</h2>
                <div className="t3-list-thing" contentEditable={!isPreview} suppressContentEditableWarning>HTML</div>
                <div className="t3-list-thing" contentEditable={!isPreview} suppressContentEditableWarning>CSS (Stylus)</div>
                <div className="t3-list-thing" contentEditable={!isPreview} suppressContentEditableWarning>JavaScript & jQuery</div>
                
                <h2 className="t3-side-header" contentEditable={!isPreview} suppressContentEditableWarning>Education</h2>
                <div className="t3-list-thing" contentEditable={!isPreview} suppressContentEditableWarning>Advanced potion making</div>
                <div className="t3-list-thing" contentEditable={!isPreview} suppressContentEditableWarning>Degree in popping and locking</div>
            </div>

            <div className="t3-content-container">
                <h2 className="t3-main-title" contentEditable={!isPreview} suppressContentEditableWarning>Jr Front-End Developer</h2>
                <div className="t3-separator"></div>
                
                <div className="t3-greyed" contentEditable={!isPreview} suppressContentEditableWarning>Profile</div>
                <p className="t3-summary" contentEditable={!isPreview} suppressContentEditableWarning>
                    Retro DIY quinoa, mixtape williamsburg master cleanse bushwick tumblr chillwave dreamcatcher hella wolf paleo. Knausgaard semiotics truffaut cornhole hoodie, YOLO meggings gochujang tofu.
                </p>
                
                <div className="t3-greyed" contentEditable={!isPreview} suppressContentEditableWarning>Experience</div>

                <div className="t3-job-item">
                    <h3 className="t3-job-title" contentEditable={!isPreview} suppressContentEditableWarning>Job #1</h3>
                    <p className="t3-job-desc-light" contentEditable={!isPreview} suppressContentEditableWarning>First job description</p>
                    <p className="t3-job-justified" contentEditable={!isPreview} suppressContentEditableWarning>Plaid gentrify put a bird on it, pickled XOXO farm-to-table irony raw denim messenger bag leggings. Hoodie PBR&B photo booth, vegan chillwave meh paleo freegan ramps.</p>
                </div>

                <div className="t3-job-item">
                    <h3 className="t3-job-title" contentEditable={!isPreview} suppressContentEditableWarning>Job #2</h3>
                    <p className="t3-job-desc-light" contentEditable={!isPreview} suppressContentEditableWarning>Second Job Description</p>
                    <p className="t3-job-justified" contentEditable={!isPreview} suppressContentEditableWarning>Beard before they sold out photo booth distillery health goth. Hammock franzen green juice meggings, ethical sriracha tattooed schlitz mixtape man bun stumptown swag whatever distillery blog.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingBottom: '60px' }}>
            <HomeNavbar />
            
            {viewMode === 'gallery' ? (
                <div className="resume-gallery">
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>My Resumes</h1>
                        <p style={{ color: '#94a3b8' }}>Select a template to start editing your professional resume.</p>
                    </div>

                    <div className="gallery-grid">
                        <div className="template-card" onClick={() => { setActiveTemplate(1); setViewMode('edit'); }}>
                            <div className="card-preview-container"><Template1 isPreview={true} /></div>
                            <h3>Green Sage Professional</h3>
                            <button className="view-btn">Customize Template</button>
                        </div>

                        <div className="template-card" onClick={() => { setActiveTemplate(2); setViewMode('edit'); }}>
                            <div className="card-preview-container"><Template2 isPreview={true} /></div>
                            <h3>Salmon Taupe Modern</h3>
                            <button className="view-btn">Customize Template</button>
                        </div>

                        <div className="template-card" onClick={() => { setActiveTemplate(3); setViewMode('edit'); }}>
                            <div className="card-preview-container"><Template3 isPreview={true} /></div>
                            <h3>Jr Developer Classic</h3>
                            <button className="view-btn">Customize Template</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: '40px 20px' }}>
                    <div className="max-w-4xl mx-auto">
                        <div className="back-to-gallery" onClick={() => setViewMode('gallery')}>
                            <ArrowLeft size={20} />
                            Back to My Resumes
                        </div>
                        {activeTemplate === 1 && <Template1 />}
                        {activeTemplate === 2 && <Template2 />}
                        {activeTemplate === 3 && <Template3 />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumePage;

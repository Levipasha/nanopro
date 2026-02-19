import './App.css';
import Particles from './Particles';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import cardsImage from './create images this for my website cards.jpg';
import idCardImage from './Gemini_Generated_Image_5xi8665xi8665xi8.png';
import nanoProfileVideo from './nano profile.mp4';
import digitalIdVideo from './digital id scan and check my info.mp4';
import untitledDesignVideo from './Untitled design.mp4';
import navbarLogo from './Black E-Tech Logo (1) bb.png';
import mm from './mm.png';
import untitledDesignOff from './off.png';
import untitledDesignArtist from './artiest.png';

function App() {
  const galleryRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    alert(`Thank you, ${name}! Your email ${email} and message "${message}" have been sent.`);
    e.target.reset();
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const galleryEl = galleryRef.current;
    if (!galleryEl) return;

    const ctx = gsap.context(() => {
      gsap.to(galleryEl.querySelectorAll('img, video'), { opacity: 1, delay: 0.1 });

      const spacing = 0.1;
      const snap = gsap.utils.snap(spacing);
      const cards = gsap.utils.toArray('.cards li');

      const buildSeamlessLoop = (items, itemSpacing) => {
        const overlap = Math.ceil(1 / itemSpacing);
        const startTime = items.length * itemSpacing + 0.5;
        const loopTime = (items.length + overlap) * itemSpacing + 1;
        const rawSequence = gsap.timeline({ paused: true });
        const loop = gsap.timeline({
          paused: true,
          repeat: -1,
          onRepeat() {
            this._time === this._dur && (this._tTime += this._dur - 0.01);
          }
        });
        const l = items.length + overlap * 2;
        let time = 0;

        gsap.set(items, { xPercent: 400, opacity: 0, scale: 0 });

        for (let i = 0; i < l; i++) {
          const index = i % items.length;
          const item = items[index];
          time = i * itemSpacing;

          rawSequence
            .fromTo(
              item,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                zIndex: 100,
                duration: 0.5,
                yoyo: true,
                repeat: 1,
                ease: 'power1.in',
                immediateRender: false
              },
              time
            )
            .fromTo(
              item,
              { xPercent: 400 },
              { xPercent: -400, duration: 1, ease: 'none', immediateRender: false },
              time
            );

          i <= items.length && loop.add('label' + i, time);
        }

        rawSequence.time(startTime);
        loop
          .to(rawSequence, {
            time: loopTime,
            duration: loopTime - startTime,
            ease: 'none'
          })
          .fromTo(
            rawSequence,
            { time: overlap * itemSpacing + 1 },
            {
              time: startTime,
              duration: startTime - (overlap * itemSpacing + 1),
              immediateRender: false,
              ease: 'none'
            }
          );

        return loop;
      };

      const seamlessLoop = buildSeamlessLoop(cards, spacing);
      const loopDuration = seamlessLoop.duration();
      const scrub = gsap.to(seamlessLoop, {
        totalTime: 0,
        duration: 0.5,
        ease: 'power3',
        paused: true
      });

      const trigger = ScrollTrigger.create({
        start: 'top top',
        end: '+=3000',
        pin: '.gallery',
        onUpdate(self) {
          scrub.vars.totalTime = snap(self.progress * loopDuration);
          scrub.invalidate().restart();
        }
      });

      const scrubTo = totalTime => {
        const wrapped = ((totalTime % loopDuration) + loopDuration) % loopDuration;
        const progress = wrapped / loopDuration;
        trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
      };

      const nextBtn = galleryEl.querySelector('.next');
      const prevBtn = galleryEl.querySelector('.prev');
      const onNext = () => scrubTo(scrub.vars.totalTime + spacing);
      const onPrev = () => scrubTo(scrub.vars.totalTime - spacing);

      nextBtn?.addEventListener('click', onNext);
      prevBtn?.addEventListener('click', onPrev);

      return () => {
        nextBtn?.removeEventListener('click', onNext);
        prevBtn?.removeEventListener('click', onPrev);
        trigger.kill();
        scrub.kill();
        seamlessLoop.kill();
      };
    }, galleryEl);

    // Navbar active states outside context
    const sections = ['#home', '#about', '#products', '#services', '#contact'];

    setTimeout(() => {
      const navLinks = gsap.utils.toArray('.navbar-links a');

      sections.forEach((sectionId, index) => {
        ScrollTrigger.create({
          trigger: sectionId,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => {
            navLinks.forEach(link => link.classList.remove('active'));
            navLinks[index]?.classList.add('active');
          },
          onEnterBack: () => {
            navLinks.forEach(link => link.classList.remove('active'));
            navLinks[index]?.classList.add('active');
          },
          onLeave: () => {
            if (index === sections.length - 1) return; // Don't remove active on last section leave
            navLinks[index]?.classList.remove('active');
          },
          onLeaveBack: () => {
            if (index === 0) return; // Don't remove active on first section leave back
            navLinks[index]?.classList.remove('active');
          }
        });
      });
    }, 100);

    return () => {
      ctx.revert();
      // Kill navbar triggers
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger && sections.includes(trigger.vars.trigger)) {
          trigger.kill();
        }
      });
    };
  }, []);

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-inner">
          <a className="navbar-brand" href="#home">
            <img className="navbar-logo" src={navbarLogo} alt="" />
            <span className="navbar-brandText">Nano Profiles</span>
          </a>
          <div className="navbar-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#products">Products</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </nav>

      <section id="home" className="page-section" style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
          <Particles
            particleColors={["#ffffff"]}
            particleCount={50}
            particleSpread={8}
            speed={0.05}
            particleBaseSize={80}
            moveParticlesOnHover={false}
            alphaParticles={false}
            disableRotation={false}
            pixelRatio={1}
          />
        </div>
        <div className="stuck-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid-item special"><b>Nano Profiles</b></div>
          <div className="grid-item">ID Card</div>
          <div className="grid-item">NFC Technology</div>
          <div className="grid-item">Data Security</div>
          <div className="grid-item">Biometric Access</div>
          <div className="grid-item">Digital Identity</div>
          <div className="grid-item">Smart Authentication</div>
          <div className="grid-item">Encryption</div>
          <div className="grid-item">Secure Storage</div>
          <div className="grid-item">Privacy Protection</div>
          <div className="grid-item">Cloud Sync</div>
          <div className="grid-item">Mobile Access</div>
        </div>
      </section>

      <section className="gallery page-section" ref={galleryRef}>
        <ul className="cards">
          <li><img src={cardsImage} alt="" /></li>
          <li><img src={idCardImage} alt="" /></li>
          <li><img src={cardsImage} alt="" /></li>
          <li>
            <video
              src={nanoProfileVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
          <li>
            <video
              src={digitalIdVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
          <li>
            <video
              src={untitledDesignVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
          <li><img src={idCardImage} alt="" /></li>
          <li><img src={cardsImage} alt="" /></li>
          <li><img src={idCardImage} alt="" /></li>
          <li><img src={cardsImage} alt="" /></li>
          <li><img src={idCardImage} alt="" /></li>
          <li><img src={cardsImage} alt="" /></li>
          <li><img src={idCardImage} alt="" /></li>
        </ul>
        <div className="actions">
          <button className="prev" type="button">Prev</button>
          <button className="next" type="button">Next</button>
        </div>
      </section>

      <section id="about" className="info-section page-section">
        <div className="info-inner">
          <h2>About Us</h2>
          <p>
            We are a professional technology company specializing in NFC-based digital ID cards and smart badges for
            modern businesses. Our solution allows you to simply tap and instantly verify secure digital
            identities—fast, reliable, and contactless. Designed for enterprises, institutions, and large
            organizations, our NFC system replaces traditional ID cards with a smarter, more secure, and efficient
            way to manage identity access and verification.
          </p>
          <p>
            With just one tap, you can check and validate digital profiles in real time, improving security,
            reducing manual work, and enhancing the overall professional experience. We focus on innovation,
            scalability, and enterprise-grade reliability to help businesses move toward a fully digital and
            future-ready identity system.
          </p>
        </div>
      </section>

      <section id="products" className="info-section page-section">
        <div className="info-inner">
          <h2>Our Products</h2>
          <div className="products-grid">
            <div className="product-card">
              <div className="product-card-inner">
                <div className="product-card-front">
                  <div className="product-cover school-cover" style={{backgroundImage: `url(${mm})`}}></div>
                  <h3>School</h3>
                  <p>Digital ID cards for students and staff</p>
                </div>
                <div className="product-card-back">
                  <h3>Why Better?</h3>
                  <p>Instant verification, no physical wear, eco-friendly, integrated with school systems for seamless access.</p>
                </div>
              </div>
            </div>
            <div className="product-card">
              <div className="product-card-inner">
                <div className="product-card-front">
                  <div className="product-cover office-cover" style={{backgroundImage: `url(${untitledDesignOff})`}}></div>
                  <h3>Office</h3>
                  <p>Professional NFC badges for employees</p>
                </div>
                <div className="product-card-back">
                  <h3>Why Better?</h3>
                  <p>Professional look, quick access control, contactless check-in, secure employee data management.</p>
                </div>
              </div>
            </div>
            <div className="product-card">
              <div className="product-card-inner">
                <div className="product-card-front">
                  <div className="product-cover artist-cover" style={{backgroundImage: `url(${untitledDesignArtist})`}}></div>
                  <h3>Artist</h3>
                  <p>Creative portfolios on NFC tags</p>
                </div>
                <div className="product-card-back">
                  <h3>Why Better?</h3>
                  <p>Instant work showcase, secure sharing, portable portfolio, enhanced networking at events.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="info-section page-section">
        <div className="info-inner">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>NFC Profile Cards</h3>
              <p>Tap-to-share profiles with secure data controls and clean design.</p>
            </div>
            <div className="service-card">
              <h3>Digital ID & Verification</h3>
              <p>Identity scanning flows with encryption-ready storage patterns.</p>
            </div>
            <div className="service-card">
              <h3>Smart Badges</h3>
              <p>Scan the badge to instantly view and verify your profile in real time.</p>
            </div>
            <div className="service-card">
              <h3>Custom Integrations</h3>
              <p>Connect profiles with mobile apps, cloud sync, and business systems.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact page-section">
        <div className="contact-hero">
          <h2>Get In Touch</h2>
          <p>We’d love to hear from you. Let’s start a conversation!</p>
        </div>

        <div className="contact-cards">
          <a className="contact-card" href="mailto:hello@nanoprofiles.com">
            <div className="contact-icon">@</div>
            <div className="contact-title">Email Us</div>
            <div className="contact-sub">Send us an email anytime</div>
            <div className="contact-value">hello@nanoprofiles.com</div>
          </a>

          <a className="contact-card" href="tel:+919121428210">
            <div className="contact-icon">☎</div>
            <div className="contact-title">Call Us</div>
            <div className="contact-sub">Mon–Fri from 9am to 6pm</div>
            <div className="contact-value">+91 91214 28210</div>
          </a>

          <a className="contact-card" href="#contact" onClick={(e) => e.preventDefault()}>
            <div className="contact-icon">⌁</div>
            <div className="contact-title">Visit Us</div>
            <div className="contact-sub">Come say hello</div>
            <div className="contact-value">Hyderabad, India</div>
          </a>

          <a className="contact-card" href="https://instagram.com" target="_blank" rel="noreferrer">
            <div className="contact-icon">⟡</div>
            <div className="contact-title">Follow Us</div>
            <div className="contact-sub">Stay updated with our latest</div>
            <div className="contact-value">@nanoprofiles</div>
          </a>

          <a className="contact-card" href="https://wa.me/919121428210" target="_blank" rel="noreferrer">
            <div className="contact-icon">✆</div>
            <div className="contact-title">WhatsApp Us</div>
            <div className="contact-sub">Chat with us directly</div>
            <div className="contact-value">Message Us</div>
          </a>
        </div>

        <div className="contact-form-container">
          <div className="contact-form">
            <h3>Send us a Message</h3>
            <form onSubmit={handleSubmit}>
              <input name="name" type="text" placeholder="Your Name" required />
              <input name="email" type="email" placeholder="Your Email" required />
              <textarea name="message" placeholder="Your Message" required></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img className="footer-logo" src={navbarLogo} alt="" />
            <div className="footer-brandText">Nano Profiles</div>
            <p>Smart digital identity solutions with NFC technology</p>
            <div className="footer-quote">Just tap to trust</div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
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
    </div>
  );
}

export default App;

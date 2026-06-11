const fs = require('fs');

const file = '../src/pages/ArtistPublicView.js';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  return (
    <div className="artist-public-wrapper">
      <Helmet>
        <title>{nanoProfilesPageTitle}</title>
        <meta name="description" content={\`Check out \${sharePrimaryName} Profile on Nano Profiles. \${[artist?.specialization, artist?.experience].filter(Boolean).join(' • ') || 'Smart Digital Identity Solutions'}.\`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={\`Check out \${sharePrimaryName} Profile on \${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}\`} />
        <meta property="og:description" content={\`Discover \${sharePrimaryName}'s digital footprint.\`} />
        <meta property="og:image" content={fixImageUrl(artist?.photo) || artist?.photo} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={\`Check out \${sharePrimaryName} Profile on Nano Profiles\`} />
        <meta name="twitter:description" content={\`Discover \${sharePrimaryName}'s digital footprint.\`} />
        <meta name="twitter:image" content={fixImageUrl(artist?.photo) || artist?.photo} />
      </Helmet>

      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-brand"><b>NANO</b>PROFILES</div>
        <div className="topbar-handle">
          <span className="live-dot"></span>
          @{artist.username || artist.artistId}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-text">
          {artist.name ? artist.name.charAt(0).toUpperCase() : 'A'}
        </div>

        <div className="hero-top">
          <div className="profile-chip">
            <span className="profile-chip-dot"></span>
            Artist Profile
          </div>
          <div className="nano-badge">Nano Profiles</div>
        </div>

        <div className="hero-name-block">
          <div className="name-eyebrow">Digital Footprint · {artist.location || 'Global'}</div>
          <h1>
            {artist.name ? (
              <>
                {artist.name.split(' ')[0]}<br/>
                {artist.name.split(' ').length > 1 && (
                  <><em>{artist.name.split(' ')[1]}</em><br/></>
                )}
                {artist.name.split(' ').slice(2).join(' ')}
              </>
            ) : 'ARTIST'}
          </h1>
          <p className="hero-sub">{artist.bio || 'Smart Digital Identity for modern creators and professionals.'}</p>
          <div className="roles">
            {artist.specialization && <div className="role-pill red">{artist.specialization}</div>}
            {artist.experience && <div className="role-pill">{artist.experience}</div>}
            {(!artist.specialization && !artist.experience) && (
              <div className="role-pill">Artist</div>
            )}
          </div>
        </div>

        <div className="hero-bottom">
          <div className="handle-text">
            nanoprofiles.com/artist
            <span>?id={artist.artistId}</span>
          </div>
          <div className="scroll-cue">
            Explore
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M2 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="section about-section">
        <div className="section-head">
          <div className="section-num">01</div>
          <div className="section-title">About</div>
        </div>
        <div className="about-inner">
          <div className="about-label">
            A passionate<br/><em>creative</em><br/>mind.
          </div>
          <div className="about-body">
            {artist.bio || "This artist hasn't added a bio yet."}
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* WHAT I DO (Services / Artworks) */}
      <section className="section">
        <div className="section-head">
          <div className="section-num">02</div>
          <div className="section-title">What I Do</div>
        </div>
        <div className="services-grid">
          {artItems && artItems.length > 0 ? artItems.map((item, i) => (
            <div className="service-card" key={i} onClick={() => {
              navigate('/show-my-art', {
                state: {
                  artItems: [item],
                  artistName: artist.name
                }
              });
            }}>
              {item.images && item.images[0] ? (
                <img src={fixImageUrl(item.images[0])} className="service-img-preview" alt="art" />
              ) : (
                <span className="service-icon">🗿</span>
              )}
              <div className="service-name">{item.title || 'Untitled'}</div>
              <div className="service-desc">{item.description || 'View details'}</div>
            </div>
          )) : (
            <div className="service-card">
              <span className="service-icon">🎨</span>
              <div className="service-name">Commissions</div>
              <div className="service-desc">Custom artwork commissions — DM to collaborate on a one-of-a-kind piece.</div>
            </div>
          )}
        </div>
      </section>

      {/* CONNECT */}
      <section className="section connect-section">
        <div className="section-head">
          <div className="section-num">03</div>
          <div className="section-title">Connect</div>
        </div>
        <div className="connect-cards">
          {primaryLinks.map((link, i) => {
            // Provide a fallback for link.title if missing
            const fallbackTitle = link.id.charAt(0).toUpperCase() + link.id.slice(1);
            let displayValue = \`@\${link.url.split('/').pop()}\`;
            // Handle specific URL types like whatsapp or website
            if (link.id === 'website' || link.id === 'portfolio') {
              displayValue = new URL(link.url).hostname.replace('www.', '');
            } else if (link.id === 'whatsapp') {
              displayValue = 'Message Us';
            } else if (link.id === 'email') {
              displayValue = link.url.replace('mailto:', '');
            }
            
            return (
              <a className="connect-card" href={link.url} target="_blank" rel="noopener noreferrer" key={i}>
                <div className="connect-card-left">
                  <div className="connect-platform">{link.title || fallbackTitle}</div>
                  <div className="connect-value">{displayValue}</div>
                </div>
                <div className="connect-arrow">↗</div>
              </a>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <div className="footer-headline">Discover this digital<br/>footprint — and create yours.</div>
          <div className="footer-sub">NANOPROFILES.COM · Smart Digital Identity Solutions</div>
        </div>
        <a className="footer-cta" href={\`https://\${process.env.REACT_APP_DOMAIN || 'nanoprofiles.com'}\`} target="_blank" rel="noopener noreferrer">
          Create Profile →
        </a>
      </footer>
    </div>
  );
}

export default ArtistPublicView;
`;

const lines = content.split('\n');
const returnIndex = lines.findIndex((line, i) => line.includes('return (') && i > 350);

if (returnIndex !== -1) {
  const newContent = lines.slice(0, returnIndex).join('\n') + '\n' + replacement;
  fs.writeFileSync(file, newContent);
  console.log('Successfully updated ArtistPublicView.js');
} else {
  console.log('Could not find the return block to replace.');
}

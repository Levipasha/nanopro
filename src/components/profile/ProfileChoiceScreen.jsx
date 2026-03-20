import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function ProfileChoiceScreen({
  displayName,
  displayEmail,
  profileLock,
  choiceSource,
  generalProfile,
  restaurantProfile,
  handleSelectArtistMode,
  handleSelectGeneralMode,
  handleSelectRestaurantMode,
}) {
  return (
    <div className="profile-page profile-login-wrap">
      <div className="profile-login-card profile-choice-card">
        <div className="profile-login-header">
          <div className="profile-icon">
            <DotLottieReact
              src="https://lottie.host/8ee04dfa-c385-45ce-b652-6a37f232bbe5/aXjGCND8pC.lottie"
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <h1>
            {displayName && displayName.includes('@')
              ? 'Welcome!'
              : `Welcome, ${(displayName || 'Profile').split(' ')[0]}`}
          </h1>
          {displayEmail ? (
            <p className="profile-header-email" title={displayEmail}>
              {displayEmail}
            </p>
          ) : null}
          <p className="profile-header-sub">Select which profile you'd like to manage today</p>
        </div>

        <div className="profile-choice-grid">
          {!profileLock && !choiceSource && !generalProfile && !restaurantProfile && (
            <button className="neo-card neo-card-artist" onClick={handleSelectArtistMode}>
              <div className="neo-card-content">
                <p className="neo-card-plan">Artist Profile</p>
                <div className="neo-card-tagline">🎨 Portfolio &amp; NFC</div>
                <ul className="neo-check-list">
                  <li className="neo-check-item">
                    <svg viewBox="0 0 30 30" width="16" height="16">
                      <path
                        d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                        fill="#05060f"
                      />
                    </svg>
                    Art Gallery &amp; Portfolio
                  </li>
                  <li className="neo-check-item">
                    <svg viewBox="0 0 30 30" width="16" height="16">
                      <path
                        d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                        fill="#05060f"
                      />
                    </svg>
                    Social Links
                  </li>
                  <li className="neo-check-item">
                    <svg viewBox="0 0 30 30" width="16" height="16">
                      <path
                        d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                        fill="#05060f"
                      />
                    </svg>
                    Custom Themes
                  </li>
                  <li className="neo-check-item">
                    <svg viewBox="0 0 30 30" width="16" height="16">
                      <path
                        d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                        fill="#05060f"
                      />
                    </svg>
                    NFC Tap Ready
                  </li>
                </ul>
              </div>
            </button>
          )}

          {profileLock !== 'artist' && (
            <>
              <button className="neo-card neo-card-general" onClick={handleSelectGeneralMode}>
                <div className="neo-card-content">
                  <p className="neo-card-plan">General Profile</p>
                  <div className="neo-card-tagline">🔗 Link-in-Bio</div>
                  <ul className="neo-check-list">
                    <li className="neo-check-item">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Custom Links &amp; Socials
                    </li>
                    <li className="neo-check-item">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Multiple Themes
                    </li>
                    <li className="neo-check-item">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Photo &amp; Bio
                    </li>
                    <li className="neo-check-item">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      NFC Tap Ready
                    </li>
                  </ul>
                </div>
              </button>

              <button
                className="neo-card neo-card-restaurant"
                onClick={handleSelectRestaurantMode}
              >
                <div className="neo-card-content">
                  <p className="neo-card-plan">Restaurant</p>
                  <div className="neo-card-tagline">🍽️ Tap to Order</div>
                  <ul className="neo-check-list">
                    <li className="neo-check-item">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Digital Menu (PDF)
                    </li>
                    <li className="neo-check-item">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Contact &amp; Location
                    </li>
                    <li className="neo-check-item">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Custom Themes
                    </li>
                    <li className="neo-check-item">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      NFC Tap Ready
                    </li>
                  </ul>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


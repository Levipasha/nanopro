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
          <p className="profile-header-sub">Which profile fits you?</p>
        </div>

        <div className="profile-choice-grid">
          {!profileLock && !choiceSource && !generalProfile && !restaurantProfile && (
            <button
              className="profile-product-card profile-product-card--artist"
              onClick={handleSelectArtistMode}
              type="button"
            >
              <div className="profile-product-media profile-product-media--artist">
                <div className="profile-product-icon-circle" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    className="profile-product-media-icon"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" />
                    <path d="M7.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M11.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M15.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  </svg>
                </div>
              </div>

              <div className="profile-product-body">
                <p className="profile-product-plan">Artist Profile</p>
                <div className="profile-product-tagline">Portfolio &amp; NFC</div>
                <ul className="profile-product-features">
                  <li className="profile-product-feature">
                    <svg viewBox="0 0 30 30" width="16" height="16">
                      <path
                        d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                        fill="#05060f"
                      />
                    </svg>
                    Art Gallery &amp; Portfolio
                  </li>
                  <li className="profile-product-feature">
                    <svg viewBox="0 0 30 30" width="16" height="16">
                      <path
                        d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                        fill="#05060f"
                      />
                    </svg>
                    Social Links
                  </li>
                  <li className="profile-product-feature">
                    <svg viewBox="0 0 30 30" width="16" height="16">
                      <path
                        d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                        fill="#05060f"
                      />
                    </svg>
                    Custom Themes
                  </li>
                  <li className="profile-product-feature">
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

              <div className="profile-product-footer">
                <span className="profile-product-cta">
                  <svg viewBox="0 0 24 24" className="profile-product-cta-heart" aria-hidden="true">
                    <path d="M12 21s-7-4.534-9.5-8.5C.5 9 2.5 6 5.5 6c1.74 0 3.41.81 4.5 2.09C11.09 6.81 12.76 6 14.5 6c3 0 5 3 3 6.5C19 16.466 12 21 12 21z" />
                  </svg>
                  Create Profile
                </span>
              </div>
            </button>
          )}

          {profileLock !== 'artist' && (
            <>
              <button
                className="profile-product-card profile-product-card--general"
                onClick={handleSelectGeneralMode}
                type="button"
              >
                <div className="profile-product-media profile-product-media--general">
                  <div className="profile-product-icon-circle" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      className="profile-product-media-icon"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 15l6 -6" />
                      <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
                      <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
                    </svg>
                  </div>
                </div>

                <div className="profile-product-body">
                  <p className="profile-product-plan">General Profile</p>
                  <div className="profile-product-tagline">Link-in-Bio</div>
                  <ul className="profile-product-features">
                    <li className="profile-product-feature">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Custom Links &amp; Socials
                    </li>
                    <li className="profile-product-feature">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Multiple Themes
                    </li>
                    <li className="profile-product-feature">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Photo &amp; Bio
                    </li>
                    <li className="profile-product-feature">
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

                <div className="profile-product-footer">
                  <span className="profile-product-cta">
                    <svg viewBox="0 0 24 24" className="profile-product-cta-heart" aria-hidden="true">
                      <path d="M12 21s-7-4.534-9.5-8.5C.5 9 2.5 6 5.5 6c1.74 0 3.41.81 4.5 2.09C11.09 6.81 12.76 6 14.5 6c3 0 5 3 3 6.5C19 16.466 12 21 12 21z" />
                    </svg>
                    Create Profile
                  </span>
                </div>
              </button>

              <button
                className="profile-product-card profile-product-card--restaurant"
                onClick={handleSelectRestaurantMode}
                type="button"
              >
                <div className="profile-product-media profile-product-media--restaurant">
                  <div className="profile-product-icon-circle" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      className="profile-product-media-icon"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12zm0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
                    </svg>
                  </div>
                </div>

                <div className="profile-product-body">
                  <p className="profile-product-plan">Restaurant</p>
                  <div className="profile-product-tagline">Tap to Order</div>
                  <ul className="profile-product-features">
                    <li className="profile-product-feature">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Digital Menu (PDF)
                    </li>
                    <li className="profile-product-feature">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Contact &amp; Location
                    </li>
                    <li className="profile-product-feature">
                      <svg viewBox="0 0 30 30" width="16" height="16">
                        <path
                          d="M27.5 7.53l-3.035-2.988a.786.786 0 0 0-1.117 0L11.035 16.668l-4.21-4.145a.786.786 0 0 0-1.122 0L2.641 15.54a.786.786 0 0 0 0 1.1l7.804 7.684a.786.786 0 0 0 1.122 0L27.5 8.633a.786.786 0 0 0 0-1.102z"
                          fill="#05060f"
                        />
                      </svg>
                      Custom Themes
                    </li>
                    <li className="profile-product-feature">
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

                <div className="profile-product-footer">
                  <span className="profile-product-cta">
                    <svg viewBox="0 0 24 24" className="profile-product-cta-heart" aria-hidden="true">
                      <path d="M12 21s-7-4.534-9.5-8.5C.5 9 2.5 6 5.5 6c1.74 0 3.41.81 4.5 2.09C11.09 6.81 12.76 6 14.5 6c3 0 5 3 3 6.5C19 16.466 12 21 12 21z" />
                    </svg>
                    Create Profile
                  </span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import SchoolBadge3D from '../../SchoolBadge3D';
import RestaurantBadge3D from '../../RestaurantBadge3D';
import ArtistBadge3D from '../../ArtistBadge3D';
import CustomizeBadge3D from '../../CustomizeBadge3D';

export default function HomeProducts() {
    const [productSlide, setProductSlide] = useState(0);
    const PRODUCT_SLIDES = 4;

    useEffect(() => {
        const timer = setInterval(() => {
            setProductSlide((prev) => (prev + 1) % PRODUCT_SLIDES);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    return (
        <section id="products" className="info-section page-section">
            <div className="info-inner">
                <h2>Our Products</h2>
                <div className="products-slideshow">
                    <button
                        type="button"
                        className="products-slide-btn products-slide-prev"
                        onClick={() => setProductSlide((p) => (p - 1 + PRODUCT_SLIDES) % PRODUCT_SLIDES)}
                        aria-label="Previous"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18 4L18 20L6 12z" /></svg>
                    </button>

                    <div className="products-slide-track" style={{ transform: `translateX(-${productSlide * 100}%)` }}>
                        <div className={`product-slide ${productSlide === 0 ? 'is-current' : ''}`}>
                            <div className="product-slide-3d">
                                <div className="product-cover artist-cover"><ArtistBadge3D /></div>
                            </div>
                            <div className="product-slide-text">
                                <h3 className="product-slide-title">Artist</h3>
                                <div className="product-slide-divider" />
                                <p className="product-slide-desc">Creative portfolios on NFC tags</p>
                            </div>
                        </div>

                        <div className={`product-slide ${productSlide === 1 ? 'is-current' : ''}`}>
                            <div className="product-slide-3d">
                                <div className="product-cover school-cover"><SchoolBadge3D /></div>
                            </div>
                            <div className="product-slide-text">
                                <h3 className="product-slide-title">School</h3>
                                <div className="product-slide-divider" />
                                <p className="product-slide-desc">Digital ID cards for students and staff</p>
                            </div>
                        </div>

                        <div className={`product-slide ${productSlide === 2 ? 'is-current' : ''}`}>
                            <div className="product-slide-3d">
                                <div className="product-cover office-cover"><RestaurantBadge3D /></div>
                            </div>
                            <div className="product-slide-text">
                                <h3 className="product-slide-title">Restaurant</h3>
                                <div className="product-slide-divider" />
                                <p className="product-slide-desc">Tap to get menu and bills</p>
                            </div>
                        </div>

                        <div className={`product-slide ${productSlide === 3 ? 'is-current' : ''}`}>
                            <div className="product-slide-3d">
                                <div className="product-cover customize-cover"><CustomizeBadge3D /></div>
                            </div>
                            <div className="product-slide-text">
                                <h3 className="product-slide-title">Customize Cards</h3>
                                <div className="product-slide-divider" />
                                <p className="product-slide-desc">Design your own NFC cards</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="products-slide-btn products-slide-next"
                        onClick={() => setProductSlide((p) => (p + 1) % PRODUCT_SLIDES)}
                        aria-label="Next"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 4L6 20L18 12z" /></svg>
                    </button>

                    <div className="products-dots">
                        {[...Array(PRODUCT_SLIDES)].map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`products-dot ${i === productSlide ? 'active' : ''}`}
                                onClick={() => setProductSlide(i)}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}


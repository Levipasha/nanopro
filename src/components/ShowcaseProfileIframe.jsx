import React, { useRef, useEffect, useCallback } from 'react';
import { SHOWCASE_EMBED_HEIGHT_MSG } from '../constants/showcaseEmbed';
import './ShowcaseProfileIframe.css';

/**
 * Showcase preview iframe: appends embed=1 so the child reports height; parent
 * stretches the iframe so scrolling happens on the main page, not inside the frame.
 */
export default function ShowcaseProfileIframe({ title, src, className = '' }) {
    const iframeRef = useRef(null);
    const builtSrc = src.includes('?') ? `${src}&embed=1` : `${src}?embed=1`;

    const onMessage = useCallback((e) => {
        if (e.origin !== window.location.origin) return;
        if (e.data?.type !== SHOWCASE_EMBED_HEIGHT_MSG || typeof e.data.height !== 'number') {
            return;
        }
        const el = iframeRef.current;
        if (!el) return;
        const h = Math.max(240, Math.ceil(e.data.height));
        el.style.height = `${h}px`;
    }, []);

    useEffect(() => {
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [onMessage]);

    return (
        <iframe
            ref={iframeRef}
            title={title}
            src={builtSrc}
            className={['showcase-profile-iframe', className].filter(Boolean).join(' ')}
        />
    );
}

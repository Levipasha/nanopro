import { useEffect } from 'react';
import { SHOWCASE_EMBED_HEIGHT_MSG } from '../constants/showcaseEmbed';

/**
 * When profile is loaded in a showcase iframe (?embed=1), report document height
 * to the parent so the iframe can grow and the main page scrolls instead.
 */
export function useShowcaseEmbedHeight(enabled) {
    useEffect(() => {
        if (!enabled) return;
        if (window.parent === window) return;

        const send = () => {
            const h = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight
            );
            window.parent.postMessage(
                { type: SHOWCASE_EMBED_HEIGHT_MSG, height: h },
                window.location.origin
            );
        };

        send();
        const t1 = window.setTimeout(send, 50);
        const t2 = window.setTimeout(send, 350);
        const t3 = window.setTimeout(send, 1200);

        window.addEventListener('load', send);
        window.addEventListener('resize', send);
        const ro =
            typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(() => send())
                : null;
        if (ro) {
            ro.observe(document.documentElement);
            ro.observe(document.body);
        }

        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.clearTimeout(t3);
            window.removeEventListener('load', send);
            window.removeEventListener('resize', send);
            if (ro) ro.disconnect();
        };
    }, [enabled]);
}

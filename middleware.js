/**
 * For crawlers (WhatsApp, Telegram, etc.) requesting /link/:username,
 * serve HTML with Open Graph meta so the shared link shows a card preview.
 */
const BOT_UA =
  /bot|crawler|spider|facebookexternalhit|WhatsApp|Telegram|Twitter|Slurp|Discord|embed|googlebot|bingbot|Slack|LinkedIn|Pinterest/i;

function isBot(userAgent) {
  return userAgent && BOT_UA.test(userAgent);
}

export const config = {
  matcher: ['/link/:path*'],
};

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!isBot(ua)) {
    return fetch(request);
  }

  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/link\/([^/]+)/);
  const username = pathMatch && pathMatch[1] ? pathMatch[1] : null;
  if (!username) {
    return fetch(request);
  }

  const origin = url.origin;
  const ogUrl = `${origin}/api/og-link?username=${encodeURIComponent(username)}`;
  try {
    const res = await fetch(ogUrl, {
      headers: { Accept: 'text/html' },
    });
    const html = await res.text();
    return new Response(html, {
      status: res.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    return fetch(request);
  }
}

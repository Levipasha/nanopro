/**
 * Returns HTML with Open Graph and Twitter Card meta for /link/:username.
 * Used when crawlers (WhatsApp, Telegram, etc.) request a profile link so the preview shows a card.
 */
function absoluteImageUrl(url, apiBase) {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  if (t.startsWith('https://') || t.startsWith('http://')) {
    return t.includes('cloudinary.com') && t.startsWith('http://') ? t.replace('http://', 'https://') : t;
  }
  if (t.startsWith('res.cloudinary.com') || t.includes('cloudinary.com')) {
    return t.startsWith('http') ? t : `https://${t}`;
  }
  if (t.startsWith('/')) return apiBase ? `${apiBase.replace(/\/$/, '')}${t}` : null;
  return `https://${t}`;
}

export default async function handler(req, res) {
  const username = req.query?.username;
  if (!username) {
    res.status(400).send('Missing username');
    return;
  }

  const apiBase = process.env.REACT_APP_API_URL || process.env.API_URL || '';
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host']
        ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
        : 'https://nanoprofiles.com');
  const linkUrl = `${baseUrl.replace(/\/$/, '')}/link/${encodeURIComponent(username)}`;

  let profile = null;
  try {
    const apiUrl = apiBase
      ? `${apiBase.replace(/\/$/, '')}/api/general-profile/u/${encodeURIComponent(username)}`
      : `${baseUrl}/api/general-profile/u/${encodeURIComponent(username)}`;
    const r = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
    const data = await r.json().catch(() => ({}));
    if (data.success && data.data) profile = data.data;
  } catch (e) {
    console.error('og-link fetch error', e);
  }

  const title = profile
    ? `${profile.name || 'Profile'} | Nano Profiles`
    : 'Nano Profiles';
  const description = profile
    ? (profile.title || profile.bio || 'Smart Digital Identity Solutions')
    : 'Smart Digital Identity Solutions';
  const image = profile
    ? absoluteImageUrl(profile.photo, apiBase) || `${baseUrl}/favicon.png`
    : `${baseUrl}/favicon.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(linkUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:site_name" content="Nano Profiles" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(linkUrl)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(linkUrl)}" />
  <link rel="canonical" href="${escapeHtml(linkUrl)}" />
</head>
<body><p>Redirecting to <a href="${escapeHtml(linkUrl)}">profile</a>...</p></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
}

function escapeHtml(s) {
  if (s == null) return '';
  const str = String(s);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

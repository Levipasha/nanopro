/**
 * Returns HTML with Open Graph and Twitter Card meta for /artist?id=<id>.
 * Crawlers get artist image + name in the card. Set REACT_APP_API_URL (or API_URL)
 * in Vercel to your backend so this can fetch artist data.
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

module.exports = async function handler(req, res) {
  const id = req.query?.id;
  if (!id) {
    res.status(400).send('Missing artist id');
    return;
  }

  const apiBase = process.env.REACT_APP_API_URL || process.env.API_URL || '';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL || 'nanoprofiles.com';
  const baseUrl = (host ? `${proto}://${host}` : 'https://nanoprofiles.com').replace(/\/$/, '');
  const linkUrl = `${baseUrl}/artist?id=${encodeURIComponent(id)}`;

  let artist = null;
  try {
    const apiUrl = apiBase
      ? `${apiBase.replace(/\/$/, '')}/api/artist/public/${encodeURIComponent(id)}`
      : `${baseUrl}/api/artist/public/${encodeURIComponent(id)}`;
    
    // Fallback for local development if apiBase is not set
    const finalApiUrl = apiUrl.startsWith('http') ? apiUrl : `http://localhost:5000/api/artist/public/${encodeURIComponent(id)}`;
    
    const r = await fetch(finalApiUrl, { headers: { Accept: 'application/json' } });
    const data = await r.json().catch(() => ({}));
    if (data.success && data.data) {
      artist = data.data;
    } else if (data.name) {
      // Backend might return the object directly
      artist = data;
    }
  } catch (e) {
    console.error('og-artist fetch error', e);
  }

  const title = artist
    ? `${artist.name || 'Artist Profile'} | Nano Profiles`
    : 'Artist Profile | Nano Profiles';
  const description = artist
    ? (artist.specialization || artist.bio || 'Smart Digital Identity Solutions for Artists')
    : 'Smart Digital Identity Solutions for Artists';
  const image = artist && (artist.photo || artist.photoUrl)
    ? absoluteImageUrl(artist.photo || artist.photoUrl, apiBase)
    : null;
  const imageUrl = image || `${baseUrl}/favicon.png`;
  const imageAlt = artist ? escapeHtml(artist.name || 'Artist Profile') : 'Nano Profiles';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content="${escapeHtml(linkUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:width" content="400" />
  <meta property="og:image:height" content="400" />
  <meta property="og:image:alt" content="${imageAlt}" />
  <meta property="og:site_name" content="Nano Profiles" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(linkUrl)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:image:alt" content="${imageAlt}" />
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

/**
 * Service Worker Kill-Switch
 *
 * This SW replaces any previously installed Workbox/CRA service worker that was
 * blocking cross-origin API calls to the Railway backend with "no-response" errors.
 *
 * On activation it:
 *   1. Clears ALL caches so stale responses don't persist.
 *   2. Immediately claims all open clients (tabs).
 *   3. Does NOT intercept any fetch requests — all requests go straight to the network.
 */

self.addEventListener('install', (event) => {
  // Skip waiting so this SW becomes active immediately without needing a tab reload.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Delete all caches created by the old Workbox service worker.
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // 2. Take control of all open tabs immediately.
      await clients.claim();

      // 3. Unregister self so this SW doesn't persist longer than needed.
      //    The next page load will have zero service workers running.
      const registration = await self.registration;
      await registration.unregister();
    })()
  );
});

// Do NOT intercept fetch — let everything go to the network.

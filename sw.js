// Service worker of the games page. It is here so browsers (Samsung Internet in particular) install the page
// as an app instead of a home-screen shortcut that opens a new tab each time. No offline cache: the page's
// own files go to the network as usual, and everything else (the games, other sites) is left to the browser.
const OWN = new Set(["/", "/index.html", "/style.css", "/manifest.webmanifest"]);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!OWN.has(url.pathname) && !url.pathname.startsWith("/icons/") && !url.pathname.startsWith("/images/")) return;
  event.respondWith(fetch(event.request));
});

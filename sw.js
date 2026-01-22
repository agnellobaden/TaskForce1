// Service Worker for TaskForce PWA - PRODUCTION READY
const CACHE_NAME = 'taskforce-v18'; // Version erhöht
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './modern-theme.css',
    './professional-forms.css',
    './calendar-voice.css',
    './calibration.css',
    './mobile-night.css',
    './mobile-nav.css',
    './mobile-sidebar.css',
    './mobile-fixes.css',
    './mobile-button-fix.css',
    './mobile-menu-fab.css',
    './hero-cards.css',
    './mobile-optimize.css',
    './mobile-optimizations.css',
    './button-toolbar.css',
    './private_styles.css',
    './blinking.css',
    './card-resize.css',
    './icon-styles.css',
    './menu-styles.css',
    './premium-styles.css'
];

// Install event
self.addEventListener('install', (event) => {
    console.log('[SW] Installing v18...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cache opened');
                return cache.addAll(urlsToCache);
            })
            .catch((err) => {
                console.error('[SW] Cache failed:', err);
            })
    );
    self.skipWaiting();
});

// Activate event - Lösche alte Caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating v18...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - KORRIGIERTE STRATEGIE
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignoriere andere Protokolle
    if (!url.protocol.startsWith('http')) return;

    // STRATEGIE 1: Network-First für HTML/JS (Updates sofort)
    if (url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname === '/' || url.pathname === './') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response.clone());
                        });
                    }
                    return response;
                })
                .catch(() => {
                    console.log('[SW] Offline, using cache');
                    return caches.match(event.request);
                })
        );
    }
    // STRATEGIE 2: Stale-While-Revalidate für CSS
    else if (url.pathname.endsWith('.css')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);
                return cachedResponse || fetchPromise;
            })
        );
    }
    // STRATEGIE 3: Cache-First für Bilder/Assets
    else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff|woff2)$/)) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                });
            })
        );
    }
    // STRATEGIE 4: Network-Only für APIs
    else {
        event.respondWith(fetch(event.request));
    }
});

// Push notification event
self.addEventListener('push', (event) => {
    let data = { title: 'TaskForce', body: 'Du hast dringende Aufgaben!' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        data.body = event.data ? event.data.text() : data.body;
    }

    const options = {
        body: data.body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200, 100, 400],
        requireInteraction: true,
        tag: 'taskforce-alert',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '⚡ TaskForce', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Finde existierenden Tab
            for (const client of clientList) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Oder öffne neuen
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});

console.log('[SW] Service Worker loaded - Version:', CACHE_NAME);

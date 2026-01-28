import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { firebaseConfig } from '../lib/firebase_constants';

declare let self: ServiceWorkerGlobalScope;

// Initialize Firebase in Service Worker
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification?.title || 'Conecta IEEE';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/assets/android-launchericon-192-192.png', // Adjust path if needed
        data: payload.data
    };

    (self as any).registration.showNotification(notificationTitle, notificationOptions);
});

cleanupOutdatedCaches();
(self as any).skipWaiting();
clientsClaim();

// Precache resources registered by VitePWA
precacheAndRoute(self.__WB_MANIFEST);

// Cache Supabase API
registerRoute(
    ({ url }) => url.hostname.includes('supabase.co'),
    new NetworkFirst({
        cacheName: 'supabase-api',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
            })
        ]
    })
);

// Cache Images
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            }),
        ]
    })
);

// Cache Static Resources
registerRoute(
    ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'worker',
    new StaleWhileRevalidate({
        cacheName: 'static-resources'
    })
);

// Offline Page - Strategy: NetworkOnly (default), catch -> return offline page if nav
// Note: workbox-routing catch handler
// Simple implementation:
const OFFLINE_PAGE = '/offline.html';

// For navigation requests, try network, fall back to offline page
registerRoute(
    ({ request }) => request.mode === 'navigate',
    async ({ event }) => {
        try {
            return await fetch(event.request);
        } catch (error) {
            return caches.match(OFFLINE_PAGE) || new Response("Offline", { status: 200, headers: { 'Content-Type': 'text/html' } });
        }
    }
);

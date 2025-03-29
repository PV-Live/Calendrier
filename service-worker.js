/**
 * Calendrier Leo - Service Worker
 * Gère la mise en cache et les fonctionnalités hors ligne
 */

// Version du cache - à incrémenter lors des mises à jour
const CACHE_VERSION = 'v2';
const CACHE_NAME = `calendrier-leo-cache-${CACHE_VERSION}`;

// Fichiers à mettre en cache
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/settings.html',
    '/offline.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/mistral-api.js',
    '/js/calendar-utils.js',
    '/js/settings.js',
    '/manifest.json',
    '/images/icons/icon-72x72.png',
    '/images/icons/icon-96x96.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-384x384.png',
    '/images/icons/icon-512x512.png'
];

// Installation du service worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installation en cours');
    
    // Forcer l'activation immédiate sans attendre la fermeture des onglets
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Mise en cache des fichiers');
                return cache.addAll(FILES_TO_CACHE);
            })
    );
});

// Activation du service worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activation en cours');
    
    // Supprimer les anciens caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Prendre le contrôle immédiatement de toutes les pages
    return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
    console.log('Service Worker: Interception de la requête', event.request.url);
    
    // Stratégie : Cache First, puis réseau
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Vérifier si la ressource est dans le cache
                if (response) {
                    console.log('Service Worker: Réponse depuis le cache pour', event.request.url);
                    return response;
                }
                
                // Si la ressource n'est pas dans le cache, la récupérer depuis le réseau
                console.log('Service Worker: Récupération depuis le réseau pour', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // Ne pas mettre en cache les réponses non valides
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Mettre en cache la nouvelle ressource
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch(error => {
                        // En cas d'erreur réseau et si la requête concerne une page HTML
                        if (event.request.url.match(/\.(html)$/)) {
                            return caches.match('/offline.html');
                        }
                        
                        console.error('Service Worker: Erreur de récupération', error);
                        throw error;
                    });
            })
    );
});

// Gestion des messages
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
